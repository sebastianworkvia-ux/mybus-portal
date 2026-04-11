import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

async function removeUnverifiedImports() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 })
  console.log('✅ Połączono z MongoDB\n')

  const toDelete = await Carrier.countDocuments({
    isVerified: false,
    subscriptionPlan: { $nin: ['premium', 'business'] }
  })

  console.log(`🗑️  Firm w kolejce weryfikacji (niezweryfikowane): ${toDelete}`)

  const result = await Carrier.deleteMany({
    isVerified: false,
    subscriptionPlan: { $nin: ['premium', 'business'] }
  })

  console.log(`✅ Usunięto: ${result.deletedCount}`)

  const remaining = await Carrier.countDocuments()
  console.log(`📊 Pozostało w bazie: ${remaining} firm`)

  await mongoose.connection.close()
}

removeUnverifiedImports().catch(err => { console.error('❌', err.message); process.exit(1) })
