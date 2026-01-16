import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../src/models/User.js'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

async function cleanTempUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    // Znajdź wszystkie sztuczne konta
    const tempUsers = await User.find({ email: /@mybus\.temp$/ })
    console.log(`🔍 Znaleziono ${tempUsers.length} sztucznych kont @mybus.temp`)

    for (const user of tempUsers) {
      // Ustaw userId=null dla przewoźników tego użytkownika
      const updated = await Carrier.updateMany(
        { userId: user._id },
        { $set: { userId: null } }
      )
      
      console.log(`  📝 ${user.email} - zaktualizowano ${updated.modifiedCount} przewoźników`)
      
      // Usuń sztuczne konto
      await User.deleteOne({ _id: user._id })
    }

    console.log(`✅ Usunięto ${tempUsers.length} sztucznych kont`)
    console.log('✅ Firmy bez właścicieli mają teraz userId=null')

    await mongoose.connection.close()
    console.log('✅ Rozłączono z MongoDB')
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

cleanTempUsers()
