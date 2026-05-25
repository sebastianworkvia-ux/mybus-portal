import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })

import Carrier from '../src/models/Carrier.js'

const scheduleData = [
  {
    companyName: 'EuroShuttle Express',
    departureDays: ['poniedziałek', 'środa', 'piątek'],
    returnDays: ['wtorek', 'czwartek', 'sobota'],
  },
  {
    companyName: 'Poland Express Transport',
    departureDays: ['wtorek', 'piątek'],
    returnDays: ['środa', 'sobota'],
  },
  {
    companyName: 'München Shuttle Service',
    departureDays: ['poniedziałek', 'czwartek'],
    returnDays: ['wtorek', 'piątek'],
  },
  {
    companyName: 'Austria Bus Connect',
    departureDays: ['środa', 'sobota'],
    returnDays: ['czwartek', 'niedziela'],
  },
]

async function setSchedules() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  for (const { companyName, departureDays, returnDays } of scheduleData) {
    const result = await Carrier.updateOne(
      { companyName },
      { $set: { departureDays, returnDays } }
    )
    if (result.matchedCount === 0) {
      console.log(`❌ Not found: ${companyName}`)
    } else {
      console.log(`✅ Updated schedule: ${companyName}`)
    }
  }

  await mongoose.disconnect()
}

setSchedules().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
