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
    departureDays: [String], // dni wyjazdów do Polski
    returnDays: [String], // dni powrotów z Polski
    isFlexible: {
      type: Boolean,
      default: false
    },
    logo: String, // URL do logo (tylko Premium)
    isPremium: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Lokalizacja - tylko kod pocztowy i miasto
    location: {
      postalCode: String, // Kod pocztowy (np. "10115", "1012 AB")
      city: String, // Miasto (np. "Berlin", "Amsterdam")
      coordinates: {
        lat: Number, // Szerokość geograficzna (automatycznie z geocoding)
        lng: Number  // Długość geograficzna (automatycznie z geocoding)
      }
    }
  },
  { timestamps: true }
)

export default mongoose.model('Carrier', carrierSchema)
