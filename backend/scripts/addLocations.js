/**
 * Skrypt do dodania przykładowych lokalizacji do istniejących przewoźników
 * Uruchom: node backend/scripts/addLocations.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

// Przykładowe lokalizacje firm w różnych krajach
const locations = {
  'DE': [
    { city: 'Berlin', lat: 52.5200, lng: 13.4050, address: 'Berlin, Niemcy' },
    { city: 'Hamburg', lat: 53.5511, lng: 9.9937, address: 'Hamburg, Niemcy' },
    { city: 'Monachium', lat: 48.1351, lng: 11.5820, address: 'Monachium, Niemcy' },
    { city: 'Frankfurt', lat: 50.1109, lng: 8.6821, address: 'Frankfurt, Niemcy' },
    { city: 'Kolonia', lat: 50.9375, lng: 6.9603, address: 'Kolonia, Niemcy' }
  ],
  'NL': [
    { city: 'Amsterdam', lat: 52.3676, lng: 4.9041, address: 'Amsterdam, Holandia' },
    { city: 'Rotterdam', lat: 51.9244, lng: 4.4777, address: 'Rotterdam, Holandia' },
    { city: 'Haga', lat: 52.0705, lng: 4.3007, address: 'Haga, Holandia' },
    { city: 'Utrecht', lat: 52.0907, lng: 5.1214, address: 'Utrecht, Holandia' }
  ],
  'BE': [
    { city: 'Bruksela', lat: 50.8503, lng: 4.3517, address: 'Bruksela, Belgia' },
    { city: 'Antwerpia', lat: 51.2194, lng: 4.4025, address: 'Antwerpia, Belgia' },
    { city: 'Gandawa', lat: 51.0543, lng: 3.7174, address: 'Gandawa, Belgia' }
  ],
  'FR': [
    { city: 'Paryż', lat: 48.8566, lng: 2.3522, address: 'Paryż, Francja' },
    { city: 'Lyon', lat: 45.7640, lng: 4.8357, address: 'Lyon, Francja' },
    { city: 'Marsylia', lat: 43.2965, lng: 5.3698, address: 'Marsylia, Francja' }
  ],
  'AT': [
    { city: 'Wiedeń', lat: 48.2082, lng: 16.3738, address: 'Wiedeń, Austria' },
    { city: 'Salzburg', lat: 47.8095, lng: 13.0550, address: 'Salzburg, Austria' }
  ],
  'PL': [
    { city: 'Warszawa', lat: 52.2297, lng: 21.0122, address: 'Warszawa, Polska' },
    { city: 'Kraków', lat: 50.0647, lng: 19.9450, address: 'Kraków, Polska' },
    { city: 'Wrocław', lat: 51.1079, lng: 17.0385, address: 'Wrocław, Polska' },
    { city: 'Gdańsk', lat: 54.3520, lng: 18.6466, address: 'Gdańsk, Polska' }
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
        city: randomLocation.city,
        address: randomLocation.address,
        coordinates: {
          lat: randomLocation.lat,
          lng: randomLocation.lng
        }
      }

      await carrier.save()
      updated++
      
      console.log(`✓ ${carrier.companyName} → ${randomLocation.city}`)
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
