/**
 * Auto-tagowanie firm na podstawie słów kluczowych w nazwie firmy
 * 
 * Tryb:
 *   --dry-run   - tylko pokaż co by zostało otagowane (bezpieczne)
 *   --apply     - zastosuj zmiany w bazie
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

const isDryRun = !process.argv.includes('--apply')
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Słowa kluczowe → tag usługi
const KEYWORD_RULES = [
  {
    tag: 'autokary',
    keywords: [
      'autokar', 'autokary', 'autobus', 'autobusa', 'autobusy',
      'wycieczk', 'turystyczn', 'pielgrzym',
      'wynajem autokaru', 'wynajem autobusa',
      'autosan', 'setra', 'neoplan', 'irizar'
    ]
  },
  {
    tag: 'transfery-lotniskowe',
    keywords: [
      'lotnisk', 'airport', 'flybus', 'fly bus',
      'taxibus', 'taxi bus', 'chauffeur',
      'schiphol', 'flytransfer', 'skytransfer', 'air-transfer',
      'transfery lotniskowe', 'transfer lotniskowy'
    ]
  },
  {
    tag: 'zwierzeta',
    keywords: [
      'transport zwierząt', 'transport zwierzat', 'przewóz zwierząt',
      'przewoz zwierzat', 'animal transport', 'pet transport',
      'transport psów', 'transport koni', 'przewóz psów'
    ]
  },
  {
    tag: 'przeprowadzki',
    keywords: [
      'przeprowadzk', 'przeprowadzkow', 'relocation',
      'transport mebli', 'przeprowadzenia'
    ]
  },
  {
    tag: 'przejazdy-sluzbowe',
    keywords: [
      'służbow', 'służbowy', 'pracownicz', 'biznesow', 'business travel',
      'korporacyjn', 'limuzyn', 'taxi premium',
      'executive', 'delegacj', 'wyjazdy biznesowe', 'transport biznes'
    ]
  },
  {
    tag: 'paczki',
    keywords: [
      'paczk', 'przesyłk', 'kurier', 'cargo bus', 'dpd',
      'parcel', 'dostawcz', 'spedycj'
    ]
  },
  {
    tag: 'laweta',
    keywords: [
      'laweta', 'lawety', 'autolaweta', 'auto laweta',
      'pomoc drogowa', 'pomocdrogowa', 'holowanie', 'holownik',
      'autopomoc', 'auto pomoc', 'truck-hol', 'truckhol',
      'pomoc techniczna', 'assistance'
    ]
  }
]

function matchesKeywords(text, keywords) {
  const lower = (text || '').toLowerCase()
  return keywords.some(kw => lower.includes(kw.toLowerCase()))
}

async function autoTag() {
  console.log(`\n🏷️  AUTO-TAGOWANIE FIRM`)
  console.log(`   Tryb: ${isDryRun ? '🔍 DRY-RUN (żadnych zmian)' : '⚡ STOSOWANIE ZMIAN'}\n`)
  if (isDryRun) {
    console.log('   (uruchom z --apply żeby zapisać zmiany)\n')
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 60000
  })
  console.log('✅ Połączono z MongoDB\n')

  const allCarriers = await Carrier.find({ isActive: true })
    .select('_id companyName description services')
    .lean()

  console.log(`📋 Analizuję ${allCarriers.length} aktywnych firm...\n`)

  const results = {}
  for (const rule of KEYWORD_RULES) {
    results[rule.tag] = []
  }

  for (const carrier of allCarriers) {
    const textToSearch = `${carrier.companyName} ${carrier.description || ''}`
    
    for (const rule of KEYWORD_RULES) {
      const alreadyHasTag = carrier.services && carrier.services.includes(rule.tag)
      if (!alreadyHasTag && matchesKeywords(textToSearch, rule.keywords)) {
        results[rule.tag].push(carrier)
      }
    }
  }

  // Pokaż wyniki
  let totalToTag = 0
  for (const rule of KEYWORD_RULES) {
    const matches = results[rule.tag]
    if (matches.length === 0) continue
    
    totalToTag += matches.length
    console.log(`═══════════════════════════════════════════`)
    console.log(`🏷️  TAG: "${rule.tag}" → ${matches.length} nowych firm\n`)
    matches.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.companyName}`)
    })
  }

  if (totalToTag === 0) {
    console.log('✅ Brak firm do otagowania!')
    await mongoose.connection.close()
    return
  }

  console.log(`\n═══════════════════════════════════════════`)
  console.log(`📊 PODSUMOWANIE: ${totalToTag} firm do otagowania`)
  console.log(`═══════════════════════════════════════════\n`)

  if (isDryRun) {
    console.log('👆 To jest PODGLĄD. Uruchom z --apply żeby zapisać.\n')
    await mongoose.connection.close()
    return
  }

  // Stosuj zmiany
  console.log('🚀 Stosuję zmiany...\n')
  let updated = 0
  let errors = 0

  for (const rule of KEYWORD_RULES) {
    const matches = results[rule.tag]
    if (matches.length === 0) continue
    
    console.log(`\nTagowanie "${rule.tag}" (${matches.length} firm):`)
    for (let i = 0; i < matches.length; i++) {
      const carrier = matches[i]
      try {
        await Carrier.updateOne(
          { _id: carrier._id },
          { $addToSet: { services: rule.tag } }
        )
        updated++
        console.log(`  [${i + 1}/${matches.length}] ✓ ${carrier.companyName}`)
        if (i < matches.length - 1) await delay(150)
      } catch (err) {
        errors++
        console.log(`  [${i + 1}/${matches.length}] ✗ BŁĄD: ${carrier.companyName} - ${err.message}`)
      }
    }
  }

  console.log(`\n═══════════════════════════════════════════`)
  console.log(`📊 REZULTAT:`)
  console.log(`   ✅ Zaktualizowano: ${updated}`)
  console.log(`   ❌ Błędów: ${errors}`)
  console.log(`═══════════════════════════════════════════\n`)

  await mongoose.connection.close()
}

autoTag().catch(async (err) => {
  console.error('\n❌ Błąd:', err.message)
  await mongoose.connection.close()
  process.exit(1)
})
