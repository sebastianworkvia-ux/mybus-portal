import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier',
    required: false
  },
  planType: {
    type: String,
    enum: ['free', 'premium', 'business'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'canceled', 'expired'],
    default: 'pending'
  },
  molliePaymentId: {
    type: String,
    required: true,
    unique: true
  },
  mollieCheckoutUrl: {
    type: String
  },
  description: {
    type: String
  },
  metadata: {
    type: Object,
    default: {}
  },
  paidAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Index dla szybszego wyszukiwania
paymentSchema.index({ userId: 1, status: 1 })

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment
