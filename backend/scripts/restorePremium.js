import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Carrier from '../src/models/Carrier.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })

const premiumCarriers = [
  {
    userId: null,
    companyName: 'EuroShuttle Express',
    companyRegistration: 'EU-123456',
    country: 'PL',
    description: 'Profesjonalne przewozy międzynarodowe do Niemiec, Holandii i Belgii. Oferujemy regularne połączenia, komfortowe busy i elastyczne terminy.',
    phone: '+48 123 456 789',
    email: 'kontakt@euroshuttle.pl',
    website: 'https://euroshuttle.pl',
    services: ['transport', 'paczki'],
    operatingCountries: ['DE', 'NL', 'BE', 'PL'],
    location: {
      postalCode: '00-001',
      city: 'Warszawa'
    },
    isPremium: true,
    isVerified: true,
    isActive: true
  },
  {
    userId: null,
    companyName: 'Poland Express Transport',
    companyRegistration: 'PL-789012',
    country: 'PL',
    description: 'Szybkie i bezpieczne przewozy osób i paczek. Specjalizujemy się w trasach Polska-Niemcy-Holandia.',
    phone: '+48 234 567 890',
    email: 'info@polandexpress.pl',
    website: 'https://polandexpress.pl',
    services: ['transport', 'paczki', 'przeprowadzki'],
    operatingCountries: ['DE', 'NL', 'PL'],
    location: {
      postalCode: '02-001',
      city: 'Warszawa'
    },
    isPremium: true,
    isVerified: true,
    isActive: true
  },
  {
    userId: null,
    companyName: 'München Shuttle Service',
    companyRegistration: 'DE-345678',
    country: 'DE',
    description: 'Transport między Polską a Niemcami. Codzienne kursy z Monachium do Polski i z powrotem.',
    phone: '+49 89 123 4567',
    email: 'info@muenchen-shuttle.de',
    website: 'https://muenchen-shuttle.de',
    services: ['transport', 'paczki'],
    operatingCountries: ['DE', 'PL'],
    location: {
      postalCode: '80331',
      city: 'München'
    },
    isPremium: true,
    isVerified: true,
    isActive: true
  },
  {
    userId: null,
    companyName: 'Austria Bus Connect',
    companyRegistration: 'AT-567890',
    country: 'AT',
    description: 'Połączenia autobusowe między Austrią a Polską. Wygodne busy, konkurencyjne ceny.',
    phone: '+43 1 234 5678',
    email: 'office@austriabus.at',
    website: 'https://austriabus.at',
    services: ['transport'],
    operatingCountries: ['AT', 'PL', 'DE'],
    location: {
      postalCode: '1010',
      city: 'Wien'
    },
    isPremium: true,
    isVerified: true,
    isActive: true
  }
]

async function restorePremiumCarriers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    for (const carrierData of premiumCarriers) {
      const existing = await Carrier.findOne({ companyName: carrierData.companyName })
      
      if (existing) {
        console.log(`⏭️  ${carrierData.companyName} już istnieje`)
        continue
      }

      await Carrier.create(carrierData)
      console.log(`✅ Dodano: ${carrierData.companyName}`)
    }

    console.log('\n✅ Wszystkie firmy premium przywrócone!')

    await mongoose.connection.close()
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

restorePremiumCarriers()
