/**
 * ============================================================
 *  Google Maps Transport Companies Crawler
 *  OUTPUT: CSV zgodny z formatem admin (separtor ";")
 * ============================================================
 *
 *  Kolumny wyjściowe:
 *    Nazwa firmy | Numer rejestracyjny | Kraj działalności
 *    Numer telefonu | Email | Strona WWW | Opis firmy
 *    Kod pocztowy | Miasto
 *    Wybierz kraje ... | Oferowane usługi
 *    Dni wyjazdów do Polski | Dni powrotów z Polski | Informacje o bagażu
 *
 *  Uruchomienie:
 *    node gmaps-crawler.js
 *
 *  Konfiguracja:
 *    • Zmień CONFIG.searchKeywords – frazy do wyszukania
 *    • Zmień CONFIG.maxPerKeyword  – maks. firm na frazę
 *    • Zmień CONFIG.headless       – false = widoczna przeglądarka
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import fs from 'fs';

puppeteer.use(StealthPlugin());

// ─── KONFIGURACJA ────────────────────────────────────────────────────────────

const CONFIG = {
  headless: false,       // false = obserwujesz co robi przeglądarka
  outputFile: 'wyniki_crawler.csv',
  maxPerKeyword: 15,     // 120 fraz × 15 = 1800 kandydatów → po dedup 600-900 firm
  scrollDelay: 2000,
  actionDelay: 1800,
  pageTimeout: 25000,

  // ── FRAZY DO WYSZUKANIA ──────────────────────────────────────────────────
  // 120 haseł pokrywających wszystkie gatunki transportu PL↔EU
  searchKeywords: [

    // ═══════════════ PRZEWÓZ OSÓB – BUSY ════════════════════════════════
    'busy do niemiec',
    'busy do niemiec polska',
    'busy do holandii',
    'busy do holandii polska',
    'busy do belgii',
    'busy do belgii polska',
    'busy do francji',
    'busy do francji polska',
    'busy do anglii',
    'busy do austrii',
    'busy do danii polska',
    'busy do szwecji polska',
    'busy do norwegii polska',
    'busy do szwajcarii polska',
    'przewóz osób polska niemcy',
    'przewóz osób polska holandia',
    'przewóz osób polska belgia',
    'przewóz osób polska francja',
    'przewozy osób polska europa',
    'transport pasażerski polska niemcy',
    'transport pasażerski polska europa',
    'busy miedzynarodowe',
    'wynajem busa polska',
    'wynajem minibusu',
    'minibusy polska europa',
    'przewozy grupowe polska',
    'transport pracowników polska niemcy',
    'transport pracowników do niemiec',
    'bus polska niemcy codziennie',
    'przewozy osób warszawa niemcy',
    'przewozy osób kraków niemcy',
    'przewozy osób wrocław niemcy',
    'przewozy osób poznań niemcy',
    'przewozy osób gdańsk niemcy',
    'przewozy osób łódź niemcy',
    'przewozy osób szczecin niemcy',
    'przewozy osób lublin niemcy',
    'przewozy osób rzeszów niemcy',
    'przewozy osób katowice niemcy',
    'przewozy osób bydgoszcz niemcy',
    'przewozy osób toruń niemcy',
    'przewozy osób białystok niemcy',
    'przewozy osób opole niemcy',
    'przewozy osób kielce niemcy',
    'przewozy osób radom niemcy',
    'przewozy osób częstochowa niemcy',
    'bus do niemiec z krakowa',
    'bus do niemiec z warszawy',
    'bus do niemiec z wrocławia',
    'bus do niemiec z gdańska',
    'bus do niemiec z poznania',

    // ═══════════════ TRANSFER LOTNISKOWY ════════════════════════════════
    'transfer lotniskowy polska',
    'transfer lotniskowy warszawa',
    'transfer lotniskowy kraków',
    'transfer lotniskowy gdańsk',
    'transfer lotniskowy wrocław',
    'transfer lotniskowy poznań',
    'przewóz na lotnisko niemcy',
    'taxi lotniskowe polska',
    'transfery lotniskowe',
    'odbiór z lotniska frankfurt',
    'odbiór z lotniska amsterdam',
    'odbiór z lotniska bruksela',
    'transfer lotnisko heathrow polska',

    // ═══════════════ LAWETA / POMOC DROGOWA ═════════════════════════════
    'laweta niemcy polska',
    'laweta holandia polska',
    'laweta belgia polska',
    'laweta francja polska',
    'laweta austria polska',
    'laweta miedzynarodowa',
    'pomoc drogowa niemcy polska',
    'pomoc drogowa niemcy 24h',
    'pomoc drogowa europa',
    'holowanie samochodów z niemiec',
    'holowanie z holandii do polski',
    'holowanie z belgii do polski',
    'autoholowanie polska europa',
    'transport samochodów polska niemcy',
    'transport samochodów z niemiec',
    'transport pojazdów polska europa',
    'sprowadzanie samochodów z niemiec',
    'sprowadzanie aut z europy',
    'przewóz samochodów holandia polska',
    'transport auta z belgii',
    'laweta 24h polska',
    'pomoc drogowa całodobowa polska',
    'mobilna wulkanizacja niemcy',
    'serwis mobilny tir niemcy',
    'pomoc drogowa tir europa',
    'holowanie tir polska',

    // ═══════════════ PRZEPROWADZKI ═══════════════════════════════════════
    'przeprowadzki miedzynarodowe polska',
    'przeprowadzki polska niemcy',
    'przeprowadzki polska holandia',
    'przeprowadzki polska belgia',
    'przeprowadzki polska francja',
    'firma przeprowadzkowa niemcy',
    'firma przeprowadzkowa europa',
    'przeprowadzki z niemiec do polski',
    'przeprowadzki z holandii do polski',
    'transport mebli niemcy polska',
    'transport mebli do niemiec',
    'przeprowadzki biurowe miedzynarodowe',
    'przeprowadzki warszawa niemcy',
    'przeprowadzki kraków niemcy',
    'przeprowadzki wrocław niemcy',
    'przeprowadzki gdańsk niemcy',

    // ═══════════════ TRANSPORT PACZEK ════════════════════════════════════
    'transport paczek polska niemcy',
    'transport paczek polska holandia',
    'transport paczek polska belgia',
    'przewóz paczek polska europa',
    'kurier miedzynarodowy polska',
    'kurier niemcy polska',
    'nadawanie paczek do niemiec',
    'wysyłka paczek do niemiec',
    'transport bagażu polska europa',
    'przesyłki polska niemcy',
    'paczki do niemiec tanio',

    // ═══════════════ TRANSPORT ZWIERZĄT ══════════════════════════════════
    'transport zwierząt europa polska',
    'transport psów kotów europa',
    'transport koni polska niemcy',
    'przewóz zwierząt domowych europa',
    'pet transport polska',

    // ═══════════════ SPEDYCJA / TOWARY ═══════════════════════════════════
    'spedycja miedzynarodowa polska',
    'transport towarów polska niemcy',
    'transport ciężarowy polska europa',
    'transport ładunków polska',
    'przewóz ładunków polska niemcy',
    'wynajem busa z kierowcą',

  ],
};

// ─── REGUŁY TAGOWANIA USŁUG ───────────────────────────────────────────────────

const SERVICE_RULES = [
  {
    tag: 'laweta',
    keywords: [
      'laweta', 'holowanie', 'holownik', 'autoholowanie', 'pomoc drogowa',
      'towing', 'car recovery', 'abschlepp', 'transport pojazd',
      'transport samochod', 'przewóz samochodów', 'sprowadzanie aut',
      'naprawa mobilna', 'mobilny serwis', 'mobilna wulkanizacja',
    ],
  },
  {
    tag: 'transport osób',
    keywords: [
      'transport osób', 'przewóz osób', 'przewozy osób', 'busy',
      'passenger', 'bus', 'minibus', 'minibusy', 'autokar', 'autokary',
      'wynajem busa', 'transfer', 'przejazd', 'tani transport',
    ],
  },
  {
    tag: 'transfer lotniskowy',
    keywords: [
      'transfer lotniskowy', 'lotnisko', 'airport', 'taxi lotnisk',
      'przejazd na lotnisko', 'odbiór z lotniska',
    ],
  },
  {
    tag: 'przeprowadzki',
    keywords: [
      'przeprowadzki', 'przeprowadzka', 'transport mebli', 'moving',
      'umzug', 'verhuizing', 'relocation', 'szyłowanie',
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
      'cargo', 'towar', 'towary', 'transport ciężarowy', 'tir', 'ciężarówka',
    ],
  },
];

// ─── REGUŁY WYKRYWANIA KRAJU ──────────────────────────────────────────────────

const COUNTRY_KEYWORDS = {
  Niemcy: ['berlin', 'münchen', 'hamburg', 'frankfurt', 'köln', 'stuttgart',
    'düsseldorf', 'dortmund', 'essen', 'leipzig', 'germany', 'deutschland',
    'niemcy', 'niemiec'],
  Holandia: ['amsterdam', 'rotterdam', 'den haag', 'utrecht', 'eindhoven',
    'netherlands', 'nederland', 'holandia'],
  Belgia: ['brussels', 'antwerp', 'ghent', 'bruges', 'liège', 'belgium',
    'belgique', 'belgia'],
  Francja: ['paris', 'marseille', 'lyon', 'toulouse', 'nice', 'nantes',
    'strasbourg', 'france', 'francja'],
  Austria: ['vienna', 'wien', 'graz', 'linz', 'salzburg', 'innsbruck',
    'austria', 'österreich'],
  Polska: ['warszawa', 'kraków', 'wrocław', 'gdańsk', 'poznań', 'łódź',
    'szczecin', 'lublin', 'katowice', 'bydgoszcz', 'poland', 'polska'],
};

// ─── STAN ─────────────────────────────────────────────────────────────────────

const companies = [];
const seenPhones  = new Set();
const seenNames   = new Set();
const seenUrls    = new Set();

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wykrywa usługi na podstawie nazwy + opisu + kategorii */
function detectServices(text = '') {
  const lower = text.toLowerCase();
  const found = [];
  for (const rule of SERVICE_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      found.push(rule.tag);
    }
  }
  return found.join(', ');
}

