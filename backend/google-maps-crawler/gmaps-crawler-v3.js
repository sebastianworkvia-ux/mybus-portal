/**
 * ============================================================
 *  Google Maps Transport Companies Crawler  –  v3 (runda 3)
 *  CEL: +500 nowych firm – prywatny transport, carpooling,
 *       taxi, transfery, busy prywatne + reszta fraz z v2
 *  OUTPUT: wyniki_crawler_v3.csv  (ten sam format co v1/v2)
 * ============================================================
 *
 *  Uruchomienie:
 *    node gmaps-crawler-v3.js
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import fs from 'fs';

puppeteer.use(StealthPlugin());

// ─── KONFIGURACJA ─────────────────────────────────────────────────────────────

const CONFIG = {
  headless: false,
  existingFiles: [           // pliki z dotychczasowymi danymi – do dedup
    'db_carriers_export.csv', // aktualna baza MongoDB (1077 firm)
  ],
  outputFile:    'wyniki_crawler_v3.csv',
  targetNew:     500,
  maxPerKeyword: 20,
  scrollDelay:   2000,
  actionDelay:   1800,
  pageTimeout:   25000,

  searchKeywords: [

    // ═══════ KONTYNUACJA FRAZ Z V2 (od frazy 34) ═════════════════════════
    // Wynajem, taxi, firmy
    'wynajem busa na wesele',
    'transport pracowników',
    'busy dla firm',
    'taxi niemcy polska',
    'taxi van niemcy',

    // Firmy z Niemiec
    'przewozy niemcy polska',
    'transport osobowy niemcy',
    'busy niemcy polska',
    'przewozy niemcy holandia',
    'przewozy niemcy belgia',

    // Laweta inne kierunki
    'laweta austria',
    'laweta włochy',
    'laweta anglia polska',
    'laweta francja',
    'laweta szwajcaria',
    'pomoc drogowa austria',
    'pomoc drogowa włochy',
    'pomoc drogowa francja',
    'pomoc drogowa anglia',
    'holowanie tir',
    'pomoc drogowa tir niemcy',
    'serwis mobilny niemcy',
    'wulkanizacja mobilna niemcy',
    'transport aut z anglii',
    'transport aut z francji',
    'transport aut z włoch',
    'transport aut z holandii',
    'sprowadzanie aut anglia',
    'sprowadzanie aut włochy',
    'import aut niemcy',
    'transport motocykli niemcy',

    // Przeprowadzki nowe kierunki
    'przeprowadzki do anglii',
    'przeprowadzki do irlandii',
    'przeprowadzki do szwecji',
    'przeprowadzki do norwegii',
    'przeprowadzki do włoch',
    'przeprowadzki do austrii',
    'przeprowadzki do szwajcarii',
    'przeprowadzki z anglii',
    'przeprowadzki z niemiec',
    'przeprowadzki z holandii',
    'transport mebli anglia',
    'transport mebli holandia',
    'transport mebli austria',
    'man with van niemcy',
    'wynajem busa przeprowadzki',
    'przewóz rzeczy za granicę',

    // Transfer lotniskowy
    'taxi lotnisko frankfurt',
    'taxi lotnisko amsterdam',
    'taxi lotnisko berlin',
    'taxi lotnisko monachium',
    'taxi lotnisko londyn',
    'taxi lotnisko wiedeń',
    'transfer lotnisko frankfurt',
    'transfer lotnisko amsterdam',
    'transfer lotnisko berlin',
    'transfer lotnisko monachium',
    'transfer lotnisko londyn',
    'transfer lotnisko bruksela',
    'transfer lotniskowy rzeszów',
    'transfer lotniskowy katowice',
    'transfer lotniskowy łódź',
    'transfer lotniskowy lublin',
    'vip transfer niemcy',
    'limuzyna wynajem niemcy',
    'luksusowy transfer polska',

    // Transport paczek
    'transport paczek do anglii',
    'transport paczek do irlandii',
    'transport paczek do włoch',
    'transport paczek do austrii',
    'transport paczek do szwecji',
    'transport paczek do norwegii',
    'kurier do anglii',
    'kurier do irlandii',
    'kurier do włoch',
    'przesyłki do anglii',
    'bagaż za granicę',
    'wysyłka za granicę prywatna',

    // Transport zwierząt
    'transport koni niemcy',
    'transport koni holandia',
    'transport koni europa',
    'przewóz koni niemcy',
    'transport psów niemcy',
    'transport psów europa',
    'pet transport niemcy',
    'transport zwierząt niemcy',
    'transport zwierząt anglia',

    // Spedycja/towary (bez TIR-ów)
    'spedycja niemcy',
    'spedycja holandia',
    'transport towarów niemcy',
    'transport ładunków niemcy',
    'transport chłodniczy niemcy',
    'transport maszyn niemcy',

    // ═══════ NOWE FRAZY – PRYWATNY TRANSPORT / CARPOOLING ════════════════

    // Przewozy prywatne / podróże razem
    'podróże razem niemcy',
    'wspólny przejazd niemcy',
    'podwiezienie do niemiec',
    'okazja do niemiec',
    'jadę do niemiec wezmę pasażera',
    'przewóz osób prywatny',
    'prywatny kierowca niemcy',
    'prywatny kierowca polska',
    'prywatny bus niemcy',
    'transport door to door niemcy',
    'door to door polska niemcy',
    'door to door holandia',
    'door to door belgia polska',
    'door to door anglia polska',

    // Taxi i VTC
    'prywatny taxi niemcy',
    'taxi polska niemcy',
    'taxi holandia polska',
    'taxi belgia polska',
    'taxi francja polska',
    'taxi austria polska',
    'polska taksówka niemcy',
    'polskie taxi niemcy',
    'taxi van polska',
    'taksówka niemcy',
    'taksówka londyn',
    'minivan taxi niemcy',

    // Uber/BOLT styl
    'wynajem auta z kierowcą',
    'wynajem samochodu z kierowcą',
    'samochód z kierowcą niemcy',
    'samochód z kierowcą polska',
    'osobowy transport prywatny',
    'wynajem limuzyny',
    'wynajem busa z kierowcą niemcy',

    // BlaBlaCar/podróże dzielone
    'przejazd do niemiec',
    'przejazd polska niemcy',
    'transport okazja niemcy',
    'okazyjny przejazd niemcy',
    'przewóz prywatny europa',

    // Busy prywatne kierunki lokalne
    'busy kraków niemcy',
    'busy wrocław niemcy',
    'busy gdańsk niemcy',
    'busy rzeszów niemcy',
    'busy poznań niemcy',
    'busy lublin niemcy',
    'busy białystok niemcy',
    'busy śląsk niemcy',
    'busy łódź niemcy',
    'busy warszawa niemcy',

    // Busy konkretne regiony → kraje
    'busy warszawa anglia',
    'busy kraków anglia',
    'busy wrocław anglia',
    'busy warszawa holandia',
    'busy kraków holandia',
    'busy katowice holandia',

    // Przejazdy specjalne
    'transport medyczny niemcy',
    'transport medyczny polska',
    'transport osób niepełnosprawnych',
    'pojazd przystosowany dla niepełnosprawnych',
    'transport seniorów',
    'transport na lotnisko warszawa',
    'transport na lotnisko kraków',
    'transport na lotnisko wrocław',
    'transport na lotnisko gdańsk',

    // Busy weekendowe / wakacyjne
    'weekendowe przejazdy niemcy',
    'przewozy turystyczne niemcy',
    'wyjazdy weekendowe niemcy',
    'turystyczne busy niemcy',
    'busy narty austria',
    'przewóz narciarzy austria',
    'busy w góry austria',

    // Ciekawe nisze
    'transport studencki niemcy',
    'busy dla studentów niemcy',
    'transport sezonowy niemcy',
    'transport pracownicy sezonowi',
    'przewóz pracowników niemcy',
    'busy dla pracowników',
    'transport zbiorowy niemcy',

    // Jeep/SUV transfer
    'suv transfer niemcy',
    'minivan transfer europa',
    'transfer premium polska',
    'luksusowy autokar wynajem',

    // Lokalne polskie taxi -> za granicę
    'taxi na granicę niemcy',
    'taksówka do berlina',
    'taxi berlin polska',
    'taxi monachium polska',
    'taxi kolonia polska',
    'taxi dortmund polska',
    'taxi hamburg polska',
    'taxi frankfurt polska',

  ],
};

// ─── REGUŁY TAGOWANIA USŁUG ───────────────────────────────────────────────────

const SERVICE_RULES = [
  {
    tag: 'laweta',
    keywords: [
      'laweta', 'holowanie', 'holownik', 'autoholowanie', 'pomoc drogowa',
      'towing', 'car recovery', 'abschlepp', 'pannenhilfe', 'transport pojazd',
      'transport samochod', 'przewóz samochodów', 'sprowadzanie aut',
      'import aut', 'naprawa mobilna', 'mobilny serwis', 'mobilna wulkanizacja',
    ],
  },
  {
    tag: 'transport osób',
    keywords: [
      'transport osób', 'przewóz osób', 'przewozy osób', 'busy', 'bus',
      'passenger', 'minibus', 'minibusy', 'autokar', 'autokary',
      'wynajem busa', 'transfer', 'przejazd', 'tani transport',
      'door to door', 'taxi', 'private transfer', 'limuzyna',
      'prywatny kierowca', 'kierowca prywatny', 'taxi van', 'minivan',
      'wspólny przejazd', 'carpooling', 'podwiezienie',
    ],
  },
  {
    tag: 'transfer lotniskowy',
    keywords: [
      'transfer lotniskowy', 'lotnisko', 'airport', 'taxi lotnisk',
      'przejazd na lotnisko', 'odbiór z lotniska', 'vip transfer',
    ],
  },
  {
    tag: 'przeprowadzki',
    keywords: [
      'przeprowadzki', 'przeprowadzka', 'transport mebli', 'moving',
      'umzug', 'verhuizing', 'relocation', 'man with van', 'man z vanem',
      'transport rzeczy', 'przewóz rzeczy',
    ],
  },
  {
    tag: 'transport paczek',
    keywords: [
      'paczki', 'paczka', 'kurier', 'courier', 'przesyłka', 'przesyłki',
      'bagaż', 'bagaz', 'nadanie paczki', 'transport paczek',
      'wysyłka paczek', 'doręczenie', 'logistyka',
    ],
  },
  {
    tag: 'transport zwierząt',
    keywords: [
      'transport zwierząt', 'zwierzęta', 'psy', 'koty', 'konie',
      'pet transport', 'animal transport', 'tierransport',
    ],
  },
  {
    tag: 'spedycja',
    keywords: [
      'spedycja', 'spedytor', 'freight', 'forwarding', 'ładunki',
      'cargo', 'towar', 'towary', 'transport ładunków',
    ],
  },
  {
    tag: 'transport medyczny',
    keywords: [
      'transport medyczny', 'transport sanitarny', 'przewóz chorych',
      'transport pacjentów', 'transport niepełnosprawnych', 'transport seniorów',
    ],
  },
];

// ─── REGUŁY WYKRYWANIA KRAJU ──────────────────────────────────────────────────

const COUNTRY_KEYWORDS = {
  Niemcy: ['berlin', 'münchen', 'hamburg', 'frankfurt', 'köln', 'stuttgart',
    'düsseldorf', 'dortmund', 'essen', 'leipzig', 'hannover', 'norymberga',
    'monachium', 'germany', 'deutschland', 'niemcy'],
  Holandia: ['amsterdam', 'rotterdam', 'den haag', 'utrecht', 'eindhoven',
    'netherlands', 'nederland', 'holandia'],
  Belgia: ['brussels', 'antwerp', 'ghent', 'bruges', 'liège', 'belgium',
    'belgique', 'belgia', 'antwerpia', 'bruksela'],
  Francja: ['paris', 'marseille', 'lyon', 'toulouse', 'nice', 'nantes',
    'strasbourg', 'france', 'francja'],
  Austria: ['vienna', 'wien', 'graz', 'linz', 'salzburg', 'innsbruck',
    'austria', 'österreich'],
  UK: ['london', 'birmingham', 'manchester', 'glasgow', 'uk', 'united kingdom',
    'anglia', 'wielka brytania', 'londyn'],
  Polska: ['warszawa', 'kraków', 'wrocław', 'gdańsk', 'poznań', 'łódź',
    'szczecin', 'lublin', 'katowice', 'bydgoszcz', 'rzeszów', 'kielce',
    'olsztyn', 'opole', 'białystok', 'poland', 'polska'],
};

// ─── STAN ─────────────────────────────────────────────────────────────────────

const companies   = [];
const seenPhones  = new Set();
const seenNames   = new Set();
const seenUrls    = new Set();

// ─── WCZYTAJ ISTNIEJĄCE FIRMY (DEDUP) ────────────────────────────────────────

async function loadExistingData() {
  let total = 0;
  for (const file of CONFIG.existingFiles) {
    if (!fs.existsSync(file)) { console.log(`  ⚠️  Brak pliku: ${file}`); continue; }
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = splitCSVLine(line);
      const name  = (cols[0] || '').replace(/^"|"$/g, '').trim();
      const phone = (cols[3] || '').replace(/^"|"$/g, '').trim();
      if (name)  seenNames.add(name.toLowerCase());
      if (phone) seenPhones.add(normalizePhone(phone));
      total++;
    }
    console.log(`  📁 ${file}: wczytano`);
  }
  console.log(`📂 Łącznie załadowano: ${total} rekordów (${seenNames.size} nazw, ${seenPhones.size} telefonów)`);
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function normalizePhone(p) {
  return p.replace(/\D/g, '').slice(-9);
}

function detectServices(text = '') {
  const lower = text.toLowerCase();
  const found = [];
  for (const rule of SERVICE_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) found.push(rule.tag);
  }
  return found.join(', ');
}

function detectCountry(text = '') {
  const lower = text.toLowerCase();
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return country;
  }
  return 'Polska';
}

function cleanPhone(raw = '') {
  return raw.replace(/[^\d+\s\-()]/g, '').trim();
}

function extractPostalCode(address = '') {
  const m = address.match(/\b\d{2}[-\s]?\d{3}\b/);
  return m ? m[0] : '';
}

function extractCity(address = '') {
  if (!address) return '';
  const parts = address.split(',').map((s) => s.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part && !/^\d/.test(part) && part.length > 2) return part;
  }
  return parts[0] || '';
}

// ─── GŁÓWNA PĘTLA ────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' 🗺  Google Maps Crawler v3  –  +500 nowych firm       ');
  console.log('═══════════════════════════════════════════════════════');

  await loadExistingData();

  console.log(`\n📋  Frazy: ${CONFIG.searchKeywords.length}`);
  console.log(`🎯  Cel nowych firm: ${CONFIG.targetNew}`);
  console.log(`💾  Plik wynikowy: ${CONFIG.outputFile}\n`);

  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1440,900',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    );
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    for (let ki = 0; ki < CONFIG.searchKeywords.length; ki++) {
      const keyword = CONFIG.searchKeywords[ki];
      console.log(`\n[${ki + 1}/${CONFIG.searchKeywords.length}] 🔍 "${keyword}"  |  zebrano: ${companies.length}`);

      try {
        await processKeyword(page, keyword);
      } catch (err) {
        console.error(`  ❌ Błąd: ${err.message}`);
      }

      if (companies.length >= CONFIG.targetNew) {
        console.log(`\n🏁 Osiągnięto cel ${CONFIG.targetNew} nowych firm – kończę!`);
        break;
      }

      await delay(1500);
    }

    await saveCSV();
  } finally {
    await browser.close();
  }
}

// ─── AKCEPTACJA COOKIES ───────────────────────────────────────────────────────

async function acceptCookies(page) {
  try {
    await delay(1500);
    const url = page.url();
    if (url.includes('consent.google')) {
      const consentSelectors = [
        '#L2AGLb', 'button.tHlp8d', 'div.QS5gu.sy4vM button',
        'button[aria-label*="Accept all"]',
        'button[aria-label*="Zaakceptuj wszystko"]',
        'form[action*="save"] button',
      ];
      for (const sel of consentSelectors) {
        try {
          const btn = await page.$(sel);
          if (btn) { await btn.click(); await delay(2500); console.log('  ✓ Cookies OK'); return; }
        } catch { /* next */ }
      }
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        btns[btns.length - 1]?.click();
      });
      await delay(2500);
      console.log('  ✓ Cookies OK (fallback)');
    }
  } catch { /* ignore */ }
}

