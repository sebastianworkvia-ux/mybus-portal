import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

async function checkActiveCarriers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    const total = await Carrier.countDocuments()
    const active = await Carrier.countDocuments({ isActive: true })
    const inactive = await Carrier.countDocuments({ isActive: false })

    console.log(`\n📊 Status firm:`)
    console.log(`  Wszystkich: ${total}`)
    console.log(`  Aktywnych (isActive=true): ${active}`)
    console.log(`  Nieaktywnych (isActive=false): ${inactive}`)

    if (inactive > 0) {
      console.log(`\n⚠️ Znaleziono ${inactive} nieaktywnych firm - mogą być ukryte w wyszukiwarce!`)
      const inactiveList = await Carrier.find({ isActive: false }).limit(10)
      console.log('Przykłady:')
      inactiveList.forEach(c => console.log(`  - ${c.companyName}`))
    }

  } catch (error) {
    console.error('❌ Błąd:', error)
  } finally {
    await mongoose.connection.close()
    console.log('\nPołączenie zamknięte')
  }
}

checkActiveCarriers()
