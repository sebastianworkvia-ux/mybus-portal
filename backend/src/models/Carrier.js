import mongoose from 'mongoose'

const carrierSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    companyName: {
      type: String,
      required: true
    },
    companyRegistration: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      enum: ['DE', 'NL', 'BE', 'FR', 'AT', 'PL']
    },
    description: String,
    phone: String,
    email: String,
    website: String,
    services: [
      {
        type: String,
        enum: ['transport', 'transport-rzeczy', 'przeprowadzki', 'zwierzeta', 'dokumenty', 'paczki', 'inne']
      }
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    reviewIds: [mongoose.Schema.Types.ObjectId],
    routes: [
      {
        from: String,
        to: String,
        days: [String], // np. ['poniedziałek', 'środa', 'piątek']
        time: String // np. '18:00'
      }
    ],
    luggageInfo: {
      maxPieces: Number,
      maxWeight: Number,
      additionalInfo: String
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

export default mongoose.model('Carrier', carrierSchema)
