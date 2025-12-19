import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
  createPayment,
  handleWebhook,
  getPaymentStatus,
  getPaymentHistory,
  cancelPayment,
  activatePremiumTest
} from '../controllers/paymentController.js'

const router = express.Router()

// Tworzenie płatności - wymaga autoryzacji
router.post('/create', authMiddleware, createPayment)

// Webhook Mollie - NIE wymaga autoryzacji (wywołanie z Mollie)
router.post('/webhook', handleWebhook)

// Status płatności - publiczny endpoint
router.get('/:id/status', getPaymentStatus)

// Historia płatności użytkownika - wymaga autoryzacji
router.get('/history', authMiddleware, getPaymentHistory)

// Anulowanie płatności - wymaga autoryzacji
router.delete('/:id/cancel', authMiddleware, cancelPayment)

// TESTOWY endpoint - ręczne wywołanie webhooka (do usunięcia na produkcji)
router.post('/test-webhook/:paymentId', async (req, res) => {
  try {
    await handleWebhook({ body: { id: req.params.paymentId } }, res)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// TESTOWY endpoint - aktywuj Premium dla zalogowanego użytkownika
router.post('/activate-premium', authMiddleware, activatePremiumTest)

export default router
