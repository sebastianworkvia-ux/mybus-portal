/**
 * Plan Limits & Feature Gating Middleware
 *
 * Plan definitions:
 *   FREE     — very limited, no analytics
 *   PREMIUM  — higher limits, analytics, priority in search
 *   BUSINESS — unlimited, highest priority
 *
 * Usage:
 *   router.post('/carriers', authMiddleware, requirePlan('free'), createCarrier)
 *   router.get('/carriers/analytics', authMiddleware, requirePlan('premium'), getCarrierAnalytics)
 */

import Carrier from '../models/Carrier.js'
import User from '../models/User.js'
import { checkAndDowngradeIfExpired } from '../controllers/paymentController.js'

// Plan hierarchy
const PLAN_RANK = { free: 0, null: 0, premium: 1, business: 2 }

const LIMITS = {
  free: {
    maxCarriers: 1,          // max listings (Carrier documents)
    analyticsAccess: false,
    contactAccess: false,    // can other users see phone/email (gating at frontend)
    searchPriority: 0,
    boostAccess: false,
  },
  premium: {
    maxCarriers: 3,
    analyticsAccess: true,
    contactAccess: true,
    searchPriority: 1,
    boostAccess: false,
  },
  business: {
    maxCarriers: 10,
    analyticsAccess: true,
    contactAccess: true,
    searchPriority: 2,
    boostAccess: true,
  }
}

/**
 * Get effective plan for a user (checking expiry inline).
 */
async function getEffectivePlan(userId) {
  const user = await User.findById(userId).select('isPremium subscriptionPlan subscriptionExpiry')
  if (!user) return 'free'

  // Auto-downgrade if expired
  await checkAndDowngradeIfExpired(user)

  const plan = user.subscriptionPlan
  return plan === 'premium' || plan === 'business' ? plan : 'free'
}

/**
 * Middleware factory: require at least a given plan level.
 * requirePlan('premium') → blocks free users
 * requirePlan('business') → blocks free + premium users
 * requirePlan('free') → allows everyone (just attaches plan info)
 */
export const requirePlan = (minimumPlan = 'free') => {
  return async (req, res, next) => {
    try {
      const plan = await getEffectivePlan(req.user.id)
      const userRank = PLAN_RANK[plan] ?? 0
      const requiredRank = PLAN_RANK[minimumPlan] ?? 0

      // Attach plan info for controllers to use
      req.userPlan = plan
      req.planLimits = LIMITS[plan] || LIMITS.free

      if (userRank < requiredRank) {
        const suggestedPlan = minimumPlan === 'business' ? 'BUSINESS' : 'PREMIUM'
        return res.status(403).json({
          error: 'PLAN_REQUIRED',
          message: `Ta funkcja wymaga planu ${suggestedPlan}. Ulepsz swój plan.`,
          currentPlan: plan,
          requiredPlan: minimumPlan,
          suggestedPlan,
          upgradeUrl: '/pricing'
        })
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}

/**
 * Middleware: check if user has reached carrier listing limit.
 * Use before createCarrier.
 */
export const checkCarrierLimit = async (req, res, next) => {
  try {
    const plan = await getEffectivePlan(req.user.id)
    const limits = LIMITS[plan] || LIMITS.free

    const existingCount = await Carrier.countDocuments({ userId: req.user.id })

    if (existingCount >= limits.maxCarriers) {
      const suggestedPlan = plan === 'free' ? 'PREMIUM' : 'BUSINESS'
      return res.status(403).json({
        error: 'LIMIT_REACHED',
        message: `Osiągnąłeś limit ${limits.maxCarriers} firm dla planu ${plan.toUpperCase()}. Ulepsz plan aby dodać więcej.`,
        currentPlan: plan,
        limit: limits.maxCarriers,
        current: existingCount,
        suggestedPlan,
        upgradeUrl: '/pricing'
      })
    }

    req.userPlan = plan
    req.planLimits = limits
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Middleware: require analytics access (premium+).
 */
export const requireAnalytics = requirePlan('premium')

export { LIMITS, PLAN_RANK, getEffectivePlan }
