import express from 'express'
import { adminMiddleware } from '../middleware/auth.js'
import User from '../models/User.js'
import Carrier from '../models/Carrier.js'
import Review from '../models/Review.js'

const router = express.Router()

// Get dashboard statistics
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const [
      totalUsers,
      carriersWithAccount,
      customersWithAccount,
      totalCarrierCompanies,
      verifiedCarriers,
      unverifiedCarriers,
      premiumCarriers,
      carriersWithoutCompany,
      totalReviews,
      recentUsers,
      recentCarriers,
      recentReviews
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ userType: 'carrier' }),
      User.countDocuments({ userType: 'customer' }),
      Carrier.countDocuments(),
      Carrier.countDocuments({ isVerified: true }),
      Carrier.countDocuments({ isVerified: false }),
      Carrier.countDocuments({ isPremium: true }),
      // Przewoźnicy którzy mają konto ale nie zgłosili firmy
      User.countDocuments({ 
        userType: 'carrier',
        _id: { $nin: await Carrier.distinct('userId') }
      }),
      Review.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(10).select('email firstName lastName userType createdAt isPremium'),
      Carrier.find().populate('userId', 'email firstName lastName').sort({ createdAt: -1 }).limit(10).select('companyName isVerified isPremium createdAt userId'),
      Review.find().populate('userId', 'firstName lastName').populate('carrierId', 'companyName').sort({ createdAt: -1 }).limit(5)
    ])

    res.json({
      stats: {
        totalUsers,
        carriersWithAccount,
        customersWithAccount,
        totalCarrierCompanies,
        verifiedCarriers,
        unverifiedCarriers,
        premiumCarriers,
        carriersWithoutCompany,
        totalReviews
      },
      recent: {
        users: recentUsers,
        carriers: recentCarriers,
        reviews: recentReviews
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get users with pagination
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, userType } = req.query
    const query = userType ? { userType } : {}
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
    
    const count = await User.countDocuments(query)
    
    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
