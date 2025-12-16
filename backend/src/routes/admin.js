import express from 'express'
import { adminMiddleware } from '../middleware/auth.js'
import User from '../models/User.js'
import Carrier from '../models/Carrier.js'

const router = express.Router()

// Get all unverified carriers
router.get('/unverified-carriers', adminMiddleware, async (req, res) => {
  try {
    const carriers = await Carrier.find({ isVerified: false })
      .populate('userId', 'email firstName lastName')
      .sort({ createdAt: -1 })
    
    res.json(carriers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Verify carrier
router.post('/verify-carrier/:carrierId', adminMiddleware, async (req, res) => {
  try {
    const { carrierId } = req.params
    
    const carrier = await Carrier.findByIdAndUpdate(
      carrierId,
      { isVerified: true },
      { new: true }
    ).populate('userId', 'email firstName lastName')
    
    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' })
    }
    
    res.json({ 
      message: 'Carrier verified successfully',
      carrier
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Reject carrier
router.post('/reject-carrier/:carrierId', adminMiddleware, async (req, res) => {
  try {
    const { carrierId } = req.params
    
    const carrier = await Carrier.findByIdAndDelete(carrierId)
    
    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' })
    }
    
    res.json({ 
      message: 'Carrier rejected and deleted',
      carrier
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Set user as Premium
router.post('/set-premium/:email', adminMiddleware, async (req, res) => {
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

// Set user as Admin (public endpoint - use once to set yourself as admin)
router.post('/set-admin/:email', async (req, res) => {
  try {
    const { email } = req.params
    const { secretKey } = req.body
    
    // Security: require secret key from environment
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ error: 'Invalid secret key' })
    }
    
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isAdmin: true },
      { new: true }
    )
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json({ 
      message: 'User set as admin',
      user: {
        email: user.email,
        isAdmin: user.isAdmin
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