// ─── PRZETWARZANIE FRAZY ─────────────────────────────────────────────────────

async function processKeyword(page, keyword) {
  const encoded = encodeURIComponent(keyword);
  const searchUrl = `https://www.google.pl/maps/search/${encoded}/@52.0,19.0,7z?hl=pl`;

  await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(1000);

  if (page.url().includes('consent.google')) {
    await acceptCookies(page);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(1500);
  }

  try {
    await page.waitForSelector('[role="feed"]', { timeout: 12000 });
  } catch {
    console.log('  ⚠️  Brak listy wyników');
    return;
  }

  const links = await collectLinks(page);
  console.log(`  ✓ ${links.length} linków`);

  const limit = Math.min(links.length, CONFIG.maxPerKeyword);
  for (let i = 0; i < limit; i++) {
    if (companies.length >= CONFIG.targetNew) break;
    console.log(`  📋 ${i + 1}/${limit}…`);
    try {
      const data = await scrapeBusiness(page, links[i]);
      if (data) addCompany(data);
    } catch (err) {
      console.log(`  ⚠️  Pominięto: ${err.message}`);
    }
    await delay(CONFIG.actionDelay);
  }
}

// ─── ZBIERANIE LINKÓW ─────────────────────────────────────────────────────────

async function collectLinks(page) {
  const links = new Set();
  const feedSel = '[role="feed"]';
  let prevHeight = 0;
  let noChangeCount = 0;

  for (let i = 0; i < 20; i++) {
    const raw = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('[role="feed"] a[href*="/maps/place/"]'),
      ).map((a) => a.href),
    );
    raw.forEach((u) => links.add(u));

    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.scrollTop = el.scrollHeight;
    }, feedSel);
    await delay(CONFIG.scrollDelay);

    const curHeight = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? el.scrollHeight : 0;
    }, feedSel);

    if (curHeight === prevHeight) {
      noChangeCount++;
      if (noChangeCount >= 3) break;
    } else {
      noChangeCount = 0;
    }
    prevHeight = curHeight;
  }

  return [...links].filter((u) => !seenUrls.has(u));
}

