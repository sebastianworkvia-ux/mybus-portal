import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { 
  getReviewsByCarrier, 
  createReview, 
  updateReview, 
  deleteReview 
} from '../controllers/reviewController.js'

const router = express.Router()

// Public routes
router.get('/carrier/:carrierId', getReviewsByCarrier)

// Protected routes
router.post('/', authMiddleware, createReview)
router.put('/:reviewId', authMiddleware, updateReview)
router.delete('/:reviewId', authMiddleware, deleteReview)

export default router
