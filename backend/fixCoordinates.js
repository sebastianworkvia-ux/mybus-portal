import mongoose from 'mongoose'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const carrierSchema = new mongoose.Schema({}, { strict: false })
const Carrier = mongoose.model('Carrier', carrierSchema)

// Funkcja geokodowania z Nominatim (OpenStreetMap)
async function geocodeAddress(postalCode, city, country = 'PL') {
  if (!postalCode && !city) return null
  
  try {
    // STRATEGIA 1: Kod pocztowy + miasto
    let query = `${postalCode || ''} ${city || ''}, ${country}`
    console.log(`   🔍 Geokodowanie: ${query}`)
    
    let response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'MyBus-Transport-Portal'
      }
    })

    if (response.data && response.data.length > 0) {
      const coords = {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      }
      console.log(`   ✅ Znaleziono: ${coords.lat}, ${coords.lng}`)
      return coords
    }

    // STRATEGIA 2: Jeśli nie znaleziono, spróbuj TYLKO miasto (bez kodu)
    if (city) {
      console.log(`   🔄 Próba 2: tylko miasto...`)
      query = `${city}, ${country}`
      
      response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'MyBus-Transport-Portal'
        }
      })

      if (response.data && response.data.length > 0) {
        const coords = {
          lat: parseFloat(response.data[0].lat),
          lng: parseFloat(response.data[0].lon)
        }
        console.log(`   ✅ Znaleziono: ${coords.lat}, ${coords.lng}`)
        return coords
      }
    }

    console.log(`   ❌ Brak wyników`)
    return null
  } catch (err) {
    console.error(`   ⚠️ Błąd API:`, err.message)
    return null
  }
}

// Opóźnienie 1 sekunda między requestami (Nominatim limit)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function fixMissingCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB\n')

    // Znajdź firmy bez coordinates
    const carriersWithoutCoords = await Carrier.find({
      $or: [
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates': null },
        { 'location.coordinates.lat': { $exists: false } },
        { 'location.coordinates.lat': null }
      ]
    })

    console.log(`📍 Znaleziono ${carriersWithoutCoords.length} firm bez współrzędnych\n`)

    let fixed = 0
    let failed = 0

    for (const carrier of carriersWithoutCoords) {
      const postalCode = carrier.location?.postalCode
      const city = carrier.location?.city
      const country = carrier.country || 'PL'

      console.log(`\n${fixed + failed + 1}/${carriersWithoutCoords.length}: ${carrier.companyName} (${country})`)
      console.log(`   Kod pocztowy: ${postalCode || 'BRAK'}`)
      console.log(`   Miasto: ${city || 'BRAK'}`)

      if (!postalCode && !city) {
        console.log(`   ⏭️  Pomijam - brak danych do geokodowania`)
        failed++
        continue
      }

      const coordinates = await geocodeAddress(postalCode, city, country)
      
      if (coordinates) {
        // Zaktualizuj coordinates w bazie
        await Carrier.updateOne(
          { _id: carrier._id },
          { 
            $set: { 
              'location.coordinates': coordinates 
            } 
          }
        )
        fixed++
        console.log(`   💾 Zapisano do bazy`)
      } else {
        failed++
        console.log(`   ❌ Nie udało się geokodować`)
      }

      // Opóźnienie 1s między requestami (Nominatim policy)
      await delay(1000)
    }

    console.log('\n\n📊 PODSUMOWANIE:')
    console.log('─────────────────────────────')
    console.log(`✅ Naprawiono: ${fixed}`)
    console.log(`❌ Nie udało się: ${failed}`)
    console.log(`📍 Total: ${carriersWithoutCoords.length}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

fixMissingCoordinates()
