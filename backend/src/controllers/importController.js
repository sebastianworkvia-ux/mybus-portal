import fs from 'fs'
import csv from 'csv-parser'
import bcrypt from 'bcryptjs'
import axios from 'axios'
import iconv from 'iconv-lite'
import { Readable } from 'stream'
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
  'Luksemburg': 'LU',
  'DE': 'DE',
  'NL': 'NL',
  'BE': 'BE',
  'FR': 'FR',
  'AT': 'AT',
  'PL': 'PL'
}

// Mapowanie usług
const SERVICE_MAP = {
  'Przewóz osób': 'transport',
  'Przewoz osób': 'transport',
  'Paczki': 'paczki',
  'Transport rzeczy': 'transport-rzeczy',
  'Przeprowadzki': 'przeprowadzki',
  'Zwierzęta': 'zwierzeta',
  'Dokumenty': 'dokumenty',
  'transport': 'transport',
  'paczki': 'paczki'
}

function parseCountries(countriesStr) {
  if (!countriesStr) return []
  
  const rawCountries = countriesStr.split(',').map(c => c.trim())
  const countries = rawCountries
    .map(c => {
      // Próbuj bezpośrednio z mapy
      if (COUNTRY_MAP[c]) return COUNTRY_MAP[c]
      // Normalizuj - usuń dziwne znaki, zostaw tylko podstawowe
      const normalized = c.replace(/[^A-Za-z]/g, '')
      // Sprawdź czy to jest już kod kraju
      if (['DE', 'NL', 'BE', 'FR', 'AT', 'PL', 'CH', 'DK', 'NO', 'GB', 'LU'].includes(normalized.toUpperCase())) {
        return normalized.toUpperCase()
      }
      return null
    })
    .filter(Boolean)
  
  return [...new Set(countries)]
}

