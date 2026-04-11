/**
 * Google Maps Moving Companies Crawler (PRZEPROWADZKI)
 * 
 * Szuka polskich firm przeprowadzkowych:
 * - działających na terenie Polski
 * - działających w całej Europie (Niemcy, Holandia, Belgia, UK, itp.)
 * 
 * Uses puppeteer-extra with stealth plugin to avoid detection
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const CONFIG = {
  headless: false,
  searchKeywords: [
    // === POLSKA KRAJOWA ===
    'firma przeprowadzkowa warszawa',
    'przeprowadzki warszawa',
    'firma przeprowadzkowa kraków',
    'przeprowadzki kraków',
    'firma przeprowadzkowa wrocław',
    'przeprowadzki wrocław',
    'firma przeprowadzkowa poznań',
    'przeprowadzki gdańsk',
    'przeprowadzki śląsk katowice',
    'transport mebli polska',
    'przeprowadzki łódź',
    'przeprowadzki szczecin',

    // === POLSKA → EUROPA (firmy polskie) ===
    'przeprowadzki polska niemcy',
    'przeprowadzki polska holandia',
    'przeprowadzki polska belgia',
    'przeprowadzki polska anglia wielka brytania',
    'przeprowadzki polska francja',
    'przeprowadzki polska europa',
    'firma przeprowadzkowa niemcy polska',
    'transport mebli polska niemcy',
    'transport mebli polska holandia',
    'przeprowadzki z niemiec do polski',
    'przeprowadzki z holandii do polski',
    'przeprowadzki z anglii do polski',
    'przeprowadzki polska norwegia',
    'przeprowadzki polska szwecja',
    'przeprowadzki miedzynarodowe polska',
    'international moving company poland',
    'przeprowadzki europa bus polska',
  ],

  googleMapsUrl: 'https://www.google.pl/maps?hl=pl&gl=PL',

  maxBusinessesPerKeyword: 6, // ~28 keywords × 6 = ~168, after dedup ~100-120
  scrollDelay: 3000,
  actionDelay: 2500,
  outputFile: 'przeprowadzki_companies.csv'
};

let allBusinesses = [];
const collectedUrls = new Set();
const savedKeys = new Set(); // deduplication by phone or URL

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('📦 START: Google Maps PRZEPROWADZKI Crawler');
  console.log(`📊 Keywords: ${CONFIG.searchKeywords.length}`);
  console.log(`🎯 Cel: ~100 firm przeprowadzkowych\n`);

  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080',
    ]
  });

  try {
    const page = await browser.newPage();

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.setViewport({ width: 1920, height: 1080 });

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    ];
    await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);

    for (let i = 0; i < CONFIG.searchKeywords.length; i++) {
      const keyword = CONFIG.searchKeywords[i];
      console.log(`\n🔍 [${i + 1}/${CONFIG.searchKeywords.length}] "${keyword}"`);

      try {
        await searchBusinesses(page, keyword);
        const randomDelay = 4000 + Math.random() * 3000;
        await delay(randomDelay);

        if (allBusinesses.length >= 120) {
          console.log(`\n✋ Zebrano ${allBusinesses.length} firm, zatrzymuję`);
          break;
        }
      } catch (error) {
        console.error(`   ❌ Błąd: ${error.message}`);
        await delay(5000);
        continue;
      }
    }

    await saveToCSV();

    console.log('\n✅ Crawler zakończony!');
    console.log(`📁 Zebrano: ${allBusinesses.length} firm`);
    console.log(`💾 Plik: ${CONFIG.outputFile}`);

  } catch (error) {
    console.error('❌ Błąd krytyczny:', error);
    await saveToCSV();
  } finally {
    await browser.close();
  }
}

async function searchBusinesses(page, keyword) {
  await page.goto(CONFIG.googleMapsUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  await delay(1500 + Math.random() * 1000);

  // Obsługa ciasteczek
  try {
    await page.waitForTimeout(2000);
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent?.toLowerCase() || '', btn);
      if (text.includes('accept') || text.includes('akceptuj') || text.includes('zgadzam')) {
        try { await btn.click(); await delay(1500); break; } catch (e) {}
      }
    }
  } catch (e) {}

  // Wyszukiwanie
  const selectors = [
    'input#searchboxinput',
    'input[aria-label*="Search"]',
    'input[name="q"]',
  ];

  let searchSuccess = false;
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector);
      await delay(300 + Math.random() * 200);

      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await delay(200);

      for (const char of keyword) {
        await page.keyboard.type(char);
        await delay(50 + Math.random() * 80);
      }

      await delay(500);
      await page.keyboard.press('Enter');
      searchSuccess = true;
      break;
    } catch (e) {
      continue;
    }
  }

  if (!searchSuccess) throw new Error('Nie można wyszukać');

  await delay(3500 + Math.random() * 1500);

  try {
    await page.waitForSelector('[role="feed"]', { timeout: 15000 });
    console.log('   ✓ Wyniki załadowane');
  } catch (e) {
    throw new Error('Brak wyników');
  }

  const links = await scrollResults(page);
  if (links.length === 0) {
    console.log('   ⚠️  Brak firm');
    return;
  }

  console.log(`   ✓ Znaleziono ${links.length} wyników`);

  const limit = Math.min(links.length, CONFIG.maxBusinessesPerKeyword);
  let added = 0;

  for (let i = 0; i < limit; i++) {
    try {
      const data = await extractBusinessData(page, links[i]);
      if (data && data.name) {
        const key = data.phone || data.url;
        if (!savedKeys.has(key)) {
          savedKeys.add(key);
          allBusinesses.push(data);
          added++;
          const phoneInfo = data.phone ? ` (${data.phone})` : ' (brak tel.)';
          console.log(`      ✓ ${data.name.substring(0, 55)}${phoneInfo}`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Pominięto: ${error.message}`);
    }
    await delay(CONFIG.actionDelay + Math.random() * 1000);
  }

  console.log(`   ✅ Dodano: ${added} | Razem: ${allBusinesses.length}`);
}

async function scrollResults(page) {
  const links = [];

  try {
    const feed = '[role="feed"]';
    await page.waitForSelector(feed, { timeout: 10000 });

    let scrolls = 0;

    while (scrolls < 6) {
      const urls = await page.evaluate(() => {
        const items = document.querySelectorAll('[role="feed"] a[href*="/maps/place/"]');
        return Array.from(items).map(a => a.href);
      });

      urls.forEach(url => {
        if (!collectedUrls.has(url)) {
          collectedUrls.add(url);
          links.push(url);
        }
      });

      if (links.length >= CONFIG.maxBusinessesPerKeyword * 2) break;

      await page.evaluate(() => {
        const feed = document.querySelector('[role="feed"]');
        if (feed) feed.scrollTop += 500;
      });

      await delay(CONFIG.scrollDelay);

      const endText = await page.evaluate(() => {
        return document.body.innerText.includes("You've reached the end") ||
               document.body.innerText.includes('Dotarłeś do końca');
      });
      if (endText) break;

      scrolls++;
    }
  } catch (e) {
    console.log(`   ⚠️  Scroll error: ${e.message}`);
  }

  return links;
}

async function extractBusinessData(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await delay(2000 + Math.random() * 1000);

  return await page.evaluate(() => {
    // Name
    const nameEl = document.querySelector('h1.DUwDvf') ||
      document.querySelector('h1[data-attrid="title"]') ||
      document.querySelector('h1');
    const name = nameEl?.textContent?.trim() || '';

    // Phone - multiple strategies
    let phone = '';
    // Strategy 1: tel: href link
    const telLink = document.querySelector('a[href^="tel:"]');
    if (telLink) phone = telLink.getAttribute('href').replace('tel:', '').trim();
    // Strategy 2: button with data-tooltip containing 'phone'
    if (!phone) {
      const btn = [...document.querySelectorAll('button[data-tooltip]')]
        .find(b => b.getAttribute('data-tooltip')?.toLowerCase().includes('phone') ||
                   b.getAttribute('data-tooltip')?.toLowerCase().includes('telefon'));
      if (btn) phone = btn.textContent.trim();
    }
    // Strategy 3: aria-label containing phone digits
    if (!phone) {
      const span = [...document.querySelectorAll('[aria-label]')]
        .find(el => /\+?[0-9 \-]{9,}/.test(el.getAttribute('aria-label') || '') &&
                    el.getAttribute('aria-label')?.toLowerCase().includes('phone'));
      if (span) phone = span.getAttribute('aria-label').replace(/[^+0-9 ]/g, '').trim();
    }
    // Strategy 4: any element with class containing 'phone' or 'tel'
    if (!phone) {
      const el = document.querySelector('[class*="phone"], [class*="tel"], [data-item-id*="phone"]');
      if (el) phone = el.textContent.trim();
    }
    // Strategy 5: look for Polish phone patterns in visible text
    if (!phone) {
      const allText = document.body.innerText;
      const match = allText.match(/(\+48[\s]?[0-9 ]{9,}|\b[0-9]{3}[\s-]?[0-9]{3}[\s-]?[0-9]{3}\b)/);
      if (match) phone = match[0].replace(/\s+/g, '');
    }

    // Address
    const addressEl = document.querySelector('button[data-tooltip*="address"]') ||
      document.querySelector('button[data-tooltip*="adres"]') ||
      document.querySelector('[data-item-id="address"]');
    const address = addressEl?.textContent?.trim() || '';

    // Website
    const websiteEl = document.querySelector('a[data-tooltip*="website"]') ||
      document.querySelector('a[aria-label*="website"]') ||
      document.querySelector('a[href^="http"][data-item-id*="authority"]');
    const website = websiteEl?.href || '';

    // Rating
    const ratingEl = document.querySelector('.F7nice span[aria-hidden="true"]');
    const rating = ratingEl?.textContent?.trim() || '';

    // Reviews
    const reviewEl = document.querySelector('[aria-label*="reviews"], [aria-label*="opinii"]');
    const reviews = reviewEl?.getAttribute('aria-label')?.match(/\d+/)?.[0] || '';

    return { name, phone, address, website, rating, reviews, url: window.location.href };
  });
}

async function saveToCSV() {
  if (allBusinesses.length === 0) {
    console.log('⚠️  Brak firm do zapisania');
    return;
  }

  const csvWriter = createCsvWriter({
    path: CONFIG.outputFile,
    header: [
      { id: 'name', title: 'Company Name' },
      { id: 'phone', title: 'Phone' },
      { id: 'address', title: 'Address' },
      { id: 'website', title: 'Website' },
      { id: 'rating', title: 'Rating' },
      { id: 'reviews', title: 'Reviews' },
      { id: 'url', title: 'Maps URL' },
    ]
  });

  await csvWriter.writeRecords(allBusinesses);
  console.log(`\n💾 Zapisano ${allBusinesses.length} firm → ${CONFIG.outputFile}`);
}

main();
