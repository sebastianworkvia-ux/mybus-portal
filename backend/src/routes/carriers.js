import express from 'express'
import {
  getCarriers,
  getCarrierById,
  getMyCarrier,
  createCarrier,
  updateCarrier,
  deleteCarrier
} from '../controllers/carrierController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getCarriers)
router.get('/me', authMiddleware, getMyCarrier) // PRZED /:id!
router.get('/:id', getCarrierById)
router.post('/', authMiddleware, createCarrier)
router.put('/', authMiddleware, updateCarrier)
router.delete('/', authMiddleware, deleteCarrier)

export default router
