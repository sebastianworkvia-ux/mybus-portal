import mongoose from 'mongoose'

const pageViewSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null for anonymous users
    },
    sessionId: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      default: ''
    },
    referrer: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  { 
    timestamps: true // adds createdAt and updatedAt
  }
)

// Index dla szybkiego wyszukiwania
pageViewSchema.index({ sessionId: 1, url: 1, createdAt: 1 })
pageViewSchema.index({ createdAt: -1 })
pageViewSchema.index({ url: 1 })

export default mongoose.model('PageView', pageViewSchema)
