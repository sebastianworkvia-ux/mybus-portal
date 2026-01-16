import fs from 'fs'
import csv from 'csv-parser'
import bcrypt from 'bcryptjs'
import axios from 'axios'
import User from '../models/User.js'
import Carrier from '../models/Carrier.js'

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
  
  return [...new Set(countries)]
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

async function geocodeAddress(postalCode, city, country = 'PL') {
  if (!postalCode && !city) return null
  
  try {
    const query = `${postalCode || ''} ${city || ''}, ${country}`
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'MyBus-Transport-Portal'
      }
    })

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      }
    }
    return null
  } catch (err) {
    console.error(`Błąd geokodowania dla ${postalCode} ${city}:`, err.message)
    return null
  }
}

export const importCarriers = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Brak pliku CSV' })
    }

    const results = []
    const errors = []
    let imported = 0
    let skipped = 0

    // Parsuj CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path, { encoding: 'utf-8' })
        .pipe(csv({ 
          separator: ';',
          skipEmptyLines: true,
          headers: true
        }))
        .on('data', (row) => {
          results.push(row)
        })
        .on('end', resolve)
        .on('error', reject)
    })

    console.log(`📋 Znaleziono ${results.length} wierszy w CSV`)

    // Przetwórz każdy wiersz
    for (const row of results) {
      const companyName = row['Nazwa firmy']?.trim()
      const companyRegistration = row['NIP']?.trim() || row['Numer rejestracyjny']?.trim()
      const phone = row['Telefon']?.trim()
      const email = row['Email']?.trim()
      const website = row['Strona www']?.trim()
      const description = row['Opis']?.trim()
      const postalCode = row['Kod pocztowy']?.trim()
      const city = row['Miasto']?.trim()
      const operatingCountriesStr = row['Kraje działania']?.trim()
      const servicesStr = row['Usługi']?.trim()
      
      if (!companyName) {
        skipped++
        continue
      }

      try {
        // Sprawdź czy firma już istnieje
        const existingCarrier = await Carrier.findOne({ companyName })
        if (existingCarrier) {
          skipped++
          continue
        }

        // Znajdź lub utwórz użytkownika
        let user
        if (email) {
          user = await User.findOne({ email })
          if (!user) {
            // Utwórz domyślne konto dla przewoźnika
            const password = await bcrypt.hash('TymczasoweHaslo123!', 10)
            user = await User.create({
              email,
              password,
              firstName: companyName.split(' ')[0],
              lastName: 'Przewoźnik',
              userType: 'carrier',
              isPremium: false
            })
          }
        } else {
          // Jeśli brak emaila, utwórz generyczny email
          const generatedEmail = `import_${Date.now()}_${Math.random().toString(36).substring(7)}@mybus.temp`
          const password = await bcrypt.hash('TymczasoweHaslo123!', 10)
          user = await User.create({
            email: generatedEmail,
            password,
            firstName: companyName.split(' ')[0],
            lastName: 'Import',
            userType: 'carrier',
            isPremium: false
          })
        }
        
        // Parsuj kraje i usługi
        const operatingCountries = parseCountries(operatingCountriesStr)
        const services = parseServices(servicesStr)
        
        // Geokoduj adres (z opóźnieniem 1s żeby nie przekroczyć limitu API)
        await new Promise(resolve => setTimeout(resolve, 1000))
        const coordinates = await geocodeAddress(postalCode, city, 'PL')

        // Utwórz przewoźnika
        await Carrier.create({
          userId: user._id,
          companyName,
          companyRegistration,
          country: 'PL',
          description,
          phone,
          email: email || undefined,
          website,
          services,
          operatingCountries: operatingCountries.slice(0, 5), // max 5 krajów
          location: {
            postalCode,
            city,
            coordinates
          },
          isPremium: false,
          isVerified: false,
          isActive: true
        })

        imported++
        console.log(`✅ ${companyName} - zaimportowano ${coordinates ? 'z współrzędnymi' : 'bez współrzędnych'}`)

      } catch (itemError) {
        console.error(`❌ Błąd dla ${companyName}:`, itemError.message)
        errors.push(`${companyName}: ${itemError.message}`)
      }
    }

    // Usuń tymczasowy plik
    fs.unlinkSync(req.file.path)

    res.json({
      success: true,
      imported,
      skipped,
      errors: errors.length,
      errorDetails: errors.slice(0, 10), // tylko pierwsze 10 błędów
      total: results.length
    })

  } catch (error) {
    // Usuń plik w razie błędu
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    next(error)
  }
}
