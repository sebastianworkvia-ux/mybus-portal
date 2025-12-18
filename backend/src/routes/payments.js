import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
  createPayment,
  handleWebhook,
  getPaymentStatus,
  getPaymentHistory,
  cancelPayment
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

export default router
