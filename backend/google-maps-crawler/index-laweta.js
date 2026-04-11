/**
 * Google Maps Car Towing Services Crawler (LAWETY)
 * 
 * Scrapes car towing, vehicle transport & recovery businesses
 * Target: ~100 companies across Europe
 * Uses puppeteer-extra with stealth plugin to avoid detection
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import fs from 'fs';

// Add stealth plugin
puppeteer.use(StealthPlugin());

// Configuration
const CONFIG = {
  headless: false, // Widoczna przeglądarka - możesz śledzić postęp
  searchKeywords: [
    // POLSKA - firmy z siedzibą w Polsce oferujące usługi międzynarodowe
    'laweta polska niemcy',
    'pomoc drogowa polska europa',
    'holowanie międzynarodowe polska',
    'laweta transport polska holandia',
    'autoholowanie polska belgia',
    'transport samochodów polska niemcy',
    'laweta międzynarodowa warszawa',
    'pomoc drogowa polska niemcy 24h',
    'holowanie aut z niemiec do polski',
    'laweta z holandii do polski',
    'transport pojazdów polska europa',
    'pomoc drogowa europeisk polska',
    'laweta polska francja',
    'autoholowanie z belgii do polski',
    'przewóz samochodów niemcy polska',
    
    // Konkretne miasta PL (siedziby firm międzynarodowych)
    'laweta międzynarodowa warszawa',
    'pomoc drogowa europa kraków',
    'laweta niemcy poznań',
    'autoholowanie europa wrocław',
    'laweta holandia gdańsk',
    
    // Dodatkowe frazy PL
    'pomoc drogowa całodobowa polska',
    'laweta 24h polska',
    'holowanie europa polska'
  ],
  
  // Konfiguracja Google Maps dla Polski (ignoruje lokalną lokalizację)
  googleMapsUrl: 'https://www.google.pl/maps?hl=pl&gl=PL',
  searchRegion: 'Poland', // Wymusza region Polski
  
  maxBusinessesPerKeyword: 6, // 23 keywords × 6 = ~138, after dedup ~100
  scrollDelay: 3000,
  actionDelay: 2500,
  outputFile: 'laweta_companies.csv'
};

// Region detection
const REGION_RULES = {
  'Poland': ['warszawa', 'kraków', 'wrocław', 'gdańsk', 'poznań', 'łódź', 'szczecin', 'lublin', 'katowice', 'poland', 'polska', 'pl'],
  'Germany': ['berlin', 'münchen', 'hamburg', 'frankfurt', 'köln', 'düsseldorf', 'germany', 'deutschland', 'de'],
  'Netherlands': ['amsterdam', 'rotterdam', 'utrecht', 'eindhoven', 'haag', 'netherlands', 'nederland', 'nl'],
  'Belgium': ['brussels', 'antwerp', 'ghent', 'bruges', 'liège', 'belgium', 'belgique', 'belgië', 'be'],
  'France': ['paris', 'marseille', 'lyon', 'toulouse', 'nice', 'france', 'fr'],
  'Austria': ['vienna', 'wien', 'graz', 'linz', 'salzburg', 'austria', 'österreich', 'at']
};

let allBusinesses = [];
const collectedUrls = new Set();
const collectedPhones = new Set();

/**
 * Main execution
 */
async function main() {
  console.log('🚛 Starting Google Maps CAR TOWING Crawler (LAWETY) v2 with Stealth');
  console.log(`📊 Keywords: ${CONFIG.searchKeywords.length}`);
  console.log(`🎯 Target: ~100 companies\n`);

  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Extra stealth measures
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Random user agent rotation
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    ];
    await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);

    // Process each keyword with random delays
    for (let i = 0; i < CONFIG.searchKeywords.length; i++) {
      const keyword = CONFIG.searchKeywords[i];
      console.log(`\n🔍 [${i + 1}/${CONFIG.searchKeywords.length}] "${keyword}"`);
      
      try {
        await searchBusinesses(page, keyword);
        
        // Random delay between searches (4-7 seconds)
        const randomDelay = 4000 + Math.random() * 3000;
        await delay(randomDelay);
        
        // Stop early if we have enough
        if (allBusinesses.length >= 110) {
          console.log(`\n✋ Reached 110 companies, stopping`);
          break;
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        await delay(5000); // Wait longer on error
        continue;
      }
    }

    await saveToCSV();
    
    console.log('\n✅ Crawler DONE!');
    console.log(`📁 Total: ${allBusinesses.length} companies`);
    console.log(`💾 File: ${CONFIG.outputFile}`);

  } catch (error) {
    console.error('❌ Critical:', error);
  } finally {
    await browser.close();
  }
}

/**
 * Search businesses - improved with stealth + Poland region forcing
 */
