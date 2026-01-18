import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

async function addPolandToAllCarriers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    // Znajdź wszystkie firmy, które NIE mają 'PL' w operatingCountries
    const carriersWithoutPoland = await Carrier.find({
      operatingCountries: { $ne: 'PL' }
    })

    console.log(`Znaleziono ${carriersWithoutPoland.length} firm bez Polski w ofercie`)

    let updated = 0
    for (const carrier of carriersWithoutPoland) {
      // Dodaj 'PL' do operatingCountries
      carrier.operatingCountries.push('PL')
      await carrier.save()
      updated++
      console.log(`✓ Zaktualizowano: ${carrier.companyName}`)
    }

    console.log(`\n✅ Zaktualizowano ${updated} firm - wszystkie mają teraz Polskę w ofercie`)
    
  } catch (error) {
    console.error('❌ Błąd:', error)
  } finally {
    await mongoose.connection.close()
    console.log('Połączenie zamknięte')
  }
}

addPolandToAllCarriers()
