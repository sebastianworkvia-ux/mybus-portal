import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from './src/models/Carrier.js'

dotenv.config()

async function find() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    
    const carriers = await Carrier.find({
      $or: [
        { email: 'sebastian.rekruter.selfde@gmail.com' },
        { companyName: /hadecha/i }
      ]
    }).lean()
    
    console.log('\n🔍 Carriers with email or Hadecha name:', JSON.stringify(carriers, null, 2))
    
    // Sprawdź też carriers bez userId
    const carriersNoUserId = await Carrier.find({ userId: { $exists: false } }).limit(5).lean()
    console.log('\n❌ First 5 carriers WITHOUT userId:', JSON.stringify(carriersNoUserId, null, 2))
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

find()
