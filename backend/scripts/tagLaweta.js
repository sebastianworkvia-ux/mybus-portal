/**
 * Dodaj tag 'laweta' do firm z CSV - wersja optymalna dla Atlas free tier
 * 
 * NIE używa $in z 300+ wariantami (za wolne).
 * Zamiast tego: pobiera WSZYSTKICH przewoźników do pamięci JS,
 * dopasowuje telefony lokalnie, aktualizuje po jednym z opóźnieniem.
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import fs from 'fs'
import csv from 'csv-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CSV_FILE = path.resolve(__dirname, '../google-maps-crawler/carriers_format_admin.csv')

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Normalizuj numer telefonu do formy porównawczej (same cyfry, bez +48)
function normalizePhone(phone) {
  if (!phone) return ''
  let p = phone.replace(/\s+/g, '').replace(/[-().]/g, '')
  // Usuń prefix +48 lub 48 na początku
  if (p.startsWith('+48')) p = p.substring(3)
  else if (p.startsWith('48') && p.length === 11) p = p.substring(2)
  return p
}

async function readCsvPhones() {
  return new Promise((resolve, reject) => {
    const phones = []
    fs.createReadStream(CSV_FILE, 'latin1')
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        const phone = row['Numer telefonu'] || row['phone'] || ''
        const normalized = normalizePhone(phone)
        if (normalized) phones.push(normalized)
      })
      .on('end', () => resolve([...new Set(phones)]))
      .on('error', reject)
  })
}

async function run() {
  console.log('\n🔧 TAGOWANIE LAWETA - optymalna wersja dla Atlas free tier\n')

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 60000,
    connectTimeoutMS: 30000
  })
  console.log('✅ Połączono z MongoDB\n')

  // 1. Odczytaj numery z CSV
  const csvPhones = await readCsvPhones()
  console.log(`📋 Numery z CSV (po normalizacji): ${csvPhones.length} unikalnych`)
  console.log(`   Przykłady: ${csvPhones.slice(0, 5).join(', ')}\n`)

  // 2. KLUCZ: Pobierz WSZYSTKICH przewoźników tylko z polami phone i services
  //    To prosta pełna kolekcja - Atlas powinien to obsłużyć bez timeoutu
  console.log('📥 Pobieranie wszystkich przewoźników z bazy (tylko phone + services)...')
  const allCarriers = await Carrier.find({}).select('_id companyName phone services').lean()
  console.log(`✅ Pobrano ${allCarriers.length} przewoźników z bazy\n`)

  // 3. Dopasowanie w JavaScript (nie w MongoDB) - błyskawiczne
  const toUpdate = []
  for (const carrier of allCarriers) {
    const carrierPhoneNorm = normalizePhone(carrier.phone)
    if (carrierPhoneNorm && csvPhones.includes(carrierPhoneNorm)) {
      const alreadyHasLaweta = carrier.services && carrier.services.includes('laweta')
      toUpdate.push({ 
        id: carrier._id, 
        name: carrier.companyName,
        phone: carrier.phone,
        alreadyTagged: alreadyHasLaweta
      })
    }
  }

  const needsUpdate = toUpdate.filter(c => !c.alreadyTagged)
  console.log(`🔍 Wyniki dopasowania:`)
  console.log(`   Dopasowanych firm: ${toUpdate.length}`)
  console.log(`   Już mają tag 'laweta': ${toUpdate.filter(c => c.alreadyTagged).length}`)
  console.log(`   Do zaktualizowania: ${needsUpdate.length}\n`)

  if (needsUpdate.length === 0) {
    console.log('✅ Wszystkie dopasowane firmy już mają tag laweta!')
    await mongoose.connection.close()
    return
  }

  // 4. Aktualizuj po jednym z małym opóźnieniem - nie przeciąża Atlas
  console.log(`🚀 Aktualizuję ${needsUpdate.length} firm (jedna po drugiej)...\n`)
  let updated = 0
  let errors = 0

  for (let i = 0; i < needsUpdate.length; i++) {
    const carrier = needsUpdate[i]
    try {
      await Carrier.updateOne(
        { _id: carrier.id },
        { $addToSet: { services: 'laweta' } }
      )
      updated++
      console.log(`  [${i + 1}/${needsUpdate.length}] ✓ ${carrier.name} (${carrier.phone})`)
      // Krótkie opóźnienie żeby nie przeciążyć Atlas
      if (i < needsUpdate.length - 1) await delay(200)
    } catch (err) {
      errors++
      console.log(`  [${i + 1}/${needsUpdate.length}] ✗ BŁĄD: ${carrier.name} - ${err.message}`)
    }
  }

  console.log(`\n═══════════════════════════════════════`)
  console.log(`📊 PODSUMOWANIE:`)
  console.log(`   ✅ Zaktualizowano: ${updated} firm`)
  console.log(`   ❌ Błędów: ${errors}`)
  console.log(`   ℹ️  Już miały tag: ${toUpdate.filter(c => c.alreadyTagged).length}`)
  console.log(`═══════════════════════════════════════\n`)

  await mongoose.connection.close()
  console.log('Połączenie zamknięte.')
}

run().catch(async (err) => {
  console.error('\n❌ Błąd globalny:', err.message)
  await mongoose.connection.close()
  process.exit(1)
})