function parseServices(servicesStr) {
  if (!servicesStr) return ['transport']
  
  const rawServices = servicesStr.split(',').map(s => s.trim())
  const services = rawServices
    .map(s => {
      // Próbuj z mapy
      if (SERVICE_MAP[s]) return SERVICE_MAP[s]
      // Normalizuj
      const lower = s.toLowerCase()
      if (lower.includes('przew') || lower.includes('osob')) return 'transport'
      if (lower.includes('paczk')) return 'paczki'
      if (lower.includes('przeprowadz')) return 'przeprowadzki'
      if (lower.includes('rzecz')) return 'transport-rzeczy'
      return 'transport'
    })
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

    // Parsuj CSV z auto-detekcją kodowania
    await new Promise((resolve, reject) => {
      const buffer = fs.readFileSync(req.file.path)
      let decoded
      try {
        decoded = iconv.decode(buffer, 'windows-1250')
      } catch (e) {
        try {
          decoded = iconv.decode(buffer, 'iso-8859-2')
        } catch (e2) {
          decoded = buffer.toString('utf-8')
        }
      }

      console.log('📝 Przykład dekodowanego tekstu:', decoded.substring(0, 200))

      Readable.from([decoded])
        .pipe(csv({
          separator: ';',
          mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim(),
          skipEmptyLines: true
        }))
        .on('data', (row) => results.push(row))
        .on('end', resolve)
        .on('error', reject)
    })

    console.log(`📋 Znaleziono ${results.length} wierszy w CSV`)
    if (results.length > 0) {
      console.log('📝 Kolumny w CSV:', Object.keys(results[0]))
    }

    // OPTYMALIZACJA: Pobierz istniejące telefony i nazwy DO PAMIĘCI (1 zapytanie zamiast 2000)
    const existingCarriers = await Carrier.find({}).select('phone companyName').lean()
    const existingPhones = new Set(existingCarriers.map(c => c.phone).filter(Boolean))
    const existingNames = new Set(existingCarriers.map(c => c.companyName).filter(Boolean))
    console.log(`📊 Istniejące firmy w bazie: ${existingCarriers.length} (${existingPhones.size} z telefonem)`)

    // Przygotuj dokumenty do wstawienia (batch insert)
    const toInsert = []

    for (const row of results) {
      const allFieldsEmpty = Object.values(row).every(val => !val || val.trim() === '')
      if (allFieldsEmpty) continue

      const companyName = row['Nazwa firmy']?.trim()
      if (!companyName) { skipped++; continue }

      const phone = row['Numer telefonu']?.trim()

      // Sprawdź duplikaty w pamięci (błyskawiczne)
      if (phone && existingPhones.has(phone)) {
        console.log(`  ⏭️ Pomijam duplikat (tel): ${companyName}`)
        skipped++
        continue
      }
      if (existingNames.has(companyName)) {
        console.log(`  ⏭️ Pomijam duplikat (nazwa): ${companyName}`)
        skipped++
        continue
      }

      // Dodaj do set żeby nie duplikować wewnątrz tego samego CSV
      if (phone) existingPhones.add(phone)
      existingNames.add(companyName)

      const companyRegistration = row['Numer rejestracyjny firmy']?.trim()
      const country = row['Kraj działalności']?.trim()
      const email = row['Email']?.trim()
      const website = row['Strona WWW']?.trim()
      const descriptionBase = row['Opis firmy']?.trim()
      const postalCode = row['Kod pocztowy']?.trim()
      const city = row['Miasto']?.trim()
      const operatingCountriesStr = row['Wybierz kraje, w których świadczysz usługi transportowe']?.trim()
      const servicesStr = row['Oferowane usługi']?.trim()
      const departureDays = row['Dni wyjazdów do Polski']?.trim()
      const returnDays = row['Dni powrotów z Polski']?.trim()
      const baggageInfo = row['Informacje o bagażu']?.trim()

      let description = descriptionBase || ''
      if (departureDays) description += `\n\nDni wyjazdów do Polski: ${departureDays}`
      if (returnDays) description += `\n\nDni powrotów z Polski: ${returnDays}`
      if (baggageInfo) description += `\n\nInformacje o bagażu: ${baggageInfo}`
      description = description.trim()

      const operatingCountries = parseCountries(operatingCountriesStr)
      const services = parseServices(servicesStr)

      let carrierCountry = 'PL'
      if (country) {
        const countryCode = COUNTRY_MAP[country] || country.toUpperCase()
        if (['DE', 'NL', 'BE', 'FR', 'AT', 'PL', 'GB', 'SE', 'NO', 'DK'].includes(countryCode)) {
          carrierCountry = countryCode
        }
      }

      toInsert.push({
        userId: null,
        companyName,
        companyRegistration: companyRegistration || undefined,
        country: carrierCountry,
        description,
        phone,
        email: email || undefined,
        website,
        services,
        operatingCountries: operatingCountries.slice(0, 8),
        location: { postalCode, city, coordinates: null },
        isPremium: false,
        isVerified: false,
        isActive: true
      })
    }

    console.log(`📦 Do wstawienia: ${toInsert.length} firm (pominięto ${skipped} duplikatów)`)

    // OPTYMALIZACJA: insertMany w batchach po 100 (zamiast create() 1000×)
    const BATCH_SIZE = 100
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE)
      try {
        await Carrier.insertMany(batch, { ordered: false })
        imported += batch.length
        console.log(`  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: wstawiono ${batch.length} firm (razem: ${imported})`)
      } catch (batchErr) {
        // ordered: false — wstawia co może, raportuje błędy
        const inserted = batchErr.result?.nInserted || 0
        imported += inserted
        const errCount = batch.length - inserted
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${errCount} błędów`)
        console.error(`  ⚠️ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${inserted} ok, ${errCount} błędów`)
      }
    }

    // Usuń tymczasowy plik
    fs.unlinkSync(req.file.path)

    console.log(`\n✅ Import zakończony: ${imported} zaimportowano, ${skipped} pominięto, ${errors.length} błędów`)

    res.json({
      success: true,
      imported,
      skipped,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
      total: results.length
    })

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    next(error)
  }
}
