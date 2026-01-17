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
    const allMessages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
      .populate('senderId', 'firstName lastName email')
      .populate('receiverId', 'firstName lastName email')
      .sort({ createdAt: -1 })

    // Grupuj wiadomości po conversationId
    const conversationsMap = new Map()
    
    allMessages.forEach(msg => {
      if (!conversationsMap.has(msg.conversationId)) {
        // Określ kto jest "drugim użytkownikiem"
        const otherUser = msg.senderId._id.toString() === userId 
          ? msg.receiverId 
          : msg.senderId
        
        // Policz nieprzeczytane (gdzie ja jestem odbiorcą)
        const unreadCount = allMessages.filter(m => 
          m.conversationId === msg.conversationId &&
          m.receiverId._id.toString() === userId &&
          !m.isRead
        ).length

        conversationsMap.set(msg.conversationId, {
          conversationId: msg.conversationId,
          otherUser,
          lastMessage: msg,
          unreadCount
        })
      }
    })

    const conversations = Array.from(conversationsMap.values())
    res.json(conversations)
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
