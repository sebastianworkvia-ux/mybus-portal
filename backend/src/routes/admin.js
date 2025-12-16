import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import User from '../models/User.js'
import Carrier from '../models/Carrier.js'

const router = express.Router()

// Set user as Premium
router.post('/set-premium/:email', async (req, res) => {
  try {
    const { email } = req.params
    
    // Update User
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isPremium: true },
      { new: true }
    )
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Update Carrier if exists
    const carrier = await Carrier.findOneAndUpdate(
      { userId: user._id },
      { isPremium: true },
      { new: true }
    )
    
    res.json({ 
      message: 'User upgraded to Premium',
      user: {
        email: user.email,
        isPremium: user.isPremium
      },
      carrier: carrier ? {
        companyName: carrier.companyName,
        isPremium: carrier.isPremium
      } : null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
