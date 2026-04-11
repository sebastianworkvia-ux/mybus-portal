import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

const isDryRun = !process.argv.includes('--apply')

async function keepOnlyPremium() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 60000
  })
  console.log('✅ Połączono z MongoDB\n')

  const allCarriers = await Carrier.find({}).select('companyName subscriptionPlan isPremium').lean()

  const toKeep = allCarriers.filter(c =>
    c.subscriptionPlan === 'premium' || c.subscriptionPlan === 'business'
  )
  const toDelete = allCarriers.filter(c =>
    c.subscriptionPlan !== 'premium' && c.subscriptionPlan !== 'business'
  )

  console.log('✅ FIRMY KTÓRE ZOSTANĄ (premium/business):')
  console.log('─────────────────────────────────────────────')
  toKeep.forEach((c, i) => {
    console.log(`  ${i + 1}. [${c.subscriptionPlan?.toUpperCase() || 'PREMIUM'}] ${c.companyName}`)
  })

  console.log(`\n🗑️  DO USUNIĘCIA: ${toDelete.length} firm (free/brak planu)`)
  console.log(`\n📊 RAZEM: ${allCarriers.length} → zostanie: ${toKeep.length}`)

  if (isDryRun) {
    console.log('\n👆 DRY-RUN — żadnych zmian. Uruchom z --apply żeby usunąć.\n')
    await mongoose.connection.close()
    return
  }

  console.log('\n🗑️  Usuwam...')
  const result = await Carrier.deleteMany({
    subscriptionPlan: { $nin: ['premium', 'business'] }
  })

  console.log(`✅ Usunięto: ${result.deletedCount} firm`)
  console.log(`✅ Zostało w bazie: ${toKeep.length} firm\n`)

  await mongoose.connection.close()
}

keepOnlyPremium().catch(async err => {
  console.error('❌ Błąd:', err.message)
  await mongoose.connection.close()
  process.exit(1)
})
