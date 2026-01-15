import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import User from '../src/models/User.js'
import Carrier from '../src/models/Carrier.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

// Mapowanie krajów na kody
const COUNTRY_MAP = {
  'Niemcy': 'DE',
  'Holandia': 'NL',
  'Belgia': 'BE',
  'Francja': 'FR',
  'Austria': 'AT',
  'Polska': 'PL',
  'Szwajcaria': 'CH',
  'Dania': 'DK',
  'Norwegia': 'NO',
  'Anglia': 'GB',
  'Luksemburg': 'LU'
}

// Mapowanie usług
const SERVICE_MAP = {
  'Przewóz osób': 'transport',
  'Przewoz osób': 'transport',
  'Paczki': 'paczki',
  'Transport rzeczy': 'transport-rzeczy',
  'Przeprowadzki': 'przeprowadzki',
  'Zwierzęta': 'zwierzeta',
  'Dokumenty': 'dokumenty'
}

function parseCountries(countriesStr) {
  if (!countriesStr) return []
  
  const countries = countriesStr
    .split(',')
    .map(c => c.trim())
    .map(c => COUNTRY_MAP[c])
    .filter(Boolean)
  
  return [...new Set(countries)] // unikalne wartości
}

function parseServices(servicesStr) {
  if (!servicesStr) return ['transport']
  
  const services = servicesStr
    .split(',')
    .map(s => s.trim())
    .map(s => SERVICE_MAP[s] || 'inne')
    .filter(Boolean)
  
  return [...new Set(services)]
}

function parseDays(daysStr) {
  if (!daysStr) return []
  // Tutaj możesz dodać logikę parsowania dni
  return []
}

async function importCarriers() {
  try {
    console.log('🔌 Łączenie z MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Połączono z MongoDB')

    const csvPath = path.join(__dirname, '../dane-firm.csv')
    const fileContent = fs.readFileSync(csvPath, 'utf-8')
    
    const lines = fileContent.split('\n').filter(line => line.trim())
    const headers = lines[0].split(';')
    
    console.log(`📋 Znaleziono ${lines.length - 1} firm do importu\n`)

    let imported = 0
    let skipped = 0
    let errors = 0

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';')
      
      const companyName = values[0]?.trim()
      if (!companyName) {
        skipped++
        continue
      }

      const email = values[5]?.trim() || `${companyName.toLowerCase().replace(/\s+/g, '')}@imported.mybus.eu`
      const phone = values[4]?.trim()
      const website = values[6]?.trim()
      const postalCode = values[7]?.trim()
      const city = values[8]?.trim()
      const operatingCountriesStr = values[9]?.trim()
      const servicesStr = values[10]?.trim()
      const description = values[3]?.trim() || `Firma transportowa ${companyName}`
      const companyRegistration = values[1]?.trim() || 'BRAK'

      try {
        // Sprawdź czy firma już istnieje
        const existingCarrier = await Carrier.findOne({ companyName })
        if (existingCarrier) {
          console.log(`⏭️  ${i}/${lines.length - 1}: ${companyName} - już istnieje`)
          skipped++
          continue
        }

        // Utwórz użytkownika
        const hashedPassword = await bcrypt.hash('TymczasoweHaslo123!', 10)
        const user = await User.create({
          email,
          password: hashedPassword,
          firstName: companyName,
          lastName: 'Import',
          userType: 'carrier',
          isPremium: false,
          isAdmin: false,
          isActive: true
        })

        // Parsuj kraje i usługi
        const operatingCountries = parseCountries(operatingCountriesStr)
        const services = parseServices(servicesStr)

        // Utwórz przewoźnika
        const carrier = await Carrier.create({
          userId: user._id,
          companyName,
          companyRegistration,
          country: 'PL',
          description,
          phone,
          email: values[5]?.trim() || undefined,
          website,
          services,
          operatingCountries,
          location: {
            postalCode,
            city
          },
          isPremium: false,
          isVerified: false,
          isActive: true
        })

        imported++
        console.log(`✅ ${i}/${lines.length - 1}: ${companyName} - zaimportowano`)

      } catch (err) {
        errors++
        console.error(`❌ ${i}/${lines.length - 1}: ${companyName} - błąd:`, err.message)
      }
    }

    console.log('\n📊 Podsumowanie:')
    console.log(`✅ Zaimportowano: ${imported}`)
    console.log(`⏭️  Pominięto: ${skipped}`)
    console.log(`❌ Błędy: ${errors}`)

    await mongoose.disconnect()
    console.log('\n🔌 Rozłączono z MongoDB')
    
  } catch (err) {
    console.error('❌ Błąd krytyczny:', err)
    process.exit(1)
  }
}

importCarriers()
