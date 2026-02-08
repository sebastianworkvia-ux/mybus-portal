// Skrypt do dodania promocji dla München Shuttle Service
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from './src/models/Carrier.js'

dotenv.config()

const addMunchenPromo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Znajdź firmę München Shuttle Service
    const carrier = await Carrier.findOne({ companyName: /München.*Shuttle/i })
    
    if (!carrier) {
      console.log('❌ Nie znaleziono firmy München Shuttle Service')
      process.exit(1)
    }

    console.log(`📦 Znaleziono firmę: ${carrier.companyName}`)
    console.log(`   ID: ${carrier._id}`)
    console.log(`   Plan: ${carrier.subscriptionPlan}`)

    // Dodaj promocję
    carrier.promoOffer = {
      title: 'Promocja München - Warszawa',
      description: 'Specjalna cena 150 EUR w obie strony! Komfortowy bus, klimatyzacja, Wi-Fi. Rezerwuj już dziś!',
      price: '150 EUR',
      validUntil: new Date('2026-04-30'), // Ważne do końca kwietnia
      isActive: true
    }

    // Upewnij się że firma ma plan business (jeśli nie ma)
    if (!['premium', 'business'].includes(carrier.subscriptionPlan)) {
      console.log('⚠️  Firma nie ma planu premium/business. Ustawiam plan business...')
      carrier.subscriptionPlan = 'business'
      carrier.isPremium = true
      carrier.subscriptionExpiry = new Date('2026-12-31')
    }

    // Usuń promocję z Hadecha Test (jeśli istnieje)
    const hadecha = await Carrier.findOne({ companyName: /Hadecha Test/i })
    if (hadecha && hadecha.promoOffer) {
      console.log('🗑️  Usuwam promocję z Hadecha Test...')
      hadecha.promoOffer = undefined
      await hadecha.save()
      console.log('✅ Promocja usunięta z Hadecha Test')
    }

    await carrier.save()

    console.log('✅ Promocja dodana pomyślnie!')
    console.log('📋 Szczegóły promocji:')
    console.log(`   Tytuł: ${carrier.promoOffer.title}`)
    console.log(`   Opis: ${carrier.promoOffer.description}`)
    console.log(`   Cena: ${carrier.promoOffer.price}`)
    console.log(`   Ważna do: ${carrier.promoOffer.validUntil.toLocaleDateString('pl-PL')}`)
    console.log(`   Aktywna: ${carrier.promoOffer.isActive ? 'TAK' : 'NIE'}`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
    process.exit(0)
  }
}

addMunchenPromo()