/** Wykrywa kraj działalności na podstawie adresu / nazwy */
function detectCountry(text = '') {
  const lower = text.toLowerCase();
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return country;
  }
  return 'Polska'; // domyślnie
}

/** Czyści numer telefonu */
function cleanPhone(raw = '') {
  return raw.replace(/[^\d+\s\-()]/g, '').trim();
}

/** Wyciąga kod pocztowy z adresu */
function extractPostalCode(address = '') {
  const m = address.match(/\b\d{2}[-\s]?\d{3}\b/);
  return m ? m[0] : '';
}

/** Wyciąga miasto z adresu (ostatnia część przed krajem) */
function extractCity(address = '') {
  if (!address) return '';
  const parts = address.split(',').map((s) => s.trim());
  // Szuka członu który wygląda jak miasto (nie sam numer, nie sam kraj)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part && !/^\d/.test(part) && part.length > 2) {
      return part;
    }
  }
  return parts[0] || '';
}

// ─── STREFA GŁÓWNA ───────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' 🗺  Google Maps Transport Crawler – format admin CSV  ');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📋  Frazy: ${CONFIG.searchKeywords.length}`);
  console.log(`🎯  Maks. firm / frazę: ${CONFIG.maxPerKeyword}`);
  console.log(`💾  Plik wynikowy: ${CONFIG.outputFile}\n`);

  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
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
    // Ukryj webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    for (let ki = 0; ki < CONFIG.searchKeywords.length; ki++) {
      const keyword = CONFIG.searchKeywords[ki];
      console.log(`\n[${ki + 1}/${CONFIG.searchKeywords.length}] 🔍 "${keyword}"`);
      try {
        await processKeyword(page, keyword);
      } catch (err) {
        console.error(`  ❌ Błąd frazy "${keyword}": ${err.message}`);
      }
      await delay(2000);
    }

    await saveCSV();
  } finally {
    await browser.close();
  }
}

