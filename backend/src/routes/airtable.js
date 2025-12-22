import express from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import Carrier from '../models/Carrier.js'
import User from '../models/User.js'
import {
  syncAllCarriersToSheets,
  syncAllUsersToSheets,
  syncCarrierToSheets,
  syncUserToSheets
} from '../services/googleSheetsService.js'

const router = express.Router()

// Synchronizuj wszystkich przewoźników (tylko admin)
router.post('/sync/carriers', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const carriers = await Carrier.find()
    const results = await syncAllCarriersToSheets(carriers)
    
    res.json({
      message: 'Synchronizacja przewoźników zakończona',
      ...results
    })
  } catch (error) {
    next(error)
  }
})

// Synchronizuj wszystkich użytkowników (tylko admin)
router.post('/sync/users', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const users = await User.find().select('-password')
    const results = await syncAllUsersToSheets(users)
    
    res.json({
      message: 'Synchronizacja użytkowników zakończona',
      ...results
    })
  } catch (error) {
    next(error)
  }
})

// Synchronizuj wszystkie dane (przewoźnicy + użytkownicy)
router.post('/sync/all', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const carriers = await Carrier.find()
    const users = await User.find().select('-password')
    
    const carrierResults = await syncAllCarriersToSheets(carriers)
    const userResults = await syncAllUsersToSheets(users)
    
    res.json({
      message: 'Pełna synchronizacja zakończona',
      carriers: carrierResults,
      users: userResults
    })
  } catch (error) {
    next(error)
  }
})

// Synchronizuj pojedynczego przewoźnika
router.post('/sync/carrier/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const carrier = await Carrier.findById(req.params.id)
    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' })
    }
    
    await syncCarrierToSheets(carrier)
    res.json({ message: 'Przewoźnik zsynchronizowany', carrier: carrier.companyName })
  } catch (error) {
    next(error)
  }
})

// Synchronizuj pojedynczego użytkownika
router.post('/sync/user/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    await syncUserToSheets(user)
    res.json({ message: 'Użytkownik zsynchronizowany', user: user.email })
  } catch (error) {
    next(error)
  }
})

export default router
