import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const carrierSchema = new mongoose.Schema({}, { strict: false })
const Carrier = mongoose.model('Carrier', carrierSchema)

async function checkLocations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB\n')

    const total = await Carrier.countDocuments()
    
    // SPRAWDZENIE 1: Które mają city
    const withCity = await Carrier.countDocuments({
      'location.city': { $exists: true, $ne: null, $ne: '' }
    })
    
    // SPRAWDZENIE 2: Które mają coordinates (TO SPRAWDZA MAPA!)
    const withCoordinates = await Carrier.countDocuments({
      'location.coordinates.lat': { $exists: true, $ne: null },
      'location.coordinates.lng': { $exists: true, $ne: null }
    })
    
    const withoutCoordinates = await Carrier.countDocuments({
      $or: [
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates': null },
        { 'location.coordinates.lat': { $exists: false } },
        { 'location.coordinates.lat': null },
        { 'location.coordinates.lng': { $exists: false } },
        { 'location.coordinates.lng': null }
      ]
    })

    console.log('📊 STATYSTYKI LOKALIZACJI:')
    console.log('─────────────────────────────')
    console.log(`Total firm: ${total}`)
    console.log(`Z city: ${withCity}`)
    console.log(`Z coordinates (LAT/LNG): ${withCoordinates} ← TO WIDZI MAPA`)
    console.log(`Bez coordinates: ${withoutCoordinates} ← TO CHOWA MAPA`)
    console.log('─────────────────────────────\n')

    // Pobierz przykładowe firmy BEZ COORDINATES (to jest problem!)
    const noCoordinatesCarriers = await Carrier.find({
      $or: [
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates': null },
        { 'location.coordinates.lat': { $exists: false } },
        { 'location.coordinates.lat': null },
        { 'location.coordinates.lng': { $exists: false } },
        { 'location.coordinates.lng': null }
      ]
    })
    .limit(30)
    .select('companyName country location userId')

    console.log('📍 FIRMY BEZ COORDINATES (max 30):')
    console.log('─────────────────────────────────────────────────')
    noCoordinatesCarriers.forEach((c, i) => {
      console.log(`${i + 1}. ${c.companyName} (${c.country})`)
      console.log(`   location.city: ${c.location?.city || 'BRAK'}`)
      console.log(`   coordinates: ${JSON.stringify(c.location?.coordinates)}`)
      console.log(`   userId: ${c.userId || 'brak (import)'}`)
      console.log('')
    })

    // Sprawdź rozkład po krajach (bez coordinates)
    const byCountry = await Carrier.aggregate([
      {
        $match: {
          $or: [
            { 'location.coordinates': { $exists: false } },
            { 'location.coordinates': null },
            { 'location.coordinates.lat': { $exists: false } },
            { 'location.coordinates.lat': null },
            { 'location.coordinates.lng': { $exists: false } },
            { 'location.coordinates.lng': null }
          ]
        }
      },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])

    console.log('🌍 ROZKŁAD FIRM BEZ COORDINATES PO KRAJACH:')
    console.log('─────────────────────────────────────────────')
    byCountry.forEach(item => {
      console.log(`${item._id}: ${item.count} firm`)
    })

    process.exit(0)
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

checkLocations()