// ─── PRZETWARZANIE JEDNEJ FRAZY ───────────────────────────────────────────────

async function processKeyword(page, keyword) {
  // Otwórz Google Maps
  await page.goto('https://www.google.pl/maps?hl=pl&gl=PL', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await delay(1000);

  // Akceptuj cookies (może przekierować na consent.google.com)
  await acceptCookies(page);

  // Po consent może trzeba poczekać na załadowanie Maps
  try {
    await page.waitForFunction(
      () => window.location.hostname.includes('google') &&
            !window.location.hostname.includes('consent'),
      { timeout: 10000 }
    );
  } catch { /* ignore */ }
  await delay(1000);

  // Wpisz frazę i szukaj
  const inputSelectors = [
    '#searchboxinput',
    'input[name="q"]',
    'input[aria-label*="Szukaj"]',
    'input[aria-label*="Search"]',
    'input[placeholder*="Szukaj"]',
  ];

  let typed = false;
  for (const sel of inputSelectors) {
    try {
      await page.waitForSelector(sel, { timeout: 8000 });
      await page.click(sel, { clickCount: 3 });
      await page.type(sel, keyword, { delay: 80 });
      typed = true;
      break;
    } catch { /* spróbuj kolejny */ }
  }

  if (!typed) {
    throw new Error('Nie znaleziono pola wyszukiwania Google Maps');
  }

  await page.keyboard.press('Enter');
  await delay(3000);

  // Czekaj na listę wyników
  try {
    await page.waitForSelector('[role="feed"]', { timeout: 12000 });
  } catch {
    console.log('  ⚠️  Brak listy wyników – pomijam.');
    return;
  }

  // Zbierz linki do firm przez scrollowanie
  const links = await collectLinks(page);
  console.log(`  ✓ Zebrano ${links.length} linków`);

  // Odwiedź każdą firmę
  const limit = Math.min(links.length, CONFIG.maxPerKeyword);
  for (let i = 0; i < limit; i++) {
    console.log(`  📋 Pobieram ${i + 1}/${limit}…`);
    try {
      const data = await scrapeBusiness(page, links[i]);
      if (data) addCompany(data);
    } catch (err) {
      console.log(`  ⚠️  Firma ${i + 1} pominięta: ${err.message}`);
    }
    await delay(CONFIG.actionDelay);
  }
}

// ─── AKCEPTACJA COOKIES ───────────────────────────────────────────────────────

async function acceptCookies(page) {
  try {
    // Poczekaj chwilę i sprawdź czy jesteśmy na stronie consent
    await delay(1500);
    const url = page.url();

    // Jeśli consent.google.com – kliknij "Zaakceptuj wszystko"
    if (url.includes('consent.google')) {
      const consentSelectors = [
        '#L2AGLb',
        'button[aria-label*="Accept all"]',
        'button[aria-label*="Zaakceptuj wszystko"]',
        'form[action*="save"] button',
        // Nowe Google consent 2024/2025:
        'button.tHlp8d',
        'div.QS5gu.sy4vM button',
      ];
      for (const sel of consentSelectors) {
        try {
          const btn = await page.$(sel);
          if (btn) {
            await btn.click();
            await delay(2000);
            console.log('  ✓ Cookies zaakceptowane');
            return;
          }
        } catch { /* spróbuj następny */ }
      }

      // Fallback – kliknij ostatni przycisk formularza
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const last = buttons[buttons.length - 1];
        if (last) last.click();
      });
      await delay(2000);
      return;
    }

    // Baner cookies wewnątrz Maps
    const inlineSelectors = [
      '[aria-label*="Accept all"]',
      '[aria-label*="Zaakceptuj"]',
      '#L2AGLb',
    ];
    for (const sel of inlineSelectors) {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        await delay(800);
        return;
      }
    }
  } catch { /* baner nie wystąpił */ }
}

