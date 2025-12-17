import express from 'express'
import {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.get('/', getAnnouncements)
router.get('/:id', getAnnouncement)

// Protected routes (require authentication)
router.post('/', authMiddleware, createAnnouncement)
router.delete('/:id', authMiddleware, deleteAnnouncement)

export default router
