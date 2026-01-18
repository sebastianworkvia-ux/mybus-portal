import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

async function setPremiumCarriers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    const carriersToUpdate = [
      'EuroShuttle Express',
      'Poland Express Transport', 
      'Austria Bus Connect'
    ]

    for (const name of carriersToUpdate) {
      const carrier = await Carrier.findOne({ companyName: name })
      if (carrier) {
        carrier.subscriptionPlan = 'premium'
        carrier.isPremium = true
        carrier.subscriptionEnd = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // +6 miesięcy
        await carrier.save()
        console.log(`✅ ${name} → Premium (6 miesięcy)`)
      }
    }

    console.log('\n✅ Zaktualizowano firmy premium')

  } catch (error) {
    console.error('❌ Błąd:', error)
  } finally {
    await mongoose.connection.close()
    console.log('Połączenie zamknięte')
  }
}

setPremiumCarriers()
