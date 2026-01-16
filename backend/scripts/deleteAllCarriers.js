import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

async function deleteAllCarriers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    const count = await Carrier.countDocuments()
    console.log(`🔍 Znaleziono ${count} firm w bazie`)

    if (count === 0) {
      console.log('✅ Baza firm już jest pusta')
      await mongoose.connection.close()
      return
    }

    const result = await Carrier.deleteMany({})
    console.log(`✅ Usunięto ${result.deletedCount} firm`)
    console.log('✅ Baza firm jest teraz pusta - gotowa do importu')

    await mongoose.connection.close()
    console.log('✅ Rozłączono z MongoDB')
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

deleteAllCarriers()
