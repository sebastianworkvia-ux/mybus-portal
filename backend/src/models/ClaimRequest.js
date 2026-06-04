import mongoose from 'mongoose'

const claimRequestSchema = new mongoose.Schema(
  {
    carrierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Carrier',
      required: true
    },
    carrierSlug: {
      type: String
    },
    companyName: {
      type: String
    },
    requesterName: {
      type: String,
      required: true,
      trim: true
    },
    requesterEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    requesterPhone: {
      type: String,
      trim: true
    },
    roleInCompany: {
      type: String,
      enum: ['owner', 'employee', 'representative', 'other'],
      required: true
    },
    message: {
      type: String,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    reviewedAt: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
)

// Index for deduplication check
claimRequestSchema.index({ carrierId: 1, requesterEmail: 1 })

const ClaimRequest = mongoose.model('ClaimRequest', claimRequestSchema)

export default ClaimRequest
