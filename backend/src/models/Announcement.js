import mongoose from 'mongoose'

const announcementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['carrier', 'customer'],
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  country: {
    type: String,
    enum: ['DE', 'NL', 'BE', 'FR', 'AT', 'PL'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Tytuł jest wymagany'],
    trim: true,
    maxlength: [100, 'Tytuł nie może być dłuższy niż 100 znaków']
  },
  description: {
    type: String,
    required: [true, 'Opis jest wymagany'],
    trim: true,
    maxlength: [1000, 'Opis nie może być dłuższy niż 1000 znaków']
  }
}, {
  timestamps: true
})

// Index dla szybszego wyszukiwania
announcementSchema.index({ country: 1, createdAt: -1 })
announcementSchema.index({ userId: 1 })

const Announcement = mongoose.model('Announcement', announcementSchema)

export default Announcement
