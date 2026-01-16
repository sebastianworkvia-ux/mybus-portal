import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

async function removeRecentCarriers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    // Data od wczoraj (2026-01-14 00:00:00)
    const yesterday = new Date('2026-01-14T00:00:00.000Z')
    
    console.log(`📅 Usuwam firmy dodane od: ${yesterday.toISOString()}`)

    // Znajdź firmy do usunięcia (dodane od wczoraj, NIE premium)
    const carriersToDelete = await Carrier.find({
      createdAt: { $gte: yesterday },
      isPremium: { $ne: true }
    }).select('companyName isPremium createdAt')

    console.log(`🔍 Znaleziono ${carriersToDelete.length} firm do usunięcia:`)
    carriersToDelete.forEach(c => {
      console.log(`  - ${c.companyName} (${c.createdAt.toISOString()})`)
    })

    if (carriersToDelete.length === 0) {
      console.log('✅ Brak firm do usunięcia')
      await mongoose.connection.close()
      return
    }

    // Usuń firmy
    const result = await Carrier.deleteMany({
      createdAt: { $gte: yesterday },
      isPremium: { $ne: true }
    })

    console.log(`✅ Usunięto ${result.deletedCount} firm`)
    console.log('✅ Konta użytkowników pozostały bez zmian')

    // Sprawdź ile firm premium pozostało
    const premiumCount = await Carrier.countDocuments({ isPremium: true })
    console.log(`✅ Pozostało ${premiumCount} firm premium`)

    await mongoose.connection.close()
    console.log('✅ Rozłączono z MongoDB')
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

removeRecentCarriers()
