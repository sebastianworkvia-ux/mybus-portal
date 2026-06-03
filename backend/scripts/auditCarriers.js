/**
 * ETAP 15 — Audyt danych kontaktowych i jakości bazy Carrier
 * READ-ONLY — brak żadnych zapisów, updateów ani deleteów
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('Brak MONGODB_URI w .env')
  process.exit(1)
}

// Minimalna definicja modelu (tylko odczyt)
const carrierSchema = new mongoose.Schema({}, { strict: false, collection: 'carriers' })
const Carrier = mongoose.model('Carrier', carrierSchema)

await mongoose.connect(MONGODB_URI)
console.log('✅ Połączono z MongoDB\n')

// ── Pomocnicze query'y ──────────────────────────────────────────────
const total        = await Carrier.countDocuments()
const active       = await Carrier.countDocuments({ isActive: true })
const hasSlug      = await Carrier.countDocuments({ slug: { $exists: true, $ne: null, $ne: '' } })
const noSlug       = total - hasSlug
const hasPhone     = await Carrier.countDocuments({ phone: { $exists: true, $ne: null, $ne: '' } })
const noPhone      = total - hasPhone
const hasEmail     = await Carrier.countDocuments({ email: { $exists: true, $ne: null, $ne: '' } })
const noEmail      = total - hasEmail
const hasWebsite   = await Carrier.countDocuments({ website: { $exists: true, $ne: null, $ne: '' } })
const noWebsite    = total - hasWebsite
const hasAnyContact = await Carrier.countDocuments({
  $or: [
    { phone: { $exists: true, $ne: null, $ne: '' } },
    { email: { $exists: true, $ne: null, $ne: '' } },
    { website: { $exists: true, $ne: null, $ne: '' } }
  ]
})
const noContact    = total - hasAnyContact

const hasDescription = await Carrier.countDocuments({
  $or: [
    { description: { $exists: true, $ne: null, $ne: '' } },
    { detailedDescription: { $exists: true, $ne: null, $ne: '' } }
  ]
})
const noDescription  = total - hasDescription

const hasLogo      = await Carrier.countDocuments({ logo: { $exists: true, $ne: null, $ne: '' } })
const hasRoutes    = await Carrier.countDocuments({ routes: { $exists: true }, $where: 'this.routes && this.routes.length > 0' }).catch(async () => {
  // fallback bez $where
  return await Carrier.countDocuments({ 'routes.0': { $exists: true } })
})
const hasServices  = await Carrier.countDocuments({ 'services.0': { $exists: true } })
const hasOpCountries = await Carrier.countDocuments({ 'operatingCountries.0': { $exists: true } })
const hasCity      = await Carrier.countDocuments({ 'location.city': { $exists: true, $ne: null, $ne: '' } })
const hasPostal    = await Carrier.countDocuments({ 'location.postalCode': { $exists: true, $ne: null, $ne: '' } })
const isVerified   = await Carrier.countDocuments({ isVerified: true })
const isPremium    = await Carrier.countDocuments({
  $or: [
    { isPremium: true },
    { subscriptionPlan: 'premium' },
    { subscriptionPlan: 'business' }
  ]
})
const hasPremiumPlan = await Carrier.countDocuments({ subscriptionPlan: { $in: ['premium', 'business'] } })
const hasBusiness  = await Carrier.countDocuments({ subscriptionPlan: 'business' })
const hasOwner     = await Carrier.countDocuments({ userId: { $exists: true, $ne: null } })
const noOwner      = total - hasOwner
const hasReviews   = await Carrier.countDocuments({ reviewCount: { $gt: 0 } })
const noReviews    = total - hasReviews
const ratingNoReview = await Carrier.countDocuments({ rating: { $gt: 0 }, reviewCount: 0 })

// Silne profile SEO: aktywna + slug + kontakt + services + operatingCountries
const strongSEO    = await Carrier.countDocuments({
  isActive: true,
  slug: { $exists: true, $ne: null, $ne: '' },
  $or: [
    { phone: { $exists: true, $ne: null, $ne: '' } },
    { email: { $exists: true, $ne: null, $ne: '' } }
  ],
  'services.0': { $exists: true },
  'operatingCountries.0': { $exists: true }
})

// Kraje
const countryAgg = await Carrier.aggregate([
  { $group: { _id: '$country', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Usługi — rozbite per tag
const serviceTypes = ['transport', 'paczki', 'laweta', 'przeprowadzki', 'autokary',
  'zwierzeta', 'transfery-lotniskowe', 'przejazdy-sluzbowe', 'transport-rzeczy',
  'dokumenty', 'inne']

const serviceCounts = {}
for (const svc of serviceTypes) {
  serviceCounts[svc] = await Carrier.countDocuments({ services: svc })
}

// Kombinacje kontaktów
const phoneAndEmail = await Carrier.countDocuments({
  phone: { $exists: true, $ne: null, $ne: '' },
  email: { $exists: true, $ne: null, $ne: '' }
})
const phoneOnly = await Carrier.countDocuments({
  phone: { $exists: true, $ne: null, $ne: '' },
  $or: [{ email: { $exists: false } }, { email: null }, { email: '' }]
})
const emailOnly = await Carrier.countDocuments({
  email: { $exists: true, $ne: null, $ne: '' },
  $or: [{ phone: { $exists: false } }, { phone: null }, { phone: '' }]
})
const websiteOnly = await Carrier.countDocuments({
  website: { $exists: true, $ne: null, $ne: '' },
  $or: [{ phone: { $exists: false } }, { phone: null }, { phone: '' }],
  $and: [
    { $or: [{ email: { $exists: false } }, { email: null }, { email: '' }] }
  ]
})

// isDemo
const isDemo = await Carrier.countDocuments({ isDemo: true })

await mongoose.disconnect()

// ── RAPORT ─────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════')
console.log('  ETAP 15 — AUDYT BAZY CARRIER — my-bus.eu')
console.log('═══════════════════════════════════════════════════════\n')

console.log('A. PODSUMOWANIE CAŁEJ BAZY')
console.log('─────────────────────────────────')
console.log(`Wszystkich firm:            ${total}`)
console.log(`Aktywnych (isActive=true):  ${active} (${pct(active, total)}%)`)
console.log(`Z slugiem:                  ${hasSlug} (${pct(hasSlug, total)}%)`)
console.log(`Bez sluga:                  ${noSlug}`)
console.log(`isDemo:                     ${isDemo}`)
console.log(`Przejętych (userId):        ${hasOwner} (${pct(hasOwner, total)}%)`)
console.log(`Nieprzejętych:              ${noOwner} (${pct(noOwner, total)}%)`)
console.log(`Zweryfikowanych:            ${isVerified}`)
console.log(`Premium/Business (plan):    ${hasPremiumPlan} (business: ${hasBusiness})`)

console.log('\nB. JAKOŚĆ DANYCH KONTAKTOWYCH')
console.log('─────────────────────────────────')
console.log(`Ma telefon:                 ${hasPhone} (${pct(hasPhone, total)}%)`)
console.log(`Brak telefonu:              ${noPhone} (${pct(noPhone, total)}%)`)
console.log(`Ma email:                   ${hasEmail} (${pct(hasEmail, total)}%)`)
console.log(`Brak emaila:                ${noEmail} (${pct(noEmail, total)}%)`)
console.log(`Ma website:                 ${hasWebsite} (${pct(hasWebsite, total)}%)`)
console.log(`Brak website:               ${noWebsite} (${pct(noWebsite, total)}%)`)
console.log(`─────`)
console.log(`Telefon + email:            ${phoneAndEmail}`)
console.log(`Tylko telefon:              ${phoneOnly}`)
console.log(`Tylko email:                ${emailOnly}`)
console.log(`Tylko website:              ${websiteOnly}`)
console.log(`─────`)
console.log(`Min. 1 kontakt:             ${hasAnyContact} (${pct(hasAnyContact, total)}%)`)
console.log(`BRAK kontaktu:              ${noContact} (${pct(noContact, total)}%) ← PROBLEM`)

console.log('\nC. JAKOŚĆ DANYCH SEO')
console.log('─────────────────────────────────')
console.log(`Ma slug:                    ${hasSlug} (${pct(hasSlug, total)}%)`)
console.log(`Ma opis:                    ${hasDescription} (${pct(hasDescription, total)}%)`)
console.log(`Brak opisu:                 ${noDescription} (${pct(noDescription, total)}%)`)
console.log(`Ma logo:                    ${hasLogo} (${pct(hasLogo, total)}%)`)
console.log(`Ma trasy (routes):          ${hasRoutes} (${pct(hasRoutes, total)}%)`)
console.log(`Ma usługi (services):       ${hasServices} (${pct(hasServices, total)}%)`)
console.log(`Ma kraje działania:         ${hasOpCountries} (${pct(hasOpCountries, total)}%)`)
console.log(`Ma miasto (location.city):  ${hasCity} (${pct(hasCity, total)}%)`)
console.log(`Ma kod pocztowy:            ${hasPostal} (${pct(hasPostal, total)}%)`)
console.log(`Silne profil SEO:           ${strongSEO} (${pct(strongSEO, total)}%)`)

console.log('\nD. JAKOŚĆ DANYCH BIZNESOWYCH / PREMIUM')
console.log('─────────────────────────────────')
console.log(`isPremium=true:             ${isPremium}`)
console.log(`plan premium/business:      ${hasPremiumPlan}`)
console.log(`plan business:              ${hasBusiness}`)
console.log(`isVerified:                 ${isVerified}`)
console.log(`Ma opinie (reviewCount>0):  ${hasReviews} (${pct(hasReviews, total)}%)`)
console.log(`Brak opinii:                ${noReviews} (${pct(noReviews, total)}%)`)
console.log(`Rating>0 ale reviewCount=0: ${ratingNoReview} ${ratingNoReview > 0 ? '← PROBLEM DANYCH' : '✅ OK'}`)

console.log('\nE. KRAJE')
console.log('─────────────────────────────────')
for (const c of countryAgg) {
  console.log(`  ${(c._id || 'brak').padEnd(4)} ${String(c.count).padStart(5)}  (${pct(c.count, total)}%)`)
}

console.log('\nF. USŁUGI')
console.log('─────────────────────────────────')
for (const [svc, count] of Object.entries(serviceCounts)) {
  console.log(`  ${svc.padEnd(25)} ${String(count).padStart(5)}  (${pct(count, total)}%)`)
}
console.log(`  ${'(brak usług)'.padEnd(25)} ${String(total - hasServices).padStart(5)}  (${pct(total - hasServices, total)}%)`)

console.log('\nG. NAJWIĘKSZE PROBLEMY DANYCH')
console.log('─────────────────────────────────')
const problems = [
  { label: 'Brak jakiegokolwiek kontaktu', count: noContact },
  { label: 'Brak opisu', count: noDescription },
  { label: 'Brak sluga', count: noSlug },
  { label: 'Brak usług (services)', count: total - hasServices },
  { label: 'Brak operatingCountries', count: total - hasOpCountries },
  { label: 'Brak telefonu', count: noPhone },
  { label: 'Brak emaila', count: noEmail },
  { label: 'Rating>0 ale reviewCount=0', count: ratingNoReview },
].sort((a, b) => b.count - a.count)

for (const p of problems) {
  const severity = p.count > total * 0.5 ? '🔴' : p.count > total * 0.2 ? '🟡' : '🟢'
  console.log(`  ${severity} ${p.label.padEnd(38)} ${p.count} (${pct(p.count, total)}%)`)
}

console.log('\nH. PRIORYTETY POPRAWEK')
console.log('─────────────────────────────────')
console.log('  1. Firmy bez żadnego kontaktu — rozważyć noindex lub oznaczenie jako szkielet')
console.log('  2. Firmy bez opisu — kluczowe dla SEO unique content')
console.log('  3. Firmy bez operatingCountries — brak danych do schema.org areaServed')
console.log('  4. Firmy bez services — brak filtrowalni w wyszukiwarce')
console.log('  5. Firmy nieprzejęte (userId=null) — uzupełnienie danych niemożliwe przez właściciela')

console.log('\nI. CZY WARTO ETAP CZYSZCZENIA DANYCH')
console.log('─────────────────────────────────')
const cleanupRatio = (noContact / total) * 100
if (cleanupRatio > 40) {
  console.log(`  ✅ TAK — ${cleanupRatio.toFixed(1)}% firm bez kontaktu to poważny problem jakości.`)
  console.log('     Zalecany osobny etap: masowe oznaczenie firm bez kontaktu jako niskich priorytetu SEO.')
} else if (cleanupRatio > 15) {
  console.log(`  ⚠️  OPCJONALNIE — ${cleanupRatio.toFixed(1)}% firm bez kontaktu. Etap może pomóc.`)
} else {
  console.log(`  ℹ️  NIE PILNE — tylko ${cleanupRatio.toFixed(1)}% firm bez kontaktu.`)
}

console.log('\nJ. NOINDEX DLA PROFILI BEZ KONTAKTU')
console.log('─────────────────────────────────')
console.log('  Frontend już sprawdza: if (!carrier.isActive) → noindex')
console.log('  Dla profili bez kontaktu — dwie opcje:')
console.log('  OPCJA A: noindex (carrier.phone && carrier.email → brak obu = noindex)')
console.log('           → Zmniejsza indeks, ale eliminuje thin content bez wartości dla użytkownika')
console.log('  OPCJA B: zostawić index, ale schować sticky CTA (już obsługuje brak phone/email/userId)')
console.log('           → Profile bez kontaktu nadal mogą rankinować na branded keywords')
console.log('  REKOMENDACJA: Opcja B teraz. Opcja A do rozważenia po sprawdzeniu, ile firm jest')
console.log('  indeksowanych bez kontaktu i jak rankinują.')

console.log('\n═══════════════════════════════════════════════════════')
console.log('  KONIEC RAPORTU')
console.log('═══════════════════════════════════════════════════════\n')

function pct(n, total) {
  if (!total) return '0'
  return ((n / total) * 100).toFixed(1)
}
