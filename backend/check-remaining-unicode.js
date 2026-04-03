import mongoose from 'mongoose'
import Carrier from './src/models/Carrier.js'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

// Comprehensive check for Unicode problems
const checkText = (text) => {
  if (!text) return null
  
  const problematicPatterns = [
    /Ă/g,  // Ă³, ĂŁ, etc.
    /Ĺ/g,  // Ĺ‚, Ĺ›, Ĺş, Ĺ�, ĹĄ
    /Ä/g,  // Ä…, Ä™, Ĺ„
    /â€ž/g, // smart quote left
    /â€ť/g, // smart quote right
    /â€Ž/g, // control char
    /pvt/gi,
    /pvoz/gi,
    /osv/gi,
    /przewvz/gi,
    /midzynarodowy/gi,
    /misztynarodowy/gi,
    /województwo/gi,
  ]
  
  for (const pattern of problematicPatterns) {
    if (pattern.test(text)) {
      return true
    }
  }
  
  return false
}

async function checkRemainingIssues() {
  try {
    console.log('\n✅ Connecting to MongoDB...\n')
    await mongoose.connect(MONGODB_URI)
    
    const carriers = await Carrier.find().lean()
    console.log(`📊 Total carriers: ${carriers.length}\n`)
    
    const problematicCarriers = []
    
    for (const carrier of carriers) {
      const issues = []
      
      if (checkText(carrier.companyName)) {
        issues.push(`Name: ${carrier.companyName}`)
      }
      if (checkText(carrier.location?.city)) {
        issues.push(`City: ${carrier.location.city}`)
      }
      if (checkText(carrier.location?.address)) {
        issues.push(`Address: ${carrier.location.address}`)
      }
      if (checkText(carrier.description)) {
        issues.push(`Description: ${carrier.description}`)
      }
      if (checkText(carrier.detailedDescription)) {
        issues.push(`Detailed: ${carrier.detailedDescription}`)
      }
      
      if (issues.length > 0) {
        problematicCarriers.push({
          id: carrier._id,
          name: carrier.companyName,
          city: carrier.location?.city,
          issues
        })
      }
    }
    
    console.log(`🔍 Carriers with Unicode issues: ${problematicCarriers.length}\n`)
    
    if (problematicCarriers.length > 0) {
      console.log('📋 LISTA PROBLEMÓW:\n')
      problematicCarriers.slice(0, 20).forEach((carrier, index) => {
        console.log(`${index + 1}. ${carrier.name} | ${carrier.city}`)
        carrier.issues.forEach(issue => console.log(`   ⚠️  ${issue}`))
        console.log()
      })
      
      if (problematicCarriers.length > 20) {
        console.log(`... i ${problematicCarriers.length - 20} więcej\n`)
      }
    } else {
      console.log('✅ Baza jest czysta! Nie znaleziono problemów z Unicode.\n')
    }
    
    await mongoose.disconnect()
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkRemainingIssues()
