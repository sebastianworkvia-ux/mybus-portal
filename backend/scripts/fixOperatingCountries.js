/**
 * Naprawa operatingCountries dla 1072 firm z błędnym [AT,BE,DE,FR,NL,PL]
 * 
 * Strategia:
 * 1. Dopasuj firmę do wiersza w CSV po telefonie lub nazwie → weź kraje z CSV
 * 2. Jeśli nie ma w CSV → wykryj kraje z nazwy firmy
 * 3. Zawsze dodaj PL
 * 
 * Uruchom: node scripts/fixOperatingCountries.js
 * Dry run: node scripts/fixOperatingCountries.js --dry-run
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env') })

import Carrier from '../src/models/Carrier.js'

const isDryRun = process.argv.includes('--dry-run')

// === Mapowanie krajów ===
const COUNTRY_MAP = {
  'Polska': 'PL', 'polska': 'PL',
  'Niemcy': 'DE', 'niemcy': 'DE', 'Niemiec': 'DE',
  'Holandia': 'NL', 'holandia': 'NL',
  'Belgia': 'BE', 'belgia': 'BE',
  'Francja': 'FR', 'francja': 'FR',
  'Austria': 'AT', 'austria': 'AT',
  'Dania': 'DK', 'dania': 'DK',
  'Szwajcaria': 'CH', 'szwajcaria': 'CH',
  'Norwegia': 'NO', 'norwegia': 'NO',
  'Anglia': 'GB', 'anglia': 'GB',
  'Luksemburg': 'LU', 'luksemburg': 'LU',
}

function parseCountriesFromStr(str) {
  if (!str || str === 'BRAK') return []
  return [...new Set(
    str.split(',')
      .map(s => s.trim())
      .map(s => COUNTRY_MAP[s] || null)
      .filter(Boolean)
  )]
}

// Wykryj kraje z nazwy firmy
function detectFromName(name) {
  const lower = name.toLowerCase()
  const countries = new Set(['PL'])

  if (lower.match(/niemiec|niemcy|niemcz|niemecia|germany|deutsch|monach|hamburg|berlin|münchen|munchen|frankfurt|koeln|düsseldorf|dusseldorf/))
    countries.add('DE')
  if (lower.match(/holand|nederland|amsterdam|rotterdam|eindhoven|utrecht/))
    countries.add('NL')
  if (lower.match(/belgi|belgium|bruksel|brussel|antwerp/))
    countries.add('BE')
  if (lower.match(/francj|france|paris|lyon|lille/))
    countries.add('FR')
  if (lower.match(/austri|österreich|oesterreich|wien|salzburg|innsbruck/))
    countries.add('AT')
  if (lower.match(/dani|denmark|kopenhag/))
    countries.add('DK')
  if (lower.match(/szwajcar|switzerland|swiss|zurich|zürich/))
    countries.add('CH')
  if (lower.match(/norweg|norway|oslo/))
    countries.add('NO')
  if (lower.match(/angli|anglia|england|britain|london|uk\b/))
    countries.add('GB')
  if (lower.match(/luksemburg|luxembourg/))
    countries.add('LU')

  return [...countries]
}

// Wczytaj CSV i zbuduj mapę: telefon → kraje, nazwa → kraje
function loadCsvData(csvPath) {
  if (!fs.existsSync(csvPath)) return { byPhone: {}, byName: {} }
  const content = fs.readFileSync(csvPath, 'utf8')
  const lines = content.split('\n').filter(l => l.trim())
  const byPhone = {}
  const byName = {}
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';')
    const name = cols[0]?.trim()
    const phone = cols[4]?.trim()?.replace(/\s+/g, '')
    const countriesStr = cols[9]?.trim()
    const countries = parseCountriesFromStr(countriesStr)
    if (countries.length === 0) continue
    if (phone) byPhone[phone] = countries
    if (name) byName[name.toLowerCase()] = countries
  }
  return { byPhone, byName }
}

async function fixOperatingCountries() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log(`Connected to MongoDB (${isDryRun ? 'DRY RUN' : 'LIVE'})\n`)

  // Wczytaj oba CSV
  const csv1 = loadCsvData(path.join(__dirname, '../dane-firm.csv'))
  const csv2 = loadCsvData(path.join(__dirname, '../google-maps-crawler/carriers_for_import.csv'))

  // Scal mapy
  const byPhone = { ...csv1.byPhone, ...csv2.byPhone }
  const byName = { ...csv1.byName, ...csv2.byName }
  console.log(`CSV data: ${Object.keys(byPhone).length} telefonów, ${Object.keys(byName).length} nazw\n`)

  // Pobierz tylko firmy z 6 domyślnymi krajami
  const carriers = await Carrier.find(
    { operatingCountries: { $size: 6, $all: ['AT', 'BE', 'DE', 'FR', 'NL', 'PL'] } },
    'companyName phone operatingCountries'
  ).lean()

  console.log(`Firm do naprawy: ${carriers.length}\n`)

  const stats = { fromCsvPhone: 0, fromCsvName: 0, fromDetection: 0, unchanged: 0 }
  const updates = []

  for (const carrier of carriers) {
    const phoneNorm = carrier.phone?.replace(/\s+/g, '')
    let newCountries = null
    let source = ''

    // 1. Szukaj po telefonie w CSV
    if (phoneNorm && byPhone[phoneNorm]) {
      newCountries = byPhone[phoneNorm]
      source = 'csv-phone'
    }
    // 2. Szukaj po nazwie w CSV
    else if (byName[carrier.companyName.toLowerCase()]) {
      newCountries = byName[carrier.companyName.toLowerCase()]
      source = 'csv-name'
    }
    // 3. Wykryj z nazwy
    else {
      newCountries = detectFromName(carrier.companyName)
      source = 'name-detect'
    }

    // Zawsze dodaj PL
    if (!newCountries.includes('PL')) newCountries.push('PL')

    // Pomiń jeśli to nadal 6 krajów (wykryto wszystko z nazwy, mało prawdopodobne)
    const sortedNew = [...newCountries].sort().join(',')
    const sortedOld = [...carrier.operatingCountries].sort().join(',')

    if (sortedNew === sortedOld) {
      stats.unchanged++
      continue
    }

    if (source === 'csv-phone') stats.fromCsvPhone++
    else if (source === 'csv-name') stats.fromCsvName++
    else stats.fromDetection++

    updates.push({
      id: carrier._id,
      name: carrier.companyName,
      old: sortedOld,
      new: sortedNew,
      source
    })
  }

  console.log(`Planowane zmiany: ${updates.length}`)
  console.log(`  CSV (telefon):  ${stats.fromCsvPhone}`)
  console.log(`  CSV (nazwa):    ${stats.fromCsvName}`)
  console.log(`  Detekcja nazwy: ${stats.fromDetection}`)
  console.log(`  Bez zmian:      ${stats.unchanged}\n`)

  // Pokaż próbkę
  console.log('=== PRÓBKA ZMIAN (pierwsze 15) ===')
  updates.slice(0, 15).forEach(u =>
    console.log(`  [${u.source}] ${u.name}\n    ${u.old} → ${u.new}`)
  )

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN — brak zmian w bazie. Uruchom bez --dry-run aby zastosować.')
    await mongoose.disconnect()
    return
  }

  // Zastosuj zmiany batchami
  console.log('\nAplikuję zmiany...')
  const BATCH = 100
  let done = 0
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH)
    const ops = batch.map(u => ({
      updateOne: {
        filter: { _id: u.id },
        update: { $set: { operatingCountries: u.new.split(',') } }
      }
    }))
    await Carrier.bulkWrite(ops)
    done += batch.length
    console.log(`  Batch ${Math.floor(i / BATCH) + 1}: ${done}/${updates.length}`)
  }

  console.log(`\n✅ Zakończono. Zaktualizowano ${done} firm.`)
  await mongoose.disconnect()
}

fixOperatingCountries().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
