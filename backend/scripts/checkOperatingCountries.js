import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

import Carrier from '../src/models/Carrier.js'

await mongoose.connect(process.env.MONGODB_URI)

const carriers = await Carrier.find({}, 'companyName operatingCountries country').lean()

// Zlicz unikalne wzorce
const patterns = {}
for (const c of carriers) {
  const key = (c.operatingCountries || []).sort().join(',') || 'BRAK'
  if (!patterns[key]) patterns[key] = []
  patterns[key].push(c.companyName)
}

console.log('=== WZORCE operatingCountries ===')
for (const [key, names] of Object.entries(patterns)) {
  const preview = names.length <= 4 ? names.join(', ') : names.slice(0, 3).join(', ') + ` ... (+${names.length - 3})`
  console.log(`[${key}] — ${names.length} firm(y): ${preview}`)
}

console.log('\nLacznie firm:', carriers.length)
await mongoose.disconnect()
