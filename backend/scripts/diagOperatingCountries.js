import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

import Carrier from '../src/models/Carrier.js'

await mongoose.connect(process.env.MONGODB_URI)

// Przykładowe firmy z wszystkimi 6 krajami
const samples = await Carrier.find(
  { operatingCountries: { $all: ['AT', 'BE', 'DE', 'FR', 'NL', 'PL'], $size: 6 } },
  'companyName country phone services createdAt'
).limit(10).lean()

console.log(`\nPrzykladowe firmy z dokladnie [AT,BE,DE,FR,NL,PL] (${samples.length} z 1072):`)
samples.forEach(c => console.log(` - ${c.companyName} | country:${c.country} | services:${c.services?.join(',')} | created:${c.createdAt?.toISOString().substring(0,10)}`))

// Sprawdz czy sa firmy z innymi kombinacjami niz 6 krajow
const distinctCombos = await Carrier.aggregate([
  { $group: { _id: { $sortArray: { input: '$operatingCountries', sortBy: 1 } }, count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

console.log('\n=== WSZYSTKIE kombinacje krajow ===')
for (const combo of distinctCombos) {
  const key = combo._id.join(',')
  console.log(`[${key}] — ${combo.count} firm`)
}

await mongoose.disconnect()
