import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from './src/models/User.js'
import Carrier from './src/models/Carrier.js'

dotenv.config()

async function checkUserCarrier() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB connected\n')

    const email = 'sebastian.rekruter.selfde@gmail.com'
    
    // Znajdź użytkownika
    const user = await User.findOne({ email })
    if (!user) {
      console.log('❌ Nie znaleziono użytkownika:', email)
      process.exit(1)
    }

    console.log('👤 Użytkownik znaleziony:')
    console.log('   Email:', user.email)
    console.log('   ID:', user._id)
    console.log('   Imię:', user.firstName, user.lastName)
    console.log('   isPremium:', user.isPremium)
    console.log('   subscriptionPlan:', user.subscriptionPlan)
    console.log('')

    // Znajdź firmę powiązaną z tym użytkownikiem
    const carrier = await Carrier.findOne({ userId: user._id })
    
    if (!carrier) {
      console.log('❌ Nie znaleziono firmy powiązanej z userId:', user._id)
      console.log('\n🔍 Szukam firmy "Hadecha Test" bez userId...')
      
      const orphanCarrier = await Carrier.findOne({ companyName: /Hadecha Test/i })
      
      if (orphanCarrier) {
        console.log('✅ Znaleziono firmę:')
        console.log('   Nazwa:', orphanCarrier.companyName)
        console.log('   ID:', orphanCarrier._id)
        console.log('   userId:', orphanCarrier.userId || 'BRAK!')
        console.log('\n❓ Czy chcesz połączyć tę firmę z użytkownikiem?')
        console.log('   Uruchom: node backend/scripts/fixUserCarrier.js')
      } else {
        console.log('❌ Nie znaleziono firmy "Hadecha Test" w bazie')
      }
    } else {
      console.log('✅ Firma znaleziona:')
      console.log('   Nazwa:', carrier.companyName)
      console.log('   ID:', carrier._id)
      console.log('   userId:', carrier.userId)
      console.log('   isPremium:', carrier.isPremium)
      console.log('   subscriptionPlan:', carrier.subscriptionPlan)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkUserCarrier()
