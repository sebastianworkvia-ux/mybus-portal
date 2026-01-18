import express from 'express'
import { adminMiddleware } from '../middleware/auth.js'
import User from '../models/User.js'
import Carrier from '../models/Carrier.js'
import Review from '../models/Review.js'
import PageView from '../models/PageView.js'

const router = express.Router()

// Get dashboard statistics
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    // Daily page views (today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
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
      todayViews,
      todayUniqueSessions,
      totalPageViews,
      recentUsers,
      recentCarriers,
      recentReviews
    ] = await Promise.all([
      User.countDocuments({ isAdmin: { $ne: true } }),
      User.countDocuments({ userType: 'carrier', isAdmin: { $ne: true } }),
      User.countDocuments({ userType: 'customer', isAdmin: { $ne: true } }),
      Carrier.countDocuments(),
      Carrier.countDocuments({ isVerified: true }),
      Carrier.countDocuments({ isVerified: false }),
      Carrier.countDocuments({ isPremium: true }),
      // Przewoźnicy którzy mają konto ale nie zgłosili firmy (bez adminów)
      User.countDocuments({ 
        userType: 'carrier',
        isAdmin: { $ne: true },
        _id: { $nin: await Carrier.distinct('userId') }
      }),
      Review.countDocuments(),
      PageView.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      PageView.distinct('sessionId', { createdAt: { $gte: today, $lt: tomorrow } }),
      PageView.countDocuments(),
      User.find({ isAdmin: { $ne: true } }).sort({ createdAt: -1 }).limit(10).select('email firstName lastName userType createdAt isPremium'),
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
        totalReviews,
        pageViews: {
          today: todayViews,
          todayUnique: todayUniqueSessions.length,
          total: totalPageViews
        }
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
    const query = userType ? { userType, isAdmin: { $ne: true } } : { isAdmin: { $ne: true } }
    
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
