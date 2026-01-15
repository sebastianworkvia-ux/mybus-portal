import fs from 'fs'
import csv from 'csv-parser'
import bcrypt from 'bcryptjs'
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
        .pipe(csv({ separator: ';' }))
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

        const email = row['Email']?.trim() || `${companyName.toLowerCase().replace(/\s+/g, '')}@imported.mybus.eu`
        const phone = row['Numer telefonu']?.trim()
        const website = row['Strona WWW']?.trim()
        const postalCode = row['Kod pocztowy']?.trim()
        const city = row['Miasto']?.trim()
        const operatingCountriesStr = row['Wybierz kraje, w których świadczysz usługi transportowe']?.trim()
        const servicesStr = row['Oferowane usługi']?.trim()
        const description = row['Opis firmy']?.trim() || `Firma transportowa ${companyName}`
        const companyRegistration = row['Numer rejestracyjny firmy']?.trim() || 'IMPORT'

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
        await Carrier.create({
          userId: user._id,
          companyName,
          companyRegistration,
          country: 'PL',
          description,
          phone,
          email: row['Email']?.trim() || undefined,
          website,
          services,
          operatingCountries: operatingCountries.slice(0, 5), // max 5 krajów
          location: {
            postalCode,
            city
          },
          isPremium: false,
          isVerified: false,
          isActive: true
        })

        imported++

      } catch (err) {
        errors.push({ companyName, error: err.message })
        console.error(`❌ Błąd dla ${companyName}:`, err.message)
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
