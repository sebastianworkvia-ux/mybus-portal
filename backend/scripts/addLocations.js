/**
 * Skrypt do dodania przykładowych lokalizacji do istniejących przewoźników
 * Uruchom: node backend/scripts/addLocations.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

// Przykładowe lokalizacje firm w różnych krajach (kod pocztowy + miasto + współrzędne)
const locations = {
  'DE': [
    { postalCode: '10115', city: 'Berlin', lat: 52.5200, lng: 13.4050 },
    { postalCode: '20095', city: 'Hamburg', lat: 53.5511, lng: 9.9937 },
    { postalCode: '80331', city: 'München', lat: 48.1351, lng: 11.5820 },
    { postalCode: '60311', city: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
    { postalCode: '50667', city: 'Köln', lat: 50.9375, lng: 6.9603 },
    { postalCode: '70173', city: 'Stuttgart', lat: 48.7758, lng: 9.1829 },
    { postalCode: '01067', city: 'Dresden', lat: 51.0504, lng: 13.7373 }
  ],
  'NL': [
    { postalCode: '1012', city: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
    { postalCode: '3011', city: 'Rotterdam', lat: 51.9244, lng: 4.4777 },
    { postalCode: '2511', city: 'Den Haag', lat: 52.0705, lng: 4.3007 },
    { postalCode: '3511', city: 'Utrecht', lat: 52.0907, lng: 5.1214 },
    { postalCode: '5611', city: 'Eindhoven', lat: 51.4416, lng: 5.4697 }
  ],
  'BE': [
    { postalCode: '1000', city: 'Bruxelles', lat: 50.8503, lng: 4.3517 },
    { postalCode: '2000', city: 'Antwerpen', lat: 51.2194, lng: 4.4025 },
    { postalCode: '9000', city: 'Gent', lat: 51.0543, lng: 3.7174 },
    { postalCode: '8000', city: 'Brugge', lat: 51.2093, lng: 3.2247 }
  ],
  'FR': [
    { postalCode: '75001', city: 'Paris', lat: 48.8566, lng: 2.3522 },
    { postalCode: '69001', city: 'Lyon', lat: 45.7640, lng: 4.8357 },
    { postalCode: '13001', city: 'Marseille', lat: 43.2965, lng: 5.3698 },
    { postalCode: '59000', city: 'Lille', lat: 50.6292, lng: 3.0573 }
  ],
  'AT': [
    { postalCode: '1010', city: 'Wien', lat: 48.2082, lng: 16.3738 },
    { postalCode: '5020', city: 'Salzburg', lat: 47.8095, lng: 13.0550 },
    { postalCode: '6020', city: 'Innsbruck', lat: 47.2692, lng: 11.4041 }
  ],
  'PL': [
    { postalCode: '00-001', city: 'Warszawa', lat: 52.2297, lng: 21.0122 },
    { postalCode: '30-001', city: 'Kraków', lat: 50.0647, lng: 19.9450 },
    { postalCode: '50-001', city: 'Wrocław', lat: 51.1079, lng: 17.0385 },
    { postalCode: '80-001', city: 'Gdańsk', lat: 54.3520, lng: 18.6466 },
    { postalCode: '60-001', city: 'Poznań', lat: 52.4064, lng: 16.9252 }
  ]
}

async function addLocationsToCarriers() {
  try {
    console.log('🔌 Łączenie z MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    // Pobierz wszystkie przewoźniki bez lokalizacji
    const carriers = await Carrier.find({
      $or: [
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates.lat': { $exists: false } }
      ]
    })

    console.log(`📍 Znaleziono ${carriers.length} firm bez lokalizacji`)

    let updated = 0

    for (const carrier of carriers) {
      const countryLocations = locations[carrier.country]
      
      if (!countryLocations || countryLocations.length === 0) {
        console.log(`⚠️  Brak lokalizacji dla kraju: ${carrier.country}`)
        continue
      }

      // Wybierz losową lokalizację z danego kraju
      const randomLocation = countryLocations[Math.floor(Math.random() * countryLocations.length)]

      carrier.location = {
        postalCode: randomLocation.postalCode,
        city: randomLocation.city,
        coordinates: {
          lat: randomLocation.lat,
          lng: randomLocation.lng
        }
      }

      await carrier.save()
      updated++
      
      console.log(`✓ ${carrier.companyName} → ${randomLocation.postalCode} ${randomLocation.city}`)
    }

    console.log(`\n✅ Zaktualizowano ${updated} firm z ${carriers.length}`)
    console.log('🗺️  Firmy są teraz widoczne na mapie!')

  } catch (error) {
    console.error('❌ Błąd:', error)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Rozłączono z MongoDB')
  }
}

// Uruchom skrypt
addLocationsToCarriers()
