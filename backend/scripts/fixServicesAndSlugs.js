import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

// Helper function to generate slug from company name
function generateSlug(companyName) {
  return companyName
    .toLowerCase()
    .replace(/[ąàáäâ]/g, 'a')
    .replace(/[ćç]/g, 'c')
    .replace(/[ęèéëê]/g, 'e')
    .replace(/[ł]/g, 'l')
    .replace(/[ńñ]/g, 'n')
    .replace(/[óòöô]/g, 'o')
    .replace(/[śš]/g, 's')
    .replace(/[źżž]/g, 'z')
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .trim()
}

// Map old service names to new enum values
const serviceMapping = {
  'Przewóz osób': 'transport',
  'Paczki': 'paczki',
  'Transfery lotniskowe': 'transfery-lotniskowe',
  'Wycieczki autokarowe': 'autokary',
  'Lawety': 'laweta',
  'Transport zwierząt': 'zwierzeta',
  'Przeprowadzki': 'przeprowadzki',
  'Transport koni': 'zwierzeta',
  'Transport medyczny': 'transport',
  'Transport chłodniczy': 'transport-rzeczy',
  'Transport specjalistyczny': 'transport-rzeczy',
  'Transport ekspresowy': 'paczki',
  'Przejazdy służbowe': 'przejazdy-sluzbowe'
}

async function fixServicesAndGenerateSlugs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Find all carriers without slug
    const carriers = await Carrier.find({ $or: [{ slug: null }, { slug: '' }, { slug: { $exists: false } }] }).lean()
    console.log(`\n📋 Found ${carriers.length} carriers without slug\n`)

    let updated = 0
    let errors = 0

    for (const carrier of carriers) {
      try {
        // Fix services array
        const fixedServices = carrier.services
          .map(service => serviceMapping[service] || service)
          .filter(service => ['transport', 'autokary', 'transfery-lotniskowe', 'przejazdy-sluzbowe', 'transport-rzeczy', 'przeprowadzki', 'zwierzeta', 'dokumenty', 'paczki', 'laweta', 'inne'].includes(service))
        
        // Generate slug
        let baseSlug = generateSlug(carrier.companyName)
        let slug = baseSlug
        let counter = 1
        
        // Check if slug exists
        while (await Carrier.findOne({ slug, _id: { $ne: carrier._id } })) {
          slug = `${baseSlug}-${counter}`
          counter++
        }
        
        // Update using updateOne to bypass validation temporarily
        await Carrier.updateOne(
          { _id: carrier._id },
          { 
            $set: { 
              slug: slug,
              services: fixedServices.length > 0 ? fixedServices : ['transport']
            } 
          }
        )
        
        console.log(`✅ ${carrier.companyName} → ${slug} (services: ${fixedServices.join(', ')})`)
        updated++
      } catch (error) {
        console.error(`❌ Error updating ${carrier.companyName}:`, error.message)
        errors++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Updated: ${updated}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`   📦 Total carriers: ${carriers.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

fixServicesAndGenerateSlugs()
