/**
 * generateMissingSlugs.js
 *
 * Jednorazowy skrypt generujący slug dla firm bez sluga w bazie.
 * Nie nadpisuje istniejących slugów. Obsługuje polskie i niemieckie znaki.
 *
 * Użycie:
 *   node scripts/generateMissingSlugs.js --dry-run    (tylko podgląd, brak zapisu)
 *   node scripts/generateMissingSlugs.js --execute     (realne zapisanie do MongoDB)
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

// ─── slug helper (identyczny z pre-save w Carrier.js) ────────────────────────

function generateSlug(companyName) {
  return companyName
    .toLowerCase()
    .replace(/[ąàáäâã]/g, 'a')
    .replace(/[ćç]/g, 'c')
    .replace(/[ęèéëê]/g, 'e')
    .replace(/[ł]/g, 'l')
    .replace(/[ńñ]/g, 'n')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[śš]/g, 's')
    .replace(/[üùúûũ]/g, 'u')
    .replace(/[źżžẑ]/g, 'z')
    .replace(/[ß]/g, 'ss')
    .replace(/[^\w\s-]/g, '')   // usuń znaki specjalne
    .replace(/\s+/g, '-')       // spacje → myślnik
    .replace(/-+/g, '-')        // podwójne myślniki → jeden
    .replace(/^-+|-+$/g, '')    // przytnij myślniki z brzegów
    .trim()
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function run() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const isExecute = args.includes('--execute')

  if (!isDryRun && !isExecute) {
    console.error('❌  Podaj tryb: --dry-run lub --execute')
    console.error('   Przykład: node scripts/generateMissingSlugs.js --dry-run')
    process.exit(1)
  }

  if (!process.env.MONGODB_URI) {
    console.error('❌  Brak MONGODB_URI w .env')
    process.exit(1)
  }

  console.log(`\n🔌 Łączenie z MongoDB...`)
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅ Połączono\n')

  const mode = isDryRun ? 'DRY-RUN (brak zapisu)' : 'EXECUTE (zapis do bazy)'
  console.log(`=== Tryb: ${mode} ===\n`)

  // Pobierz wszystkie firmy (aktywne i nieaktywne)
  const allCarriers = await Carrier.find({}).select('_id companyName slug isActive').lean()
  const total = allCarriers.length

  // Firmy bez sluga
  const withoutSlug = allCarriers.filter(c => !c.slug || c.slug.trim() === '')
  const withSlug    = total - withoutSlug.length

  console.log(`📊 Statystyki bazy:`)
  console.log(`   Wszystkich firm:       ${total}`)
  console.log(`   Z istniejącym slugiem: ${withSlug}`)
  console.log(`   Bez sluga (do naprawy): ${withoutSlug.length}\n`)

  if (withoutSlug.length === 0) {
    console.log('🎉 Wszystkie firmy mają już slug. Nic do zrobienia.')
    await mongoose.disconnect()
    return
  }

  // Pobierz wszystkie istniejące slugi (do walidacji unikalności)
  const existingSlugsRaw = await Carrier.find({ slug: { $exists: true, $ne: '' } })
    .select('slug _id')
    .lean()

  // Zbieramy slugi w Set (mutable — będziemy dodawać generowane w trakcie dry-run)
  const usedSlugs = new Set(existingSlugsRaw.map(c => c.slug))

  const results = {
    generated: [],
    conflicts: [],
    errors: [],
  }

  for (const carrier of withoutSlug) {
    if (!carrier.companyName || carrier.companyName.trim() === '') {
      results.errors.push({
        _id: carrier._id,
        reason: 'Brak nazwy firmy (companyName jest puste)',
      })
      continue
    }

    const baseSlug = generateSlug(carrier.companyName)

    if (!baseSlug) {
      results.errors.push({
        _id: carrier._id,
        companyName: carrier.companyName,
        reason: 'Slug po normalizacji jest pusty (sama nazwa zawiera tylko znaki specjalne)',
      })
      continue
    }

    // Znajdź unikalny slug
    let slug = baseSlug
    let counter = 2
    let hadConflict = false

    while (usedSlugs.has(slug)) {
      hadConflict = true
      slug = `${baseSlug}-${counter}`
      counter++
    }

    if (hadConflict) {
      results.conflicts.push({
        _id: carrier._id,
        companyName: carrier.companyName,
        baseSlug,
        resolvedSlug: slug,
      })
    }

    results.generated.push({
      _id: carrier._id,
      companyName: carrier.companyName,
      slug,
    })

    // Zarezerwuj slug w lokalnym zbiorze (unika konfliktów w obrębie tego samego przebiegu)
    usedSlugs.add(slug)
  }

  // ─── Raport ────────────────────────────────────────────────────────────────

  console.log(`📋 Wyniki generowania slugów:`)
  console.log(`   Do wygenerowania:  ${results.generated.length}`)
  console.log(`   Konflikty nazw:    ${results.conflicts.length}`)
  console.log(`   Błędy (pominięte): ${results.errors.length}\n`)

  if (results.generated.length > 0) {
    console.log('📝 Przykładowe wygenerowane slugi (pierwsze 10):')
    results.generated.slice(0, 10).forEach(r => {
      console.log(`   "${r.companyName}"  →  /carrier/${r.slug}`)
    })
    if (results.generated.length > 10) {
      console.log(`   ... i ${results.generated.length - 10} więcej`)
    }
    console.log()
  }

  if (results.conflicts.length > 0) {
    console.log('⚠️  Konflikty rozwiązane sufiksem:')
    results.conflicts.forEach(c => {
      console.log(`   "${c.companyName}":  ${c.baseSlug}  →  ${c.resolvedSlug}  (bazowy zajęty)`)
    })
    console.log()
  }

  if (results.errors.length > 0) {
    console.log('❌ Pominięte rekordy (błędy):')
    results.errors.forEach(e => {
      console.log(`   ID ${e._id}: ${e.reason}`)
    })
    console.log()
  }

  // ─── Zapis (tylko --execute) ────────────────────────────────────────────────

  if (isExecute) {
    console.log('💾 Zapisuję slugi do bazy...')

    let saved = 0
    let failed = 0

    for (const r of results.generated) {
      try {
        await Carrier.updateOne(
          { _id: r._id, $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] },
          { $set: { slug: r.slug } }
        )
        saved++
      } catch (err) {
        failed++
        console.error(`   ❌ Błąd zapisu ID ${r._id}: ${err.message}`)
      }
    }

    console.log(`\n✅ Zapisano: ${saved} slugów`)
    if (failed > 0) console.log(`❌ Błędy zapisu: ${failed}`)
  } else {
    console.log('ℹ️  Tryb dry-run — żadne dane nie zostały zmienione.')
    console.log('   Aby zapisać, uruchom: node scripts/generateMissingSlugs.js --execute\n')
  }

  // ─── Końcowe podsumowanie ───────────────────────────────────────────────────

  console.log('\n=== PODSUMOWANIE ===')
  console.log(`Wszystkich firm:           ${total}`)
  console.log(`Firm bez sluga (wykryto):  ${withoutSlug.length}`)
  console.log(`Slugi do wygenerowania:    ${results.generated.length}`)
  console.log(`Konflikty rozwiązane:      ${results.conflicts.length}`)
  console.log(`Błędy (pominięte):         ${results.errors.length}`)
  if (isExecute) {
    console.log(`Zapisano do bazy:          ${results.generated.length - results.errors.length}`)
  }
  console.log('====================\n')

  await mongoose.disconnect()
  console.log('🔌 Rozłączono z MongoDB')
}

run().catch(err => {
  console.error('❌ Krytyczny błąd skryptu:', err)
  process.exit(1)
})
