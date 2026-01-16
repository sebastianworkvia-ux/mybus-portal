import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

async function checkCarriers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    const allCarriers = await Carrier.find()
      .select('companyName isPremium createdAt')
      .sort({ createdAt: -1 })
      .limit(30)

    console.log(`\n📋 Ostatnie ${allCarriers.length} firm w bazie:\n`)
    allCarriers.forEach((c, i) => {
      const premium = c.isPremium ? '⭐ PREMIUM' : '  zwykła'
      console.log(`${i+1}. [${premium}] ${c.companyName} - ${c.createdAt.toISOString()}`)
    })

    const premiumCount = await Carrier.countDocuments({ isPremium: true })
    const totalCount = await Carrier.countDocuments()
    
    console.log(`\n📊 Statystyki:`)
    console.log(`   Wszystkie firmy: ${totalCount}`)
    console.log(`   Firmy premium: ${premiumCount}`)
    console.log(`   Zwykłe firmy: ${totalCount - premiumCount}`)

    await mongoose.connection.close()
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

checkCarriers()
