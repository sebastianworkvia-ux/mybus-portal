import { createMollieClient } from '@mollie/api-client'
import Payment from '../models/Payment.js'
import Carrier from '../models/Carrier.js'
import User from '../models/User.js'

/**
 * Utility: check and downgrade expired subscriptions.
 * Call this on any request where premium status matters.
 * Returns true if user was downgraded.
 */
export const checkAndDowngradeIfExpired = async (user) => {
  if (!user || !user.isPremium || !user.subscriptionExpiry) return false
  if (new Date() <= new Date(user.subscriptionExpiry)) return false

  // Subscription expired — downgrade
  user.isPremium = false
  user.subscriptionPlan = null
  user.subscriptionExpiry = null
  await user.save()

  await Carrier.updateMany(
    { userId: user._id },
    { $set: { subscriptionPlan: 'free', isPremium: false, subscriptionExpiry: null } }
  )

  console.log(`⏰ Auto-downgraded expired subscription for ${user.email}`)
  return true
}

// Inicjalizacja klienta Mollie - lazy loading
let mollieClient = null
const getMollieClient = () => {
  if (!mollieClient) {
    if (!process.env.MOLLIE_API_KEY) {
      throw new Error('MOLLIE_API_KEY is not defined in environment variables')
    }
    mollieClient = createMollieClient({ 
      apiKey: process.env.MOLLIE_API_KEY 
    })
  }
  return mollieClient
}

// Konfiguracja planów cenowych
const PRICING_PLANS = {
  premium: {
    amount: 29.99,
    yearlyAmount: 299.99,
    duration: 30, // dni
    yearlyDuration: 365, // dni
    description: 'My-Bus.eu - Plan Premium (30 dni)',
    yearlyDescription: 'My-Bus.eu - Plan Premium (12 miesięcy - oszczędzasz 17%)'
  },
  business: {
    amount: 49.99,
    yearlyAmount: 499.99,
    duration: 30, // dni
    yearlyDuration: 365, // dni
    description: 'My-Bus.eu - Plan Business (30 dni)',
    yearlyDescription: 'My-Bus.eu - Plan Business (12 miesięcy - oszczędzasz 17%)'
  }
}

/**
 * Tworzy płatność w Mollie
 * POST /payments/create
 */
export const createPayment = async (req, res, next) => {
  try {
    const { planType, carrierId, billingPeriod = 'monthly' } = req.body
    const userId = req.user.id

    // Walidacja planu
    if (!PRICING_PLANS[planType]) {
      return res.status(400).json({ error: 'Nieprawidłowy plan' })
    }
    
    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return res.status(400).json({ error: 'Nieprawidłowy okres rozliczeniowy' })
    }

    // Sprawdź czy carrier należy do użytkownika
    if (carrierId) {
      const carrier = await Carrier.findOne({ _id: carrierId, userId })
      if (!carrier) {
        return res.status(404).json({ error: 'Nie znaleziono przewoźnika' })
      }
    }

    const plan = PRICING_PLANS[planType]
    const isYearly = billingPeriod === 'yearly'
    const amount = (isYearly ? plan.yearlyAmount : plan.amount).toFixed(2)
    const description = isYearly ? plan.yearlyDescription : plan.description
    const duration = isYearly ? plan.yearlyDuration : plan.duration
    
    // Najpierw tworzymy płatność bez redirectUrl (dostaniemy ID)
    const tempPayment = await getMollieClient().payments.create({
      amount: {
        currency: 'EUR',
        value: amount
      },
      description: description,
      redirectUrl: `${process.env.FRONTEND_URL}/payment/success?paymentId=PLACEHOLDER`,
      webhookUrl: `${process.env.BACKEND_URL}/payments/webhook`,
      metadata: {
        userId: userId.toString(),
        carrierId: carrierId?.toString() || null,
        planType,
        duration: duration,
        billingPeriod
      }
    })
    
    // Teraz mamy ID, możemy zaktualizować płatność z prawidłowym redirectUrl
    const payment = await getMollieClient().payments.update(tempPayment.id, {
      redirectUrl: `${process.env.FRONTEND_URL}/payment/success?paymentId=${tempPayment.id}`
    })

    // Zapisanie płatności w bazie danych
    const paymentDoc = new Payment({
      userId,
      carrierId: carrierId || null,
      planType,
      amount: parseFloat(amount),
      currency: 'EUR',
      status: 'pending',
      molliePaymentId: payment.id,
      mollieCheckoutUrl: payment.getCheckoutUrl(),
      description: description,
      billingPeriod,
      duration, // correctly: 30 for monthly, 365 for yearly
      metadata: {
        duration: duration,  // FIX was plan.duration (always 30)
        billingPeriod
      }
    })

    await paymentDoc.save()

    // Zwróć URL z paymentId w query string
    const checkoutUrl = payment.getCheckoutUrl()
    const redirectUrl = `${process.env.FRONTEND_URL}/payment/success?paymentId=${payment.id}`

    res.json({
      paymentId: payment.id,
      checkoutUrl: checkoutUrl,
      redirectUrl: redirectUrl,
      status: payment.status
    })
  } catch (error) {
    console.error('Błąd tworzenia płatności:', error)
    next(error)
  }
}

