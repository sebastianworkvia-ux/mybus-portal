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
  getCarriersByRoute
} from '../controllers/carrierController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getCarriers)
router.get('/me', authMiddleware, getMyCarrier) // PRZED /:id!
router.get('/by-destination/:country', getCarriersByDestination) // Przewoźnicy do danego kraju
router.get('/city/:citySlug', getCarriersByCity) // Przewoźnicy z danego miasta
router.get('/route/:fromCity/:toCity', getCarriersByRoute) // Przewoźnicy na trasie
router.get('/:id', getCarrierById)
router.post('/', authMiddleware, createCarrier)
router.put('/', authMiddleware, updateCarrier)
router.delete('/', authMiddleware, deleteCarrier)

export default router
