import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

async function checkPremiumCarriers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    // Sprawdź wszystkie firmy premium
    const allPremium = await Carrier.find({ isPremium: true })
    console.log(`\n📊 Firm z isPremium=true: ${allPremium.length}`)
    
    for (const carrier of allPremium) {
      console.log(`  - ${carrier.companyName}: subscriptionPlan="${carrier.subscriptionPlan}", isPremium=${carrier.isPremium}`)
    }

    // Sprawdź firmy z subscriptionPlan = 'premium'
    const withPremiumPlan = await Carrier.find({ subscriptionPlan: 'premium' })
    console.log(`\n⭐ Firm z subscriptionPlan='premium': ${withPremiumPlan.length}`)
    
    // Sprawdź firmy z subscriptionPlan = 'business'
    const withBusinessPlan = await Carrier.find({ subscriptionPlan: 'business' })
    console.log(`💎 Firm z subscriptionPlan='business': ${withBusinessPlan.length}`)
    
    for (const carrier of withBusinessPlan) {
      console.log(`  - ${carrier.companyName}`)
    }

  } catch (error) {
    console.error('❌ Błąd:', error)
  } finally {
    await mongoose.connection.close()
    console.log('\nPołączenie zamknięte')
  }
}

checkPremiumCarriers()
