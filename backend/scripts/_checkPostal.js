import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
await mongoose.connect(process.env.MONGODB_URI)
const Carrier = (await import('../src/models/Carrier.js')).default

const withPostal = await Carrier.countDocuments({
  'location.coordinates.lat': { $exists: false },
  'location.postalCode': { $exists: true, $ne: '' }
})
const sample = await Carrier.find({
  'location.coordinates.lat': { $exists: false },
  'location.postalCode': { $exists: true, $ne: '' }
}, 'companyName location.postalCode location.city country').limit(8).lean()

console.log('Bez coords, z kodem pocztowym:', withPostal)
sample.forEach(c => console.log(`  ${c.location.postalCode} | ${c.location.city} | ${c.country} | ${c.companyName.substring(0,50)}`))
await mongoose.disconnect()
