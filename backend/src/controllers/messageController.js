import Message from '../models/Message.js'
import User from '../models/User.js'
import Carrier from '../models/Carrier.js'
import mongoose from 'mongoose'

// Wyślij nową wiadomość
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, carrierId, content } = req.body
    const senderId = req.user.id

    if (!receiverId || !content?.trim()) {
      return res.status(400).json({ error: 'Brak odbiorcy lub treści wiadomości' })
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Nie możesz wysłać wiadomości do siebie' })
    }

    // Sprawdź czy odbiorca istnieje
    const receiver = await User.findById(receiverId)
    if (!receiver) {
      return res.status(404).json({ error: 'Odbiorca nie istnieje' })
    }

    const conversationId = Message.generateConversationId(senderId, receiverId)

    const message = await Message.create({
      senderId,
      receiverId,
      carrierId: carrierId || null,
      content: content.trim(),
      conversationId,
      isRead: false
    })

    // Populate sender info dla zwrotu
    await message.populate('senderId', 'firstName lastName email')
    await message.populate('receiverId', 'firstName lastName email')

    res.status(201).json(message)
  } catch (error) {
    next(error)
  }
}

// Pobierz listę konwersacji (inbox)
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id

    // Znajdź wszystkie wiadomości gdzie user jest nadawcą lub odbiorcą
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiverId', new mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ])

    // Populate user info
    const conversations = await Message.populate(messages, {
      path: 'lastMessage.senderId lastMessage.receiverId',
      select: 'firstName lastName email'
    })

    // Format response - dodaj info o rozmówcy
    const formatted = conversations.map(conv => {
      const otherUserId = conv.lastMessage.senderId._id.toString() === userId 
        ? conv.lastMessage.receiverId 
        : conv.lastMessage.senderId

      return {
        conversationId: conv._id,
        otherUser: otherUserId,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount
      }
    })

    res.json(formatted)
  } catch (error) {
    next(error)
  }
}

// Pobierz wiadomości z konkretnej konwersacji
export const getConversationMessages = async (req, res, next) => {
  try {
    const { userId: otherUserId } = req.params
    const currentUserId = req.user.id

    const conversationId = Message.generateConversationId(currentUserId, otherUserId)

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'firstName lastName email')
      .populate('receiverId', 'firstName lastName email')
      .sort({ createdAt: 1 })

    res.json(messages)
  } catch (error) {
    next(error)
  }
}

// Oznacz wiadomości jako przeczytane
export const markAsRead = async (req, res, next) => {
  try {
    const { userId: otherUserId } = req.params
    const currentUserId = req.user.id

    const conversationId = Message.generateConversationId(currentUserId, otherUserId)

    // Oznacz wszystkie nieprzeczytane wiadomości od otherUserId
    await Message.updateMany(
      {
        conversationId,
        receiverId: currentUserId,
        isRead: false
      },
      {
        isRead: true
      }
    )

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

// Pobierz liczbę nieprzeczytanych wiadomości
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id

    const count = await Message.countDocuments({
      receiverId: userId,
      isRead: false
    })

    res.json({ count })
  } catch (error) {
    next(error)
  }
}

// Usuń wiadomość (soft delete - tylko dla nadawcy)
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const message = await Message.findById(id)
    if (!message) {
      return res.status(404).json({ error: 'Wiadomość nie znaleziona' })
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: 'Możesz usuwać tylko swoje wiadomości' })
    }

    await message.deleteOne()
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
