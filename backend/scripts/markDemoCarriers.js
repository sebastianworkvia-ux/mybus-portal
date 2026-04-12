import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import Carrier from '../src/models/Carrier.js'

async function markDemoCarriers() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅ Połączono z MongoDB')

  const demoNames = ['München Shuttle Service', 'Poland Express Transport']

  const result = await Carrier.updateMany(
    { companyName: { $in: demoNames } },
    { $set: { isDemo: true } }
  )

  console.log(`✅ Oznaczono ${result.modifiedCount} firm jako demo`)

  const marked = await Carrier.find({ isDemo: true }).select('companyName subscriptionPlan')
  marked.forEach(c => console.log(` - ${c.companyName} [${c.subscriptionPlan}]`))

  await mongoose.disconnect()
}

markDemoCarriers().catch(err => {
  console.error('❌', err)
  process.exit(1)
})