/**
 * Webhook Mollie - aktualizuje status płatności
 * POST /payments/webhook
 */
export const handleWebhook = async (req, res, next) => {
  try {
    console.log('🔔 Webhook otrzymany od Mollie:', req.body)
    const paymentId = req.body.id

    if (!paymentId) {
      console.error('❌ Brak ID płatności w webhook')
      return res.status(400).json({ error: 'Brak ID płatności' })
    }

    console.log('🔍 Pobieram status płatności z Mollie:', paymentId)
    // Pobierz aktualny status z Mollie
    const molliePayment = await getMollieClient().payments.get(paymentId)
    console.log('📊 Status z Mollie:', molliePayment.status)
    
    // Znajdź płatność w bazie
    const payment = await Payment.findOne({ molliePaymentId: paymentId })
    
    if (!payment) {
      console.error('❌ Nie znaleziono płatności w bazie:', paymentId)
      return res.status(404).json({ error: 'Płatność nie znaleziona' })
    }

    console.log('💾 Płatność znaleziona w bazie, userId:', payment.userId)

    // Aktualizuj status
    payment.status = molliePayment.status
    
    // Jeśli płatność została opłacona
    if (molliePayment.isPaid()) {
      console.log('✅ Płatność opłacona! Aktywuję Premium...')
      payment.paidAt = new Date()
      
      // Aktywuj Premium dla użytkownika
      const user = await User.findById(payment.userId)
      if (user) {
        console.log('👤 Użytkownik znaleziony:', user.email)
        user.isPremium = true
        user.subscriptionPlan = payment.planType
        
        // Ustaw datę wygaśnięcia
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + payment.metadata.duration)
        user.subscriptionExpiry = expiryDate
        
        await user.save()
        console.log(`✅ Aktywowano plan ${payment.planType} dla użytkownika ${user.email} (${user._id})`)
        
        // Aktywuj Premium dla WSZYSTKICH firm tego użytkownika
        const carriers = await Carrier.find({ userId: payment.userId })
        if (carriers.length > 0) {
          console.log(`🔄 Aktualizuję ${carriers.length} firm(y) użytkownika...`)
          for (const carrier of carriers) {
            carrier.subscriptionPlan = payment.planType
            carrier.isPremium = ['premium', 'business'].includes(payment.planType)
            carrier.subscriptionExpiry = expiryDate
            await carrier.save()
            console.log(`✅ Aktywowano Premium dla firmy: ${carrier.companyName} (${carrier._id})`)
          }
        } else {
          console.log('ℹ️ Użytkownik nie ma jeszcze żadnych firm w systemie')
        }
      } else {
        console.error('❌ Nie znaleziono użytkownika:', payment.userId)
      }
    }

    await payment.save()
    
    // Mollie wymaga odpowiedzi 200 OK
    res.status(200).send('OK')
  } catch (error) {
    console.error('Błąd webhooka:', error)
    next(error)
  }
}

/**
 * Pobiera status płatności
 * GET /payments/:id/status
 */
export const getPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    
    // Sprawdź w bazie danych
    const payment = await Payment.findOne({ molliePaymentId: id })
    
    if (!payment) {
      return res.status(404).json({ error: 'Płatność nie znaleziona' })
    }

    // Opcjonalnie: sprawdź aktualny status w Mollie
    try {
      const molliePayment = await getMollieClient().payments.get(id)
      payment.status = molliePayment.status
      await payment.save()
    } catch (error) {
      console.error('Błąd pobierania statusu z Mollie:', error)
    }

    res.json({
      paymentId: payment.molliePaymentId,
      status: payment.status,
      planType: payment.planType,
      amount: payment.amount,
      currency: payment.currency,
      paidAt: payment.paidAt
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Pobiera historię płatności użytkownika
 * GET /payments/history
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user.id
    
    const payments = await Payment.find({ userId })
      .populate('carrierId', 'companyName')
      .sort({ createdAt: -1 })
      .limit(50)

    res.json(payments)
  } catch (error) {
    next(error)
  }
}

