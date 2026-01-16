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
      // Najpierw odczytaj plik jako buffer żeby wykryć kodowanie
      const buffer = fs.readFileSync(req.file.path)
      
      // Spróbuj różnych kodowań - Windows-1250 (Europa Środkowa) lub ISO-8859-2
      let decoded
      try {
        // Próba 1: Windows-1250 (najczęstsze dla polskich plików)
        decoded = iconv.decode(buffer, 'windows-1250')
      } catch (e) {
        try {
          // Próba 2: ISO-8859-2
          decoded = iconv.decode(buffer, 'iso-8859-2')
        } catch (e2) {
          // Próba 3: UTF-8 (jeśli jednak był OK)
          decoded = buffer.toString('utf-8')
        }
      }
      
      console.log('📝 Przykład dekodowanego tekstu:', decoded.substring(0, 200))
      
      // Parsuj zdekodowany string
      Readable.from([decoded])
        .pipe(csv({ 
          separator: ';',
          mapHeaders: ({ header }) => {
            return header.replace(/^\uFEFF/, '').trim()
          },
          skipEmptyLines: true
        }))
        .on('data', (row) => {
          results.push(row)
        })
        .on('end', resolve)
        .on('error', reject)
    })

    console.log(`📋 Znaleziono ${results.length} wierszy w CSV`)

    // Pokaż nazwy kolumn z pierwszego wiersza
    if (results.length > 0) {
      console.log('📝 Kolumny w CSV:', Object.keys(results[0]))
    }

    // Przetwórz każdy wiersz
    for (const row of results) {
      // Pomiń całkowicie puste wiersze
      const allFieldsEmpty = Object.values(row).every(val => !val || val.trim() === '')
      if (allFieldsEmpty) {
        continue
      }

      const companyName = row['Nazwa firmy']?.trim()
      const companyRegistration = row['Numer rejestracyjny firmy']?.trim()
      const country = row['Kraj działalności']?.trim()
      const phone = row['Numer telefonu']?.trim()
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
      
      // Połącz opis z dodatkowymi informacjami
      let description = descriptionBase || ''
      if (departureDays) description += `\n\nDni wyjazdów do Polski: ${departureDays}`
      if (returnDays) description += `\n\nDni powrotów z Polski: ${returnDays}`
      if (baggageInfo) description += `\n\nInformacje o bagażu: ${baggageInfo}`
      description = description.trim()
      
      if (!companyName) {
        skipped++
        continue
      }

      console.log(`📦 Przetwarzanie: "${companyName}"`)

      try {
        // Sprawdź czy firma już istnieje
        const existingCarrier = await Carrier.findOne({ companyName })
        if (existingCarrier) {
          console.log(`  ⏭️ Pomijam - firma już istnieje`)
          skipped++
          continue
        }

        console.log(`  ✅ Nowa firma - importuję`)

        // Import CSV tworzy TYLKO karty firm, bez kont użytkowników
        
        // Parsuj kraje i usługi
        const operatingCountries = parseCountries(operatingCountriesStr)
        const services = parseServices(servicesStr)
        
        // Mapuj kraj działalności na kod
        let carrierCountry = 'PL'
        if (country) {
          const countryCode = COUNTRY_MAP[country] || country.toUpperCase()
          if (['DE', 'NL', 'BE', 'FR', 'AT', 'PL'].includes(countryCode)) {
            carrierCountry = countryCode
          }
        }
        
        // Geokoduj adres (z opóźnieniem 1s żeby nie przekroczyć limitu API)
        await new Promise(resolve => setTimeout(resolve, 1000))
        const coordinates = await geocodeAddress(postalCode, city, carrierCountry)

        // Utwórz przewoźnika (bez konta użytkownika)
        await Carrier.create({
          userId: null,
          companyName,
          companyRegistration: companyRegistration || undefined,
          country: carrierCountry,
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
