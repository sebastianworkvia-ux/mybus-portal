import express from 'express'
import PageView from '../models/PageView.js'

const router = express.Router()

// Track page view
router.post('/track-view', async (req, res) => {
  try {
    const { url, sessionId, userId = null, userAgent = '', referrer = '' } = req.body
    
    if (!sessionId || !url) {
      return res.status(400).json({ error: 'sessionId and url are required' })
    }
    
    // Check if same session visited this URL in last 30 minutes (to avoid counting refreshes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const recentView = await PageView.findOne({
      sessionId,
      url,
      createdAt: { $gte: thirtyMinutesAgo }
    })
    
    if (recentView) {
      // Don't count this view - same session, same page within 30 minutes
      return res.json({ 
        message: 'View not counted (recent duplicate)',
        counted: false
      })
    }
    
    // Get IP from request
    const ipAddress = req.ip || req.connection.remoteAddress || ''
    
    // Create new page view record
    const pageView = new PageView({
      url,
      sessionId,
      userId: userId || null,
      userAgent: userAgent || req.get('user-agent') || '',
      referrer: referrer || req.get('referrer') || '',
      ipAddress
    })
    
    await pageView.save()
    
    res.json({ 
      message: 'Page view tracked successfully',
      counted: true
    })
  } catch (error) {
    // Don't crash on tracking errors - just log
    console.error('❌ Error tracking page view:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Get page views for a specific URL (admin only - protected in server.js)
router.get('/views/:url', async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url)
    
    const views = await PageView.find({ url })
      .sort({ createdAt: -1 })
      .limit(100)
    
    const totalViews = await PageView.countDocuments({ url })
    const uniqueSessions = new Set(views.map(v => v.sessionId)).size
    
    res.json({
      url,
      totalViews,
      uniqueSessions,
      recentViews: views
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
