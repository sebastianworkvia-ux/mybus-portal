import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

async function fixCarrierConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB connected')

    const email = 'sebastian.rekruter.selfde@gmail.com'
    
    // Znajdź użytkownika
    const user = await mongoose.connection.db.collection('users').findOne({ email })
    
    if (!user) {
      console.log('❌ Nie znaleziono użytkownika:', email)
      process.exit(1)
    }

    console.log('✅ Użytkownik:', user.email, '| ID:', user._id)

    // Znajdź firmę po userId
    let carrier = await mongoose.connection.db.collection('carriers').findOne({ 
      userId: user._id 
    })
    
    if (carrier) {
      console.log('✅ Firma już połączona:', carrier.companyName)
      process.exit(0)
    }

    // Szukaj firmy "Hadecha Test"
    carrier = await mongoose.connection.db.collection('carriers').findOne({
      companyName: /Hadecha Test/i
    })

    if (!carrier) {
      console.log('❌ Nie znaleziono firmy "Hadecha Test"')
      
      // Pokaż wszystkie firmy bez userId
      const orphans = await mongoose.connection.db.collection('carriers')
        .find({ userId: { $exists: false } })
        .limit(10)
        .toArray()
      
      console.log(`\n📋 Firmy bez userId (${orphans.length}):`)
      orphans.forEach(c => {
        console.log(`   - ${c.companyName} (ID: ${c._id})`)
      })
      
      process.exit(1)
    }

    console.log('✅ Znaleziono firmę:', carrier.companyName)
    console.log('   Obecny userId:', carrier.userId || 'BRAK')

    // Połącz firmę z użytkownikiem
    const result = await mongoose.connection.db.collection('carriers').updateOne(
      { _id: carrier._id },
      { $set: { userId: user._id } }
    )

    if (result.modifiedCount > 0) {
      console.log('✅ NAPRAWIONO! Firma została połączona z użytkownikiem.')
    } else {
      console.log('⚠️ Nie udało się zaktualizować')
    }

    // Weryfikacja
    const updated = await mongoose.connection.db.collection('carriers').findOne({ _id: carrier._id })
    console.log('\n🔍 Po naprawie:')
    console.log('   Firma:', updated.companyName)
    console.log('   userId:', updated.userId)
    console.log('   User email:', user.email)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fixCarrierConnection()
