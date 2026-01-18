import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'
import User from '../src/models/User.js'

dotenv.config()

async function setBusinessPremium() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    // Znajdź München Shuttle Service
    const carrier = await Carrier.findOne({ 
      companyName: { $regex: /München Shuttle Service/i }
    })

    if (!carrier) {
      console.log('❌ Nie znaleziono firmy München Shuttle Service')
      return
    }

    console.log(`📋 Znaleziono: ${carrier.companyName}`)

    // Ustaw Business Premium
    carrier.subscriptionPlan = 'business'
    carrier.isPremium = true
    carrier.subscriptionEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // +1 rok
    await carrier.save()

    console.log('✅ Ustawiono Business Premium dla München Shuttle Service')
    console.log(`   - subscriptionPlan: ${carrier.subscriptionPlan}`)
    console.log(`   - isPremium: ${carrier.isPremium}`)
    console.log(`   - subscriptionEnd: ${carrier.subscriptionEnd}`)

    // Jeśli ma użytkownika, zaktualizuj też User
    if (carrier.userId) {
      const user = await User.findById(carrier.userId)
      if (user) {
        user.subscriptionPlan = 'business'
        user.isPremium = true
        user.subscriptionEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        await user.save()
        console.log(`✅ Zaktualizowano też użytkownika: ${user.email}`)
      }
    }

  } catch (error) {
    console.error('❌ Błąd:', error)
  } finally {
    await mongoose.connection.close()
    console.log('Połączenie zamknięte')
  }
}

setBusinessPremium()
