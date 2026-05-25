import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })

import Carrier from '../src/models/Carrier.js'

async function setLogo() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  const result = await Carrier.updateOne(
    { companyName: 'München Shuttle Service' },
    { $set: { logo: '/logos/munchen-shuttle-logo.png' } }
  )

  if (result.matchedCount === 0) {
    console.log('❌ Carrier "München Shuttle Service" not found in database!')
  } else if (result.modifiedCount === 0) {
    console.log('ℹ️  Logo already set (no changes made)')
  } else {
    console.log('✅ Logo updated successfully for München Shuttle Service')
  }

  await mongoose.disconnect()
}

setLogo().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