// ─── ZBIERANIE LINKÓW Z LISTY ─────────────────────────────────────────────────

async function collectLinks(page) {
  const links = new Set();
  const feedSel = '[role="feed"]';
  let prevHeight = 0;
  let noChangeCount = 0;

  for (let i = 0; i < 20; i++) {  // do 20 scrolli → więcej wyników
    // Zbierz obecne linki
    const raw = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('[role="feed"] a[href*="/maps/place/"]'),
      ).map((a) => a.href),
    );
    raw.forEach((u) => links.add(u));

    // Scroll w dół
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
      if (noChangeCount >= 3) break; // koniec listy
    } else {
      noChangeCount = 0;
    }
    prevHeight = curHeight;
  }

  // Odfiltrowuj już odwiedzone
  return [...links].filter((u) => !seenUrls.has(u));
}

// ─── SCRAPING STRONY FIRMY ────────────────────────────────────────────────────

async function scrapeBusiness(page, url) {
  seenUrls.add(url);

  await page.goto(url, { waitUntil: 'networkidle2', timeout: CONFIG.pageTimeout });
  await delay(1800);

  const raw = await page.evaluate(() => {
    /** Pomocnik: szuka tekstu w przycisku / sekcji wg atrybutów */
    function findText(selectors) {
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return el.textContent.trim();
      }
      return '';
    }

    // ── Nazwa ──────────────────────────────────────────────────────────
    const name =
      document.querySelector('h1.DUwDvf')?.textContent.trim() ||
      document.querySelector('h1')?.textContent.trim() ||
      '';

    // ── Kategoria/typ firmy ─────────────────────────────────────────────
    const category =
      document.querySelector('button.DkEaL')?.textContent.trim() ||
      document.querySelector('[jsaction*="category"]')?.textContent.trim() ||
      '';

    // ── Telefon ─────────────────────────────────────────────────────────
    let phone = '';
    // Nowe Google Maps: data-item-id="phone:tel:..."
    const phoneBtn = document.querySelector('[data-item-id^="phone:tel:"]');
    if (phoneBtn) {
      phone = phoneBtn.getAttribute('data-item-id').replace('phone:tel:', '');
    }
    if (!phone) {
      // Fallback: szukaj tekstu wyglądającego jak numer
      const allText = Array.from(
        document.querySelectorAll('[aria-label]'),
      ).map((el) => el.getAttribute('aria-label') || '');
      const match = allText.find((t) => /^[+\d][\d\s\-()]{6,}$/.test(t.trim()));
      if (match) phone = match.trim();
    }

    // ── Strona WWW ───────────────────────────────────────────────────────
    let website = '';
    const siteBtn = document.querySelector(
      'a[data-item-id="authority"], a[aria-label*="website"], a[aria-label*="strona"]',
    );
    if (siteBtn) {
      website = siteBtn.href || siteBtn.getAttribute('aria-label') || '';
      // Usuń parametry śledzenia Google
      try {
        const u = new URL(website);
        if (u.hostname === 'www.google.com' || u.hostname === 'google.com') {
          website = u.searchParams.get('q') || website;
        }
      } catch { /* invalid url */ }
    }

    // ── Adres ────────────────────────────────────────────────────────────
    let address = '';
    const addrBtn = document.querySelector('[data-item-id="address"]');
    if (addrBtn) address = addrBtn.textContent.trim();
    if (!address) {
      const possibleAddr = document.querySelector(
        '[aria-label*="Adres"], [aria-label*="Address"]',
      );
      if (possibleAddr) address = possibleAddr.textContent.trim();
    }

    // ── Opis / opis firmy ────────────────────────────────────────────────
    let description = '';
    const descEl =
      document.querySelector('[data-attrid="description"]') ||
      document.querySelector('.PYvSYb') ||
      document.querySelector('[class*="description"]');
    if (descEl) description = descEl.textContent.trim().substring(0, 500);

    // ── Email ────────────────────────────────────────────────────────────
    // Google Maps rzadko pokazuje email – próbuj znaleźć w widocznym tekście
    let email = '';
    const bodyText = document.body.innerText;
    const emailMatch = bodyText.match(
      /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
    );
    if (emailMatch) email = emailMatch[0];

    return { name, category, phone, website, address, description, email };
  });

  // Walidacja minimalna
  if (!raw.name) return null;
  return raw;
}

