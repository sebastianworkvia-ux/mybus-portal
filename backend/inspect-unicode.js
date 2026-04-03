import mongoose from 'mongoose'
import Carrier from './src/models/Carrier.js'
import dotenv from 'dotenv'

dotenv.config()

async function inspectCarrier() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    
    const carriers = await Carrier.find({ 
      companyName: { $regex: /Kł.*bek|miÄ™dzynarodowa|MiÄ™dzynarodowa/ }
    }).limit(3)
    
    for (const carrier of carriers) {
      const name = carrier.companyName
      console.log('\n========================================')
      console.log('Name:', name)
      console.log('\nProblematic chars:')
      for (let i = 0; i < name.length; i++) {
        const char = name[i]
        const code = char.charCodeAt(0)
        if (code > 127 && code !== 321 && code !== 346) {  // Skip Ł and Ś
          console.log(`${i}: "${char}" = U+${code.toString(16).toUpperCase().padStart(4, '0')} (${code})`)
        }
      }
    }
    
    await mongoose.disconnect()
  } catch (error) {
    console.error('Error:', error)
  }
}

inspectCarrier()
