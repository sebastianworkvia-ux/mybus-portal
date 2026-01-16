import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

async function keepOnlyPremium() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    // Znajdź wszystkie firmy NIE-premium
    const carriersToDelete = await Carrier.find({
      isPremium: { $ne: true }
    }).select('companyName createdAt')

    console.log(`🔍 Znaleziono ${carriersToDelete.length} zwykłych firm do usunięcia:\n`)
    carriersToDelete.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.companyName} (${c.createdAt.toISOString()})`)
    })

    if (carriersToDelete.length === 0) {
      console.log('✅ Brak firm do usunięcia')
      await mongoose.connection.close()
      return
    }

    // Usuń wszystkie zwykłe firmy
    const result = await Carrier.deleteMany({
      isPremium: { $ne: true }
    })

    console.log(`\n✅ Usunięto ${result.deletedCount} zwykłych firm`)
    console.log('✅ Konta użytkowników pozostały bez zmian')

    // Sprawdź co pozostało
    const remaining = await Carrier.find({ isPremium: true })
      .select('companyName createdAt')
    
    console.log(`\n⭐ Pozostało ${remaining.length} firm premium:`)
    remaining.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.companyName}`)
    })

    await mongoose.connection.close()
    console.log('\n✅ Rozłączono z MongoDB')
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

keepOnlyPremium()
