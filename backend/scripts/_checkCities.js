import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
await mongoose.connect(process.env.MONGODB_URI)
const Carrier = (await import('../src/models/Carrier.js')).default

// Sprawdź rozkład wartości city
const pipeline = [
  { $match: { 'location.city': { $exists: true, $ne: '' }, 'location.coordinates.lat': { $exists: false } } },
  { $group: { _id: '$location.city', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 30 }
]
const result = await Carrier.aggregate(pipeline)
console.log('Top 30 wartości city (bez koordynatów):')
result.forEach(r => console.log(`  ${r._id.padEnd(30)} ${r.count}`))
await mongoose.disconnect()
