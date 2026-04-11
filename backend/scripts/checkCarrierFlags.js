import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'
dotenv.config()

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 })

const total = await Carrier.countDocuments()
const verified = await Carrier.countDocuments({ isVerified: true })
const notVerifiedFalse = await Carrier.countDocuments({ isVerified: false })
const notVerifiedNull = await Carrier.countDocuments({ isVerified: null })
const noField = await Carrier.countDocuments({ isVerified: { $exists: false } })
const active = await Carrier.countDocuments({ isActive: true })
const plans = await Carrier.aggregate([{ $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } }])

console.log('\n📊 STAN BAZY:')
console.log('  Total:', total)
console.log('  isVerified: true:', verified)
console.log('  isVerified: false:', notVerifiedFalse)
console.log('  isVerified: null:', notVerifiedNull)
console.log('  isVerified: brak pola:', noField)
console.log('  isActive: true:', active)
console.log('  Plany:', JSON.stringify(plans))

// Przykładowe firmy
const samples = await Carrier.find({}).select('companyName isVerified isActive subscriptionPlan').limit(5).lean()
console.log('\nPrzykłady:')
samples.forEach(c => console.log(`  ${c.companyName} | verified:${c.isVerified} | active:${c.isActive} | plan:${c.subscriptionPlan}`))

await mongoose.connection.close()
