import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    carrierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Carrier',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    serviceUsed: String
  },
  { timestamps: true }
)

export default mongoose.model('Review', reviewSchema)
