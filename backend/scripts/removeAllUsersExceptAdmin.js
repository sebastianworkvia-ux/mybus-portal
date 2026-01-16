import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../src/models/User.js'

dotenv.config()

async function removeAllUsersExceptAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    // Znajdź administratora
    const admin = await User.findOne({ isAdmin: true })
    if (!admin) {
      console.log('❌ Nie znaleziono administratora w bazie!')
      await mongoose.connection.close()
      return
    }

    console.log(`✅ Administrator: ${admin.email}`)

    // Znajdź wszystkich użytkowników poza adminem
    const usersToDelete = await User.find({
      _id: { $ne: admin._id }
    }).select('email firstName lastName userType')

    console.log(`\n🔍 Znaleziono ${usersToDelete.length} użytkowników do usunięcia:\n`)
    usersToDelete.forEach((u, i) => {
      console.log(`  ${i+1}. ${u.email} - ${u.firstName} ${u.lastName} (${u.userType})`)
    })

    if (usersToDelete.length === 0) {
      console.log('✅ Brak użytkowników do usunięcia')
      await mongoose.connection.close()
      return
    }

    // Usuń wszystkich użytkowników poza adminem
    const result = await User.deleteMany({
      _id: { $ne: admin._id }
    })

    console.log(`\n✅ Usunięto ${result.deletedCount} użytkowników`)
    console.log(`✅ Pozostał tylko administrator: ${admin.email}`)

    await mongoose.connection.close()
    console.log('\n✅ Rozłączono z MongoDB')
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

removeAllUsersExceptAdmin()
