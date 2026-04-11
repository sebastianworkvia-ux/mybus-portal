import express from 'express'
import {
  getCarriers,
  getCarrierById,
  getMyCarrier,
  createCarrier,
  updateCarrier,
  deleteCarrier,
  getCarriersByDestination,
  getCarriersByCity,
  getCarriersByRoute,
  getCarrierAnalytics,
  trackContactClick
} from '../controllers/carrierController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getCarriers)
router.get('/me', authMiddleware, getMyCarrier) // PRZED /:id!
router.get('/analytics', authMiddleware, getCarrierAnalytics) // PRZED /:id!
router.get('/by-destination/:country', getCarriersByDestination)
router.get('/city/:citySlug', getCarriersByCity)
router.get('/route/:fromCity/:toCity', getCarriersByRoute)
router.get('/:id', getCarrierById)
router.post('/', authMiddleware, createCarrier)
router.post('/:id/click', trackContactClick) // public — śledź kliknięcia w kontakt
router.put('/', authMiddleware, updateCarrier)
router.delete('/', authMiddleware, deleteCarrier)

export default router