// ─── SCRAPING STRONY FIRMY ────────────────────────────────────────────────────

async function scrapeBusiness(page, url) {
  seenUrls.add(url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: CONFIG.pageTimeout });
  await delay(1600);

  const raw = await page.evaluate(() => {
    const name =
      document.querySelector('h1.DUwDvf')?.textContent.trim() ||
      document.querySelector('h1')?.textContent.trim() || '';

    const category =
      document.querySelector('button.DkEaL')?.textContent.trim() || '';

    let phone = '';
    const phoneBtn = document.querySelector('[data-item-id^="phone:tel:"]');
    if (phoneBtn) phone = phoneBtn.getAttribute('data-item-id').replace('phone:tel:', '');
    if (!phone) {
      const allLabels = Array.from(document.querySelectorAll('[aria-label]'))
        .map((el) => el.getAttribute('aria-label') || '');
      const match = allLabels.find((t) => /^[+\d][\d\s\-()]{6,}$/.test(t.trim()));
      if (match) phone = match.trim();
    }

    let website = '';
    const siteBtn = document.querySelector(
      'a[data-item-id="authority"], a[aria-label*="website"], a[aria-label*="strona"]',
    );
    if (siteBtn) {
      website = siteBtn.href || '';
      try {
        const u = new URL(website);
        if (u.hostname.includes('google.com')) {
          website = u.searchParams.get('q') || website;
        }
      } catch { /* invalid */ }
    }

    let address = '';
    const addrBtn = document.querySelector('[data-item-id="address"]');
    if (addrBtn) address = addrBtn.textContent.trim();
    if (!address) {
      const a2 = document.querySelector('[aria-label*="Adres"], [aria-label*="Address"]');
      if (a2) address = a2.textContent.trim();
    }

    let description = '';
    const descEl =
      document.querySelector('[data-attrid="description"]') ||
      document.querySelector('.PYvSYb');
    if (descEl) description = descEl.textContent.trim().substring(0, 500);

    let email = '';
    const emailMatch = document.body.innerText.match(
      /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
    );
    if (emailMatch) email = emailMatch[0];

    return { name, category, phone, website, address, description, email };
  });

  if (!raw.name) return null;
  return raw;
}

