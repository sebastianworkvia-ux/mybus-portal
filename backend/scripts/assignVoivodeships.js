
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Carrier from '../src/models/Carrier.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })

// Mapping of postal code prefixes (first 2 digits) to voivodeships
const POSTAL_CODE_MAP = {
  '00': 'Mazowieckie', '01': 'Mazowieckie', '02': 'Mazowieckie', '03': 'Mazowieckie',
  '04': 'Mazowieckie', '05': 'Mazowieckie', '06': 'Mazowieckie', '07': 'Mazowieckie',
  '08': 'Mazowieckie', '09': 'Mazowieckie',
  '10': 'Warmińsko-mazurskie', '11': 'Warmińsko-mazurskie', '12': 'Warmińsko-mazurskie',
  '13': 'Warmińsko-mazurskie', '14': 'Warmińsko-mazurskie',
  '15': 'Podlaskie', '16': 'Podlaskie', '17': 'Podlaskie', '18': 'Podlaskie', '19': 'Podlaskie',
  '20': 'Lubelskie', '21': 'Lubelskie', '22': 'Lubelskie', '23': 'Lubelskie', '24': 'Lubelskie',
  '25': 'Świętokrzyskie', '26': 'Świętokrzyskie',
  '27': 'Świętokrzyskie', '28': 'Świętokrzyskie', '29': 'Świętokrzyskie',
  '30': 'Małopolskie', '31': 'Małopolskie', '32': 'Małopolskie', '33': 'Małopolskie', '34': 'Małopolskie',
  '35': 'Podkarpackie', '36': 'Podkarpackie', '37': 'Podkarpackie', '38': 'Podkarpackie', '39': 'Podkarpackie',
  '40': 'Śląskie', '41': 'Śląskie', '42': 'Śląskie', '43': 'Śląskie', '44': 'Śląskie',
  '45': 'Opolskie', '46': 'Opolskie', '47': 'Opolskie', '48': 'Opolskie', '49': 'Opolskie',
  '50': 'Dolnośląskie', '51': 'Dolnośląskie', '52': 'Dolnośląskie', '53': 'Dolnośląskie',
  '54': 'Dolnośląskie', '55': 'Dolnośląskie', '56': 'Dolnośląskie', '57': 'Dolnośląskie',
  '58': 'Dolnośląskie', '59': 'Dolnośląskie',
  '60': 'Wielkopolskie', '61': 'Wielkopolskie', '62': 'Wielkopolskie', '63': 'Wielkopolskie', '64': 'Wielkopolskie',
  '65': 'Lubuskie', '66': 'Lubuskie', '67': 'Lubuskie', '68': 'Lubuskie', '69': 'Lubuskie',
  '70': 'Zachodniopomorskie', '71': 'Zachodniopomorskie', '72': 'Zachodniopomorskie', 
  '73': 'Zachodniopomorskie', '74': 'Zachodniopomorskie',
  '75': 'Zachodniopomorskie', '76': 'Pomorskie', '77': 'Pomorskie', // 76-77 shared/border, assign Pomorskie often
  '78': 'Zachodniopomorskie', '79': 'Zachodniopomorskie',
  '80': 'Pomorskie', '81': 'Pomorskie', '82': 'Pomorskie', '83': 'Pomorskie', '84': 'Pomorskie',
  '85': 'Kujawsko-pomorskie', '86': 'Kujawsko-pomorskie', '87': 'Kujawsko-pomorskie',
  '88': 'Kujawsko-pomorskie', '89': 'Kujawsko-pomorskie',
  '90': 'Łódzkie', '91': 'Łódzkie', '92': 'Łódzkie', '93': 'Łódzkie', '94': 'Łódzkie',
  '95': 'Łódzkie', '96': 'Łódzkie', '97': 'Łódzkie', '98': 'Łódzkie', '99': 'Łódzkie'
}

const getVoivodeshipFromPostalCode = (postalCode) => {
  if (!postalCode) return null
  // Format XX-XXX or XXXXX or XX XXX
  const cleaned = postalCode.replace(/[^0-9]/g, '')
  if (cleaned.length < 2) return null
  const prefix = cleaned.substring(0, 2)
  return POSTAL_CODE_MAP[prefix] || null
}

const assignVoivodeships = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('📦 Connected to MongoDB')

    const carriers = await Carrier.find()
    console.log(`Found ${carriers.length} carriers`)

    let updatedCount = 0

    for (const carrier of carriers) {
      if (carrier.location && carrier.location.postalCode) {
        const voivodeship = getVoivodeshipFromPostalCode(carrier.location.postalCode)
        
        if (voivodeship) {
          // Check if already in array
          if (!carrier.servedVoivodeships) {
            carrier.servedVoivodeships = []
          }

          if (!carrier.servedVoivodeships.includes(voivodeship)) {
            carrier.servedVoivodeships.push(voivodeship)
            // Save as startVoivodeship if not set - user asked for "starting" voivodeship
            // I'll reuse servedVoivodeships for searching but ensure it's there.
            // But user asked for "województwo domyślne z którego startują" AND "wybrać z jakiego województwa to jest"
            // Maybe I should assume "servedVoivodeships" handles this.
            
            await carrier.save()
            console.log(`✅ Updated ${carrier.companyName}: +${voivodeship}`)
            updatedCount++
          }
        }
      }
    }

    console.log(`🎉 Finished! Updated ${updatedCount} carriers.`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

assignVoivodeships()
