/**
 * Geocodowanie firm bez współrzędnych przez Nominatim (OpenStreetMap)
 * BEZPŁATNY - limit 1 req/s (zgodnie z ToS)
 *
 * Problem: większość firm ma location.city = "Polska" (nazwa kraju z CSV, nie miasto).
 * Rozwiązanie: wyciąga miasto z nazwy firmy używając listy polskich/europejskich miast.
 *
 * Użycie:
 *   node scripts/geocodeCarriers.js           -- podgląd
 *   node scripts/geocodeCarriers.js --apply   -- uruchom geocodowanie
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'

dotenv.config()

const isApply = process.argv.includes('--apply')
const delay = (ms) => new Promise(r => setTimeout(r, ms))

const COUNTRY_NAMES = {
  DE: 'Germany', PL: 'Poland', NL: 'Netherlands', BE: 'Belgium',
  FR: 'France', AT: 'Austria', GB: 'United Kingdom', SE: 'Sweden',
  NO: 'Norway', DK: 'Denmark'
}

// Słowa które oznaczają kraj/region, nie miasto
const NOT_A_CITY = new Set([
  'polska', 'poland', 'niemcy', 'germany', 'deutschland', 'holandia',
  'netherlands', 'belgia', 'belgium', 'francja', 'france', 'austria',
  'wielka brytania', 'united kingdom', 'unknown', 'europa', 'europe', ''
])

// Lista polskich i europejskich miast do wyciągania z nazwy firmy
const CITY_PATTERNS = [
  // Duże polskie miasta
  'Warszawa', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin',
  'Bydgoszcz', 'Lublin', 'Białystok', 'Rzeszów', 'Toruń', 'Olsztyn', 'Sosnowiec',
  'Częstochowa', 'Radom', 'Kielce', 'Gliwice', 'Zabrze', 'Bytom', 'Opole',
  'Gdynia', 'Bielsko-Biała', 'Katowice', 'Tychy', 'Rybnik', 'Ruda Śląska',
  'Dąbrowa Górnicza', 'Płock', 'Elbląg', 'Wałbrzych', 'Zielona Góra', 'Tarnów',
  'Włocławek', 'Chorzów', 'Koszalin', 'Kalisz', 'Legnica', 'Grudziądz',
  'Jaworzno', 'Słupsk', 'Jastrzębie-Zdrój', 'Nowy Sącz', 'Jelenia Góra',
  'Siedlce', 'Mysłowice', 'Konin', 'Piła', 'Piotrków Trybunalski', 'Lubin',
  'Inowrocław', 'Ostrów Wielkopolski', 'Suwalki', 'Suwałki', 'Gniezno',
  'Ostrowiec Świętokrzyski', 'Przemyśl', 'Zamość', 'Tarnobrzeg', 'Stalowa Wola',
  'Mielec', 'Nowy Targ', 'Zakopane', 'Sanok', 'Świdnica', 'Legnica', 'Chełm',
  'Biała Podlaska', 'Łomża', 'Sieradz', 'Pabianice', 'Zgierz', 'Zgorzelec',
  'Słubice', 'Kostrzyn', 'Świecko', 'Krosno', 'Tczew', 'Wolsztyn', 'Kutno',
  'Płońsk', 'Łowicz', 'Ostrołęka', 'Ciechanów', 'Pruszków', 'Piaseczno',
  'Wołomin', 'Mińsk Mazowiecki', 'Garwolin', 'Grodzisk Mazowiecki',
  'Rabka', 'Chab', 'Wieliczka', 'Myślenice', 'Limanowa', 'Gorlice',
  'Głubczyce', 'Nysa', 'Brzeg', 'Kluczbork', 'Strzelce Opolskie',
  // Miasta niemieckie
  'Berlin', 'Hamburg', 'München', 'Munich', 'Frankfurt', 'Köln', 'Cologne',
  'Stuttgart', 'Düsseldorf', 'Dortmund', 'Bremen', 'Leipzig', 'Dresden',
  'Hannover', 'Nürnberg', 'Duisburg', 'Bochum', 'Essen', 'Wuppertal',
  'Bielefeld', 'Mannheim', 'Bonn', 'Karlsruhe', 'Magdeburg', 'Kassel',
  'Augsburg', 'Chemnitz', 'Aachen', 'Halle', 'Gelsenkirchen', 'Mönchengladbach',
  // Holenderskie
  'Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven',
  // Belgijskie
  'Brussel', 'Brussels', 'Antwerpen', 'Ghent', 'Brugge', 'Liège',
  // Austriackie
  'Wien', 'Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck',
  // Inne
  'Paris', 'Lyon', 'London', 'Stockholm', 'Oslo', 'Copenhagen'
]

// Zbiór polskich miast — geocoduj zawsze jako Polska, nie kraj obsługi
const POLISH_CITIES = new Set([
  'Warszawa', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin',
  'Bydgoszcz', 'Lublin', 'Białystok', 'Rzeszów', 'Toruń', 'Olsztyn', 'Sosnowiec',
  'Częstochowa', 'Radom', 'Kielce', 'Gliwice', 'Zabrze', 'Bytom', 'Opole',
  'Gdynia', 'Katowice', 'Tychy', 'Rybnik', 'Ruda Śląska', 'Dąbrowa Górnicza',
  'Płock', 'Elbląg', 'Wałbrzych', 'Zielona Góra', 'Tarnów', 'Włocławek',
  'Chorzów', 'Koszalin', 'Kalisz', 'Legnica', 'Grudziądz', 'Jaworzno', 'Słupsk',
  'Nowy Sącz', 'Jelenia Góra', 'Siedlce', 'Konin', 'Piła', 'Lubin', 'Inowrocław',
  'Ostrów Wielkopolski', 'Suwałki', 'Gniezno', 'Mielec', 'Nowy Targ', 'Zakopane',
  'Sanok', 'Świdnica', 'Chełm', 'Biała Podlaska', 'Łomża', 'Pabianice', 'Zgierz',
  'Zgorzelec', 'Słubice', 'Kostrzyn', 'Krosno', 'Tczew', 'Kutno', 'Radomsko',
  'Ostrołęka', 'Pruszków', 'Piaseczno', 'Rabka', 'Wieliczka', 'Myślenice',
  'Limanowa', 'Gorlice', 'Nysa', 'Brzeg', 'Kluczbork', 'Stalowa Wola',
  'Ostrowiec Świętokrzyski', 'Przemyśl', 'Zamość', 'Tarnobrzeg', 'Sieradz',
  'Płońsk', 'Łowicz', 'Ciechanów', 'Wołomin', 'Mińsk Mazowiecki', 'Garwolin'
])

function getGeocodeCountry(city, carrierCountry) {
  // Jeśli miasto jest polskie, geocoduj jako Polska niezależnie od kraju obsługi
  if (POLISH_CITIES.has(city)) return 'PL'
  return carrierCountry
}

function extractCityFromName(companyName, countryCode) {
  if (!companyName) return null
  const name = companyName

  for (const city of CITY_PATTERNS) {
    // Szukaj całego słowa (case-insensitive)
    const regex = new RegExp(`\\b${city.replace(/[-]/g, '[- ]')}\\b`, 'i')
    if (regex.test(name)) {
      return city
    }
  }
  return null
}

async function geocodeQuery(query, countryCode) {
  const country = COUNTRY_NAMES[countryCode] || countryCode
  // Kody pocztowe: szukaj bezpośrednio z krajem
  const fullQuery = encodeURIComponent(`${query}, ${country}`)
  const url = `https://nominatim.openstreetmap.org/search?q=${fullQuery}&format=json&limit=1`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'my-bus.eu geocoder (contact@my-bus.eu)' }
    })
    const data = await res.json()
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch (err) { /* sieć lub parse error */ }
  return null
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅ Połączono z MongoDB\n')

  const carriers = await Carrier.find(
    { 'location.coordinates.lat': { $exists: false } },
    'companyName location country'
  ).lean()

  console.log(`📊 Firm bez współrzędnych: ${carriers.length}\n`)

  // Przygotuj listę do geocodowania
  const toGeocode = []
  let noCity = 0

  for (const c of carriers) {
    const rawCity = (c.location?.city || '').trim()
    const postalCode = (c.location?.postalCode || '').trim()
    const isRealCity = rawCity && !NOT_A_CITY.has(rawCity.toLowerCase())

    if (postalCode) {
      // Priorytet: kod pocztowy — najdokładniejszy
      toGeocode.push({ carrier: c, query: postalCode, source: 'postal' })
    } else if (isRealCity) {
      toGeocode.push({ carrier: c, query: rawCity, source: 'city_field' })
    } else {
      // Spróbuj wyciągnąć miasto z nazwy
      const extracted = extractCityFromName(c.companyName, c.country)
      if (extracted) {
        toGeocode.push({ carrier: c, query: extracted, source: 'name_extract' })
      } else {
        noCity++
      }
    }
  }

  console.log(`📍 Do geocodowania: ${toGeocode.length}`)
  console.log(`   - z kodu pocztowego: ${toGeocode.filter(x => x.source === 'postal').length}`)
  console.log(`   - z pola city:       ${toGeocode.filter(x => x.source === 'city_field').length}`)
  console.log(`   - z nazwy firmy:     ${toGeocode.filter(x => x.source === 'name_extract').length}`)
  console.log(`❌ Bez możliwości geocodowania: ${noCity}\n`)

  if (!isApply) {
    console.log('Przykłady (kod pocztowy):')
    toGeocode.filter(x => x.source === 'postal').slice(0, 5).forEach(x => {
      console.log(`  ${x.query} → ${x.carrier.companyName.substring(0, 55)}`)
    })
    console.log('\nPrzykłady (z nazwy firmy):')
    toGeocode.filter(x => x.source === 'name_extract').slice(0, 5).forEach(x => {
      console.log(`  "${x.query}" ← ${x.carrier.companyName.substring(0, 50)}`)
    })
    console.log(`\n⚠️  Podgląd. Uruchom z --apply żeby geocodować.`)
    console.log(`⏱️  Szacowany czas: ~${Math.ceil(toGeocode.length * 1.1 / 60)} minut`)
    await mongoose.disconnect()
    return
  }

  console.log(`🚀 Geocodowanie ${toGeocode.length} firm (Nominatim, 1 req/s)...\n`)

  let success = 0, failed = 0
  const cache = new Map()

  for (let i = 0; i < toGeocode.length; i++) {
    const { carrier: c, query, source } = toGeocode[i]
    // Dla kodów pocztowych zawsze PL, dla miast użyj getGeocodeCountry
    const geocodeCountry = source === 'postal' ? 'PL' : getGeocodeCountry(query, c.country)
    const cacheKey = `${query}|${geocodeCountry}`

    process.stdout.write(`[${i + 1}/${toGeocode.length}] ${query} (${source})... `)

    let coords = cache.get(cacheKey)
    let fromCache = true

    if (!coords) {
      fromCache = false
      coords = await geocodeQuery(query, geocodeCountry)
      if (coords) cache.set(cacheKey, coords)
      await delay(1100)
    }

    if (coords) {
      await Carrier.updateOne({ _id: c._id }, { $set: { 'location.coordinates': coords } })
      process.stdout.write(`✅ ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}${fromCache ? ' (cache)' : ''}\n`)
      success++
    } else {
      process.stdout.write(`❌ brak wyników\n`)
      failed++
    }
  }

  console.log(`\n══════════════════════════════════════`)
  console.log(`📊 REZULTAT:`)
  console.log(`   ✅ Zgeokodowano:   ${success}`)
  console.log(`   ❌ Nie znaleziono:  ${failed}`)
  console.log(`══════════════════════════════════════`)

  await mongoose.disconnect()
}

run().catch(err => {
  console.error('Błąd:', err)
  process.exit(1)
})