async function searchBusinesses(page, keyword) {
  try {
    // Wymuszamy polską domenę i region
    await page.goto(CONFIG.googleMapsUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await delay(1500 + Math.random() * 1000); // Random delay

    // Accept cookies - improved detection
    try {
      await page.waitForTimeout(2000);
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent?.toLowerCase() || '', btn);
        if (text.includes('accept') || text.includes('reject') || text.includes('akceptuj')) {
          try {
            await btn.click();
            console.log('   ✓ Cookies handled');
            await delay(1500);
            break;
          } catch (e) {}
        }
      }
    } catch (e) {
      console.log('   ℹ️  No cookies dialog');
    }

    // Find and use search box - multiple attempts
    let searchSuccess = false;
    const selectors = [
      'input#searchboxinput',
      'input[aria-label*="Search"]',
      'input[name="q"]',
      'input[placeholder*="Search"]'
    ];
    
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        
        //Human-like typing
        await page.click(selector);
        await delay(300 + Math.random() * 200);
        
        // Clear existing text
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await delay(200);
        
        // Type with random delays
        for (const char of keyword) {
          await page.keyboard.type(char);
          await delay(50 + Math.random() * 100);
        }
        
        await delay(500);
        await page.keyboard.press('Enter');
        console.log(`   ✓ Wyszukano: "${keyword}"`);
        searchSuccess = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!searchSuccess) {
      throw new Error('Could not submit search');
    }

    await delay(3500 + Math.random() * 1500);

    // Wait for results
    try {
      await page.waitForSelector('[role="feed"]', { timeout: 15000 });
      console.log('   ✓ Wyniki załadowane');
    } catch (e) {
      throw new Error('No results found');
    }

    // Scroll & collect
    const links = await scrollResults(page);
    
    if (links.length === 0) {
      console.log('   ⚠️  Brak firm');
      return;
    }
    
    console.log(`   ✓ Znaleziono ${links.length} wyników`);

    // Extract data
    const limit = Math.min(links.length, CONFIG.maxBusinessesPerKeyword);
    let added = 0;

    for (let i = 0; i < limit; i++) {
      console.log(`   📋 ${i + 1}/${limit}...`);
      
      try {
        const data = await extractBusinessData(page, links[i]);
        
        if (data && data.name && data.phone) {
          // Deduplicate by phone
          if (!collectedPhones.has(data.phone)) {
            collectedPhones.add(data.phone);
            allBusinesses.push(data);
            added++;
            console.log(`      ✓ ${data.name.substring(0, 60)}...`);
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Pominięto: ${error.message}`);
      }
      
      // Random delay between businesses
      await delay(CONFIG.actionDelay + Math.random() * 1000);
    }

    console.log(`   ✅ Dodano: ${added} nowych | Razem: ${allBusinesses.length}`);

  } catch (error) {
    throw error;
  }
}

/**
 * Scroll results
 */
async function scrollResults(page) {
  const links = [];
  
  try {
    const feed = '[role="feed"]';
    await page.waitForSelector(feed, { timeout: 10000 });

    let prevHeight = 0;
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

      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.scrollTop = el.scrollHeight;
      }, feed);

      await delay(CONFIG.scrollDelay);

      const h = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? el.scrollHeight : 0;
      }, feed);

      if (h === prevHeight) break;
      prevHeight = h;
      scrolls++;
    }

  } catch (error) {
    console.log(`   ⚠️  Scroll error`);
  }

  return links;
}

/**
 * Extract business data
 */
async function extractBusinessData(page, url) {
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 20000
  });

  await delay(2000);

  const data = await page.evaluate(() => {
    const result = {
      name: '',
      phone: '',
      website: '',
      address: '',
      region: ''
    };

    // Name
    const h1 = document.querySelector('h1');
    result.name = h1 ? h1.textContent.trim() : '';

    // Phone
    const phoneBtn = document.querySelector('button[data-item-id*="phone"]');
    if (phoneBtn) {
      const phoneAttr = phoneBtn.getAttribute('data-item-id');
      if (phoneAttr) {
        result.phone = phoneAttr.replace('phone:tel:', '').trim();
      }
    }
    
    if (!result.phone) {
      const phoneLinks = Array.from(document.querySelectorAll('a[href^="tel:"]'));
      if (phoneLinks.length > 0) {
        result.phone = phoneLinks[0].href.replace('tel:', '').trim();
      }
    }

    // Website
    const websiteBtn = document.querySelector('a[data-item-id*="authority"]');
    if (websiteBtn) {
      result.website = websiteBtn.href;
    }

    // Address
    const addressBtn = document.querySelector('button[data-item-id*="address"]');
    if (addressBtn) {
      const ariaLabel = addressBtn.getAttribute('aria-label');
      if (ariaLabel) {
        const match = ariaLabel.match(/Address: (.+)/);
        result.address = match ? match[1].trim() : '';
      }
    }

    return result;
  });

  // Detect region
  data.region = detectRegion(data.address + ' ' + data.name);
  
  return data;
}

/**
 * Detect country from text
 */
function detectRegion(text) {
  const lower = text.toLowerCase();
  
  for (const [region, keywords] of Object.entries(REGION_RULES)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return region;
    }
  }
  
  return 'Unknown';
}

/**
 * Save to CSV
 */
async function saveToCSV() {
  const csvWriter = createCsvWriter({
    path: CONFIG.outputFile,
    header: [
      { id: 'name', title: 'Company Name' },
      { id: 'phone', title: 'Phone' },
      { id: 'website', title: 'Website' },
      { id: 'address', title: 'Address' },
      { id: 'region', title: 'Region' }
    ]
  });

  await csvWriter.writeRecords(allBusinesses);
  console.log(`\n💾 Saved ${allBusinesses.length} records to ${CONFIG.outputFile}`);
}

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run
main().catch(console.error);
