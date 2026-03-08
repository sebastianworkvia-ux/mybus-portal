import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

async function checkSlugs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    
    const total = await Carrier.countDocuments()
    const withSlug = await Carrier.countDocuments({ slug: { $exists: true, $ne: null, $ne: '' } })
    const sample = await Carrier.findOne({ slug: { $exists: true } }).select('companyName slug _id')
    
    console.log('📊 Status slug\'ów:')
    console.log('   • Total carriers:', total)
    console.log('   • Carriers with slug:', withSlug)
    console.log('   • Without slug:', total - withSlug)
    console.log('\n🔍 Sample carrier:')
    console.log('   • Name:', sample?.companyName)
    console.log('   • Slug:', sample?.slug)
    console.log('   • ID:', sample?._id)
    console.log('\n🌐 URL powinien być:')
    console.log('   http://localhost:5173/carrier/' + sample?.slug)
    
    await mongoose.disconnect()
  } catch (error) {
    console.error('Error:', error)
    await mongoose.disconnect()
  }
}

checkSlugs()
