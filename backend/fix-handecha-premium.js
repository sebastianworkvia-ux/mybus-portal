import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from './src/models/User.js'
import Carrier from './src/models/Carrier.js'

dotenv.config()

async function fixHandechaPremium() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB connected\n')

    const email = 'sebastian.rekruter.selfde@gmail.com'
    const expiry = new Date()
    expiry.setFullYear(expiry.getFullYear() + 1)

    // Fix user
    const user = await User.findOneAndUpdate(
      { email },
      { isPremium: true, subscriptionPlan: 'premium', subscriptionExpiry: expiry },
      { new: true }
    )

    if (!user) {
      console.log('❌ Nie znaleziono użytkownika:', email)
      process.exit(1)
    }

    console.log('👤 User zaktualizowany:')
    console.log('   isPremium:', user.isPremium)
    console.log('   subscriptionPlan:', user.subscriptionPlan)
    console.log('   subscriptionExpiry:', user.subscriptionExpiry)

    // Fix carrier
    const carrier = await Carrier.findOneAndUpdate(
      { userId: user._id },
      { isPremium: true, subscriptionPlan: 'premium', subscriptionExpiry: expiry },
      { new: true }
    )

    if (!carrier) {
      // Spróbuj po nazwie
      const byName = await Carrier.findOneAndUpdate(
        { companyName: /handecha|hadecha/i },
        { isPremium: true, subscriptionPlan: 'premium', subscriptionExpiry: expiry },
        { new: true }
      )
      if (byName) {
        console.log(`\n🏢 Firma zaktualizowana (po nazwie): ${byName.companyName}`)
        console.log('   subscriptionPlan:', byName.subscriptionPlan)
      } else {
        console.log('\n⚠️  Nie znaleziono firmy powiązanej z tym użytkownikiem')
      }
    } else {
      console.log(`\n🏢 Firma zaktualizowana: ${carrier.companyName}`)
      console.log('   isPremium:', carrier.isPremium)
      console.log('   subscriptionPlan:', carrier.subscriptionPlan)
      console.log('   subscriptionExpiry:', carrier.subscriptionExpiry)
    }

    console.log('\n✅ Gotowe! Firma powinna teraz mieć złotą ramkę.')
  } catch (error) {
    console.error('❌ Błąd:', error.message)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

fixHandechaPremium()
