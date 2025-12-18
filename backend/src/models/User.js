import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    phone: {
      type: String
    },
    userType: {
      type: String,
      enum: ['carrier', 'customer'],
      required: true
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    subscriptionPlan: {
      type: String,
      enum: ['premium', 'business', null],
      default: null
    },
    subscriptionExpiry: {
      type: Date,
      default: null
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Dla type: 'carrier'
    carrierProfile: {
      companyName: String,
      companyRegistration: String,
      country: String,
      description: String,
      services: [mongoose.Schema.Types.ObjectId],
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
)

// Hash password przed zapisem
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcryptjs.genSalt(10)
    this.password = await bcryptjs.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Metoda do porównania haseł
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcryptjs.compare(plainPassword, this.password)
}

export default mongoose.model('User', userSchema)