// ─── DODAWANIE FIRMY DO LISTY ─────────────────────────────────────────────────

function addCompany(raw) {
  const phone = cleanPhone(raw.phone);

  // Deduplikacja po nazwie i numerze telefonu
  if (seenNames.has(raw.name)) return;
  if (phone && seenPhones.has(phone)) return;

  if (raw.name) seenNames.add(raw.name);
  if (phone) seenPhones.add(phone);

  const allText = `${raw.name} ${raw.category} ${raw.description}`;
  const services  = detectServices(allText);
  const country   = detectCountry(`${raw.name} ${raw.address}`);
  const city      = extractCity(raw.address);
  const postalCode = extractPostalCode(raw.address);

  // Definiujemy opis – jeśli scraped jest pusty, użyj generycznego
  const description = raw.description ||
    `Firma transportowa świadcząca usługi w Polsce i Europie.`;

  companies.push({
    name:        raw.name,
    regNumber:   '',
    country:     country,
    phone:       phone,
    email:       raw.email || '',
    website:     raw.website || '',
    description: description,
    postalCode:  postalCode,
    city:        city,
    serviceCountries: 'PL,DE,NL,BE,FR,AT',
    services:    services || 'transport',
    departureDays:  '',
    returnDays:     '',
    baggageInfo:    '',
  });

  console.log(`  ✅ [${companies.length}] ${raw.name} | ${phone} | ${services || '—'}`);

  // Auto-zapis co 50 firm
  if (companies.length % 50 === 0) {
    saveCSV().then(() =>
      console.log(`  💾 Auto-zapis: ${companies.length} firm`)
    );
  }
}

// ─── ZAPIS DO CSV ─────────────────────────────────────────────────────────────

async function saveCSV() {
  if (companies.length === 0) {
    console.log('\n⚠️  Brak danych do zapisania.');
    return;
  }

  // Pisarz CSV z separatorem ";" i nagłówkami po polsku
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
  console.log(` ✅  Zapisano ${companies.length} firm → ${CONFIG.outputFile}`);
  console.log('═══════════════════════════════════════════════════════');

  // Podsumowanie tagów
  const tagCount = {};
  companies.forEach((c) => {
    c.services.split(',').forEach((s) => {
      const t = s.trim();
      if (t) tagCount[t] = (tagCount[t] || 0) + 1;
    });
  });
  console.log('\n📊 Podsumowanie usług:');
  Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tag, count]) => console.log(`   ${tag}: ${count}`));
}

// ─── START ────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('❌ Krytyczny błąd:', err);
  process.exit(1);
});
