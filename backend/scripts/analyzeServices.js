/**
 * Analiza dystrybucji tagów usług w bazie przewoźników
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

async function analyzeServices() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 60000
  })
  console.log('✅ Połączono z MongoDB\n')

  const allCarriers = await Carrier.find({ isActive: true })
    .select('companyName services subscriptionPlan')
    .lean()

  console.log(`📋 Aktywnych przewoźników: ${allCarriers.length}\n`)

  // Zlicz tagi
  const tagCount = {}
  let noTags = 0
  let multipleServices = 0

  for (const carrier of allCarriers) {
    const services = carrier.services || []
    if (services.length === 0) noTags++
    if (services.length > 1) multipleServices++
    for (const s of services) {
      tagCount[s] = (tagCount[s] || 0) + 1
    }
  }

  console.log('📊 DYSTRYBUCJA TAGÓW:')
  console.log('─────────────────────────────────')
  const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1])
  for (const [tag, count] of sorted) {
    const bar = '█'.repeat(Math.round(count / allCarriers.length * 30))
    console.log(`  ${tag.padEnd(25)} ${String(count).padStart(3)} firm  ${bar}`)
  }

  console.log('─────────────────────────────────')
  console.log(`  ${'(brak tagów)'.padEnd(25)} ${String(noTags).padStart(3)} firm`)
  console.log(`  ${'(wiele tagów)'.padEnd(25)} ${String(multipleServices).padStart(3)} firm`)

  // Firmy bez tagów - przykłady
  if (noTags > 0) {
    const noTagCarriers = allCarriers.filter(c => !c.services || c.services.length === 0)
    console.log(`\n⚠️  Firmy BEZ tagów (${noTags} total, pokazuję 20):`)
    noTagCarriers.slice(0, 20).forEach(c => {
      console.log(`    - ${c.companyName}`)
    })
  }

  // Podsumowanie subscriptionPlan
  const planCount = {}
  for (const c of allCarriers) {
    const plan = c.subscriptionPlan || 'brak/free'
    planCount[plan] = (planCount[plan] || 0) + 1
  }
  console.log('\n💳 PLANY SUBSKRYPCJI:')
  for (const [plan, count] of Object.entries(planCount)) {
    console.log(`  ${plan.padEnd(15)} ${count} firm`)
  }

  await mongoose.connection.close()
}

analyzeServices().catch(err => {
  console.error('❌ Błąd:', err.message)
  process.exit(1)
})