/**
 * Anuluje płatność
 * DELETE /payments/:id/cancel
 */
export const cancelPayment = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    
    const payment = await Payment.findOne({ 
      molliePaymentId: id,
      userId 
    })
    
    if (!payment) {
      return res.status(404).json({ error: 'Płatność nie znaleziona' })
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Nie można anulować tej płatności' })
    }

    // Anuluj w Mollie (jeśli możliwe)
    try {
      await getMollieClient().payments.cancel(id)
    } catch (error) {
      console.error('Błąd anulowania w Mollie:', error)
    }

    payment.status = 'canceled'
    await payment.save()

    res.json({ message: 'Płatność anulowana', payment })
  } catch (error) {
    next(error)
  }
}

/**
 * Anuluj subskrypcję użytkownika
 * POST /payments/cancel-subscription
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id
    
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' })
    }
    
    if (!user.isPremium) {
      return res.status(400).json({ error: 'Nie masz aktywnej subskrypcji' })
    }
    
    // Resetuj plan użytkownika
    user.isPremium = false
    user.subscriptionPlan = 'free'
    user.subscriptionExpiry = null
    
    await user.save()
    
    console.log(`✅ Anulowano subskrypcję dla użytkownika ${user.email}`)
    
    // Zdegraduj wszystkie firmy użytkownika do planu FREE
    const carriers = await Carrier.find({ userId })
    let updatedCarriers = 0
    for (const carrier of carriers) {
      carrier.subscriptionPlan = 'free'
      carrier.isPremium = false
      carrier.subscriptionExpiry = null
      await carrier.save()
      updatedCarriers++
    }
    
    console.log(`✅ Zdegradowano ${updatedCarriers} firm(y) do planu FREE`)
    
    res.json({ 
      message: 'Subskrypcja została anulowana',
      carriersUpdated: updatedCarriers
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Aktywuj Premium na podstawie opłaconej płatności w bazie danych.
 * Jest to fallback gdy webhook Mollie nie dotrze.
 * POST /payments/activate-premium
 * SECURITY: activates ONLY if there is an actual 'paid' Payment record for this user.
 */
export const activatePremiumTest = async (req, res, next) => {
  try {
    const userId = req.user.id

    // SECURITY: find the most recent paid payment for this user
    const latestPaid = await Payment.findOne({ userId, status: 'paid' }).sort({ paidAt: -1 })
    if (!latestPaid) {
      return res.status(403).json({
        error: 'Brak opłaconej płatności dla tego konta',
        code: 'NO_PAID_PAYMENT'
      })
    }

    const planType = latestPaid.planType
    const duration = latestPaid.duration || latestPaid.metadata?.duration || 30

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' })
    }

    // Already active with same plan and not expired — no-op
    if (
      user.isPremium &&
      user.subscriptionPlan === planType &&
      user.subscriptionExpiry &&
      new Date(user.subscriptionExpiry) > new Date()
    ) {
      return res.json({
        message: 'Premium już aktywne',
        alreadyActive: true,
        user: {
          email: user.email,
          isPremium: user.isPremium,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionExpiry: user.subscriptionExpiry
        }
      })
    }

    user.isPremium = true
    user.subscriptionPlan = planType
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + duration)
    user.subscriptionExpiry = expiryDate
    await user.save()

    console.log(`✅ Aktywowano (fallback) ${planType} dla użytkownika ${user.email}`)

    const carriers = await Carrier.find({ userId })
    for (const carrier of carriers) {
      carrier.subscriptionPlan = planType
      carrier.isPremium = ['premium', 'business'].includes(planType)
      carrier.subscriptionExpiry = expiryDate
      await carrier.save()
    }

    console.log(`✅ Zaktualizowano ${carriers.length} firm(y)`)

    res.json({
      message: 'Premium aktywowane',
      carriersUpdated: carriers.length,
      user: {
        email: user.email,
        isPremium: user.isPremium,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiry: user.subscriptionExpiry
      }
    })
  } catch (error) {
    next(error)
  }
}
