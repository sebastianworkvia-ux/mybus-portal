import { createMollieClient } from '@mollie/api-client'
import Payment from '../models/Payment.js'
import Carrier from '../models/Carrier.js'
import User from '../models/User.js'

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
    duration: 30, // dni
    description: 'Plan Premium - 30 dni'
  },
  business: {
    amount: 49.99,
    duration: 30, // dni
    description: 'Plan Business - 30 dni'
  }
}

/**
 * Tworzy płatność w Mollie
 * POST /payments/create
 */
export const createPayment = async (req, res, next) => {
  try {
    const { planType, carrierId } = req.body
    const userId = req.user.id

    // Walidacja planu
    if (!PRICING_PLANS[planType]) {
      return res.status(400).json({ error: 'Nieprawidłowy plan' })
    }

    // Sprawdź czy carrier należy do użytkownika
    if (carrierId) {
      const carrier = await Carrier.findOne({ _id: carrierId, userId })
      if (!carrier) {
        return res.status(404).json({ error: 'Nie znaleziono przewoźnika' })
      }
    }

    const plan = PRICING_PLANS[planType]
    
    // Najpierw tworzymy płatność bez redirectUrl (dostaniemy ID)
    const tempPayment = await getMollieClient().payments.create({
      amount: {
        currency: 'EUR',
        value: plan.amount.toFixed(2)
      },
      description: plan.description,
      redirectUrl: `${process.env.FRONTEND_URL}/payment/success?paymentId=PLACEHOLDER`,
      webhookUrl: `${process.env.BACKEND_URL}/payments/webhook`,
      metadata: {
        userId: userId.toString(),
        carrierId: carrierId?.toString() || null,
        planType,
        duration: plan.duration
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
      amount: plan.amount,
      currency: 'EUR',
      status: 'pending',
      molliePaymentId: payment.id,
      mollieCheckoutUrl: payment.getCheckoutUrl(),
      description: plan.description,
      metadata: {
        duration: plan.duration
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
      } else {
        console.error('❌ Nie znaleziono użytkownika:', payment.userId)
      }
      
      // Aktywuj subskrypcję dla przewoźnika (jeśli istnieje)
      if (payment.carrierId) {
        const carrier = await Carrier.findById(payment.carrierId)
        if (carrier) {
          carrier.subscriptionPlan = payment.planType
          carrier.isPremium = ['premium', 'business'].includes(payment.planType)
          
          // Ustaw datę wygaśnięcia
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + payment.metadata.duration)
          carrier.subscriptionExpiry = expiryDate
          
          await carrier.save()
          
          console.log(`✅ Aktywowano plan ${payment.planType} dla przewoźnika ${carrier._id}`)
        }
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
 * TESTOWY endpoint - aktywuj Premium dla zalogowanego użytkownika
 * POST /payments/activate-premium
 */
export const activatePremiumTest = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { planType = 'premium', duration = 30 } = req.body
    
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' })
    }
    
    user.isPremium = true
    user.subscriptionPlan = planType
    
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + duration)
    user.subscriptionExpiry = expiryDate
    
    await user.save()
    
    console.log(`✅ TEST: Aktywowano ${planType} dla użytkownika ${user.email}`)
    
    res.json({ 
      message: 'Premium aktywowane (TEST)', 
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