// ─── DODAWANIE FIRMY ─────────────────────────────────────────────────────────

function addCompany(raw) {
  const phone     = cleanPhone(raw.phone);
  const normPhone = normalizePhone(phone);
  const normName  = raw.name.toLowerCase();

  if (seenNames.has(normName)) return;
  if (normPhone && seenPhones.has(normPhone)) return;

  seenNames.add(normName);
  if (normPhone) seenPhones.add(normPhone);

  const allText    = `${raw.name} ${raw.category} ${raw.description}`;
  const services   = detectServices(allText);
  const country    = detectCountry(`${raw.name} ${raw.address}`);
  const city       = extractCity(raw.address);
  const postalCode = extractPostalCode(raw.address);
  const description = raw.description || 'Firma transportowa świadcząca usługi w Polsce i Europie.';

  companies.push({
    name:             raw.name,
    regNumber:        '',
    country,
    phone,
    email:            raw.email || '',
    website:          raw.website || '',
    description,
    postalCode,
    city,
    serviceCountries: 'PL,DE,NL,BE,FR,AT',
    services:         services || 'transport',
    departureDays:    '',
    returnDays:       '',
    baggageInfo:      '',
  });

  console.log(`  ✅ [${companies.length}] ${raw.name} | ${phone} | ${services || '—'}`);

  if (companies.length % 50 === 0) {
    saveCSV().then(() => console.log(`  💾 Auto-zapis: ${companies.length} firm`));
  }
}

