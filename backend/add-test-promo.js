import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Carrier from './src/models/Carrier.js'

dotenv.config()

async function addPromoToCarrier() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB connected')

    // Znajdź pierwszego premium przewoźnika
    const premiumCarrier = await Carrier.findOne({
      subscriptionPlan: { $in: ['premium', 'business'] }
    })

    if (!premiumCarrier) {
      console.log('❌ Nie znaleziono żadnego premium przewoźnika')
      process.exit(1)
    }

    // Dodaj promocję
    premiumCarrier.promoOffer = {
      title: 'Promocja! Berlin - Warszawa',
      description: 'Tylko 120 PLN w obie strony! Komfortowy bus.',
      price: '120 PLN',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dni
      isActive: true
    }

    await premiumCarrier.save()

    console.log('✅ Promocja dodana do:', premiumCarrier.companyName)
    console.log('📋 Promocja:', premiumCarrier.promoOffer)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

addPromoToCarrier()
