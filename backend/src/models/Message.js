import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    carrierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Carrier',
      required: false // Opcjonalne - kontekst rozmowy o konkretnej firmie
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    isRead: {
      type: Boolean,
      default: false
    },
    // Indeks konwersacji - sortowanie po uczestnikach
    conversationId: {
      type: String,
      required: true,
      index: true
    }
  },
  { 
    timestamps: true 
  }
)

// Index dla szybkiego wyszukiwania konwersacji
messageSchema.index({ senderId: 1, receiverId: 1 })
messageSchema.index({ conversationId: 1, createdAt: -1 })

// Statyczna metoda do generowania conversationId (alfabetycznie posortowane ID)
messageSchema.statics.generateConversationId = function(userId1, userId2) {
  return [userId1.toString(), userId2.toString()].sort().join('_')
}

export default mongoose.model('Message', messageSchema)
