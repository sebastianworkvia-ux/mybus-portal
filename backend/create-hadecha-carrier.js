import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './src/models/User.js'
import Carrier from './src/models/Carrier.js'

dotenv.config()

async function createHadechaCarrier() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Znajdź użytkownika
    const user = await User.findOne({ email: 'sebastian.rekruter.selfde@gmail.com' })
    
    if (!user) {
      console.log('❌ Nie znaleziono użytkownika')
      process.exit(1)
    }

    console.log(`\n👤 Znaleziono użytkownika: ${user.email}`)
    console.log(`   ID: ${user._id}`)
    console.log(`   Premium: ${user.isPremium}`)
    console.log(`   Plan: ${user.subscriptionPlan}`)

    // Sprawdź czy już ma firmę
    const existingCarrier = await Carrier.findOne({ userId: user._id })
    
    if (existingCarrier) {
      console.log('\n⚠️  Użytkownik już ma firmę:')
      console.log(`   Nazwa: ${existingCarrier.companyName}`)
      console.log(`   Slug: ${existingCarrier.slug}`)
      process.exit(0)
    }

    // Utwórz nową firmę
    const newCarrier = new Carrier({
      userId: user._id,
      companyName: 'Hadecha Business',
      email: 'sebastian.rekruter.selfde@gmail.com',
      phone: '+48123456789',
      country: 'PL',
      location: {
        city: 'Warszawa',
        address: 'ul. Przykładowa 1',
        postalCode: '00-001',
        coordinates: {
          lat: 52.2297,
          lng: 21.0122
        }
      },
      services: ['transport', 'transfery-lotniskowe'],
      languages: ['pl', 'en', 'de'],
      description: 'Transport osobowy i transfery lotniskowe. Edytuj ten opis w panelu zarządzania.',
      isActive: true,
      isPremium: user.isPremium || false,
      subscriptionPlan: user.subscriptionPlan || 'free',
      subscriptionExpiry: user.subscriptionExpiry || null
    })

    await newCarrier.save()

    console.log('\n✅ Firma utworzona pomyślnie!')
    console.log(`   Nazwa: ${newCarrier.companyName}`)
    console.log(`   Slug: ${newCarrier.slug}`)
    console.log(`   Link: https://my-bus.eu/carrier/${newCarrier.slug}`)
    console.log(`\n💡 Możesz teraz edytować dane firmy w panelu użytkownika!`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

createHadechaCarrier()