// ─── ZAPIS CSV ────────────────────────────────────────────────────────────────

async function saveCSV() {
  if (companies.length === 0) {
    console.log('\n⚠️  Brak nowych danych.');
    return;
  }

  const writer = createCsvWriter({
    path: CONFIG.outputFile,
    fieldDelimiter: ';',
    encoding: 'utf8',
    header: [
      { id: 'name',             title: 'Nazwa firmy' },
      { id: 'regNumber',        title: 'Numer rejestracyjny firmy' },
      { id: 'country',          title: 'Kraj działalności' },
      { id: 'phone',            title: 'Numer telefonu' },
      { id: 'email',            title: 'Email' },
      { id: 'website',          title: 'Strona WWW' },
      { id: 'description',      title: 'Opis firmy' },
      { id: 'postalCode',       title: 'Kod pocztowy' },
      { id: 'city',             title: 'Miasto' },
      { id: 'serviceCountries', title: 'Wybierz kraje, w których świadczysz usługi transportowe' },
      { id: 'services',         title: 'Oferowane usługi' },
      { id: 'departureDays',    title: 'Dni wyjazdów do Polski' },
      { id: 'returnDays',       title: 'Dni powrotów z Polski' },
      { id: 'baggageInfo',      title: 'Informacje o bagażu' },
    ],
  });

  await writer.writeRecords(companies);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(` ✅  Zapisano ${companies.length} NOWYCH firm → ${CONFIG.outputFile}`);
  console.log('═══════════════════════════════════════════════════════');

  const tagCount = {};
  companies.forEach((c) => {
    c.services.split(',').forEach((s) => {
      const t = s.trim();
      if (t) tagCount[t] = (tagCount[t] || 0) + 1;
    });
  });
  console.log('\n📊 Podział usług:');
  Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tag, count]) => console.log(`   ${tag}: ${count}`));
}

// ─── START ────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('❌ Krytyczny błąd:', err);
  process.exit(1);
});
