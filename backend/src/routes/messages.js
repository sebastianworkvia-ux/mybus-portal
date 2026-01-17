import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
  sendMessage,
  getConversations,
  getConversationMessages,
  markAsRead,
  getUnreadCount,
  deleteMessage
} from '../controllers/messageController.js'

const router = express.Router()

// Wszystkie endpointy wymagają autoryzacji
router.use(authMiddleware)

// POST /api/messages - wyślij nową wiadomość
router.post('/', sendMessage)

// GET /api/messages/conversations - lista konwersacji (inbox)
router.get('/conversations', getConversations)

// GET /api/messages/unread-count - liczba nieprzeczytanych
router.get('/unread-count', getUnreadCount)

// GET /api/messages/:userId - wiadomości z konkretnym użytkownikiem
router.get('/:userId', getConversationMessages)

// PATCH /api/messages/:userId/read - oznacz wiadomości jako przeczytane
router.patch('/:userId/read', markAsRead)

// DELETE /api/messages/:id - usuń wiadomość
router.delete('/:id', deleteMessage)

export default router
