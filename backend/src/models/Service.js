import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema(
  {
    carrierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Carrier',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    type: {
      type: String,
      enum: ['transport', 'transport-rzeczy', 'przeprowadzki', 'zwierzeta', 'dokumenty', 'paczki', 'inne'],
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    priceUnit: {
      type: String,
      enum: ['per_km', 'per_hour', 'flat_rate', 'per_ton'],
      default: 'per_km'
    },
    availability: [String], // ['Mon', 'Tue', 'Wed', etc.]
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

export default mongoose.model('Service', serviceSchema)
