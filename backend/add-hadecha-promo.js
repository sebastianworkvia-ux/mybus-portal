// Skrypt do dodania testowej promocji dla firmy Hadecha Test
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from './src/models/Carrier.js'

dotenv.config()

const addHadechaPromo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Znajdź firmę Hadecha Test
    const hadechaCarrier = await Carrier.findOne({ companyName: /Hadecha Test/i })
    
    if (!hadechaCarrier) {
      console.log('❌ Nie znaleziono firmy Hadecha Test')
      process.exit(1)
    }

    console.log(`📦 Znaleziono firmę: ${hadechaCarrier.companyName}`)
    console.log(`   ID: ${hadechaCarrier._id}`)
    console.log(`   Plan: ${hadechaCarrier.subscriptionPlan}`)

    // Dodaj promocję testową
    hadechaCarrier.promoOffer = {
      title: 'Promocja Berlin - Warszawa',
      description: 'Tylko 120 PLN w obie strony! Komfortowy bus, klimatyzacja, Wi-Fi. Nie przegap!',
      price: '120 PLN',
      validUntil: new Date('2026-03-09'), // Ważne miesiąc naprzód
      isActive: true
    }

    // Upewnij się że firma ma plan premium/business
    if (!['premium', 'business'].includes(hadechaCarrier.subscriptionPlan)) {
      console.log('⚠️  Firma nie ma planu premium/business. Ustawiam plan business...')
      hadechaCarrier.subscriptionPlan = 'business'
      hadechaCarrier.isPremium = true
      hadechaCarrier.subscriptionExpiry = new Date('2026-12-31')
    }

    await hadechaCarrier.save()

    console.log('✅ Promocja dodana pomyślnie!')
    console.log('📋 Szczegóły promocji:')
    console.log(`   Tytuł: ${hadechaCarrier.promoOffer.title}`)
    console.log(`   Opis: ${hadechaCarrier.promoOffer.description}`)
    console.log(`   Cena: ${hadechaCarrier.promoOffer.price}`)
    console.log(`   Ważna do: ${hadechaCarrier.promoOffer.validUntil.toLocaleDateString('pl-PL')}`)
    console.log(`   Aktywna: ${hadechaCarrier.promoOffer.isActive ? 'TAK' : 'NIE'}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

addHadechaPromo()
