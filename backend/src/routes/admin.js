import express from 'express'
import crypto from 'crypto'
import { adminMiddleware } from '../middleware/auth.js'
import User from '../models/User.js'
import Carrier from '../models/Carrier.js'
import PageView from '../models/PageView.js'
import Payment from '../models/Payment.js'

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

// Bulk verify carriers (masowa weryfikacja)
router.post('/verify-carriers-bulk', adminMiddleware, async (req, res) => {
  try {
    const { carrierIds } = req.body
    
    if (!carrierIds || !Array.isArray(carrierIds) || carrierIds.length === 0) {
      return res.status(400).json({ error: 'Brak firm do weryfikacji' })
    }
    
    const result = await Carrier.updateMany(
      { _id: { $in: carrierIds } },
      { $set: { isVerified: true } }
    )
    
    res.json({ 
      message: `Zweryfikowano ${result.modifiedCount} firm`,
      verified: result.modifiedCount
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

// Toggle user active status (activate/deactivate account)
router.post('/users/:id/toggle-active', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Toggle isActive status
    user.isActive = !user.isActive
    await user.save()
    
    res.json({
      message: user.isActive ? 'Account activated' : 'Account deactivated',
      user: {
        _id: user._id,
        email: user.email,
        isActive: user.isActive
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Send password reset link
router.post('/users/:id/send-reset-link', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    
    // Hash token and save to database
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')
    
    // Token expires in 1 hour
    user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000
    await user.save()
    
    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    
    // TODO: In production, send email with resetUrl
    // For now, return URL in response
    console.log('🔐 Password reset link generated for:', user.email)
    console.log('🔗 Reset URL:', resetUrl)
    
    res.json({
      message: 'Password reset link generated',
      resetUrl, // Remove in production, send via email instead
      user: {
        email: user.email
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get admin statistics
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments()
    const totalCarriers = await User.countDocuments({ userType: 'carrier' })
    const totalCustomers = await User.countDocuments({ userType: 'customer' })
    const premiumUsers = await User.countDocuments({ isPremium: true })
    const activeUsers = await User.countDocuments({ isActive: true })
    
    // Calculate users logged in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activeLastWeek = await User.countDocuments({ 
      updatedAt: { $gte: sevenDaysAgo }
    })
    
    // Carrier statistics
    const verifiedCarriers = await Carrier.countDocuments({ isVerified: true })
    const unverifiedCarriers = await Carrier.countDocuments({ isVerified: false })
    
    // Payment statistics
    const totalPayments = await Payment.countDocuments({ status: 'paid' })
    const payments = await Payment.find({ status: 'paid' })
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const avgRevenuePerUser = premiumUsers > 0 ? (totalRevenue / premiumUsers).toFixed(2) : 0
    
    // Page view statistics
    const totalPageViews = await PageView.countDocuments()
    
    // Unique sessions (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentViews = await PageView.find({ 
      createdAt: { $gte: thirtyDaysAgo }
    })
    const uniqueSessions = new Set(recentViews.map(v => v.sessionId)).size
    
    // Most visited pages (last 30 days)
    const popularPages = await PageView.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { 
        _id: '$url', 
        count: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$sessionId' }
      }},
      { $project: {
        url: '$_id',
        views: '$count',
        uniqueVisitors: { $size: '$uniqueVisitors' }
      }},
      { $sort: { views: -1 } },
      { $limit: 10 }
    ])
    
    // Page views per day (last 7 days)
    const viewsPerDay = await PageView.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { 
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$sessionId' }
      }},
      { $project: {
        date: '$_id',
        views: '$count',
        uniqueVisitors: { $size: '$uniqueVisitors' }
      }},
      { $sort: { date: 1 } }
    ])
    
    res.json({
      users: {
        total: totalUsers,
        carriers: totalCarriers,
        customers: totalCustomers,
        premium: premiumUsers,
        active: activeUsers,
        activeLastWeek
      },
      carriers: {
        verified: verifiedCarriers,
        unverified: unverifiedCarriers,
        total: verifiedCarriers + unverifiedCarriers
      },
      payments: {
        total: totalPayments,
        totalRevenue: totalRevenue.toFixed(2),
        avgRevenuePerUser
      },
      pageViews: {
        total: totalPageViews,
        uniqueSessionsLast30Days: uniqueSessions,
        popularPages,
        viewsPerDay
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Restore premium carriers
router.post('/carriers/restore-premium', adminMiddleware, async (req, res) => {
  try {
    const premiumCarriers = [
      {
        userId: null, companyName: 'EuroShuttle Express', companyRegistration: 'EU-123456', country: 'PL',
        description: 'Profesjonalne przewozy międzynarodowe do Niemiec, Holandii i Belgii.',
        phone: '+48 123 456 789', email: 'kontakt@euroshuttle.pl', website: 'https://euroshuttle.pl',
        services: ['transport', 'paczki'], operatingCountries: ['DE', 'NL', 'BE', 'PL'],
        location: { postalCode: '00-001', city: 'Warszawa' }, isPremium: true, isVerified: true, isActive: true
      },
      {
        userId: null, companyName: 'Poland Express Transport', companyRegistration: 'PL-789012', country: 'PL',
        description: 'Szybkie przewozy osób i paczek.',
        phone: '+48 234 567 890', services: ['transport', 'paczki'], operatingCountries: ['DE', 'NL', 'PL'],
        location: { postalCode: '02-001', city: 'Warszawa' }, isPremium: true, isVerified: true, isActive: true
      },
      {
        userId: null, companyName: 'München Shuttle Service', companyRegistration: 'DE-345678', country: 'DE',
        description: 'Transport Polska-Niemcy.',
        phone: '+49 89 123 4567', services: ['transport'], operatingCountries: ['DE', 'PL'],
        location: { postalCode: '80331', city: 'München' }, isPremium: true, isVerified: true, isActive: true
      },
      {
        userId: null, companyName: 'Austria Bus Connect', companyRegistration: 'AT-567890', country: 'AT',
        description: 'Połączenia Austria-Polska.',
        phone: '+43 1 234 5678', services: ['transport'], operatingCountries: ['AT', 'PL'],
        location: { postalCode: '1010', city: 'Wien' }, isPremium: true, isVerified: true, isActive: true
      }
    ]
    let added = 0
    for (const data of premiumCarriers) {
      const exists = await Carrier.findOne({ companyName: data.companyName })
      if (!exists) {
        await Carrier.create(data)
        added++
      }
    }
    res.json({ message: `Dodano ${added} firm premium`, added })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete all carriers except premium (be careful!)
router.delete('/carriers/all', adminMiddleware, async (req, res) => {
  try {
    const result = await Carrier.deleteMany({ isPremium: { $ne: true } })
    res.json({ 
      message: 'Wszystkie firmy usunięte',
      deletedCount: result.deletedCount 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
