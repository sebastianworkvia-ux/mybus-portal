/**
 * Google Maps Transport Companies Crawler
 * 
 * Scrapes transport businesses from Google Maps and saves to CSV
 * Tech: Node.js + Puppeteer + csv-writer
 */

const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  headless: false, // Set to true for production
  searchKeywords: [
    // Przewóz osób - busy międzynarodowe
    'przewozy osób polska',
    'busy międzynarodowe',
    'transport pasażerski',
    'przewóz osób polska europa',
    'busy do niemiec',
    'busy do holandii',
    'busy do belgii',
    'busy do francji',
    
    // Transfery lotniskowe
    'transfer lotniskowy polska',
    'przewóz na lotnisko',
    'transport lotniskowy',
    'taxi lotniskowe polska',
    
    // Paczki i kurierzy
    'transport paczek międzynarodowy',
    'przewóz paczek polska europa',
    'kurier międzynarodowy',
    
    // Wycieczki i autokary
    'wycieczki autokarowe',
    'wynajem autokarów',
    'przewozy turystyczne',
    'autokary polska',
    
    // Lawety i transport pojazdów
    'laweta transport polska',
    'transport pojazdów',
    'przewóz samochodów',
    
    // Transport zwierząt
    'transport zwierząt polska',
    'przewóz zwierząt',
    
    // Przeprowadzki
    'przeprowadzki międzynarodowe',
    'przeprowadzki polska europa',
    'transport przeprowadzkowy',
    
    // Przejazdy służbowe
    'transport pracowników',
    'busy dla firm',
    'przewóz pracowników'
  ],
  maxBusinessesPerKeyword: 50, // Increased for more results (~1600 total)
  scrollDelay: 2000,
  actionDelay: 1500,
  outputFile: 'transport_companies_full.csv'
};

// Region detection rules
const REGION_RULES = {
  'Poland': ['warszawa', 'kraków', 'wrocław', 'gdańsk', 'poznań', 'łódź', 'szczecin', 'lublin', 'katowice', 'bydgoszcz', 'poland', 'polska'],
  'Germany': ['berlin', 'münchen', 'hamburg', 'frankfurt', 'köln', 'stuttgart', 'düsseldorf', 'dortmund', 'essen', 'leipzig', 'germany', 'deutschland'],
  'Netherlands': ['amsterdam', 'rotterdam', 'den haag', 'utrecht', 'eindhoven', 'tilburg', 'groningen', 'netherlands', 'nederland'],
  'Belgium': ['brussels', 'antwerp', 'ghent', 'bruges', 'liège', 'belgium', 'belgique', 'belgië'],
  'France': ['paris', 'marseille', 'lyon', 'toulouse', 'nice', 'nantes', 'strasbourg', 'france'],
  'Austria': ['vienna', 'wien', 'graz', 'linz', 'salzburg', 'innsbruck', 'austria', 'österreich']
};

// Store collected data
let allBusinesses = [];
const collectedUrls = new Set(); // Prevent duplicates

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Google Maps Transport Companies Crawler');
  console.log(`📊 Target: ~${CONFIG.searchKeywords.length * CONFIG.maxBusinessesPerKeyword} companies\n`);

  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Process each keyword
    for (let i = 0; i < CONFIG.searchKeywords.length; i++) {
      const keyword = CONFIG.searchKeywords[i];
      console.log(`\n🔍 [${i + 1}/${CONFIG.searchKeywords.length}] Searching: "${keyword}"`);
      
      try {
        await searchBusinesses(page, keyword);
        await delay(3000); // Delay between searches
      } catch (error) {
        console.error(`❌ Error searching "${keyword}":`, error.message);
        continue;
      }
    }

    // Save results
    await saveToCSV();
    
    console.log('\n✅ Crawler completed successfully!');
    console.log(`📁 Total companies collected: ${allBusinesses.length}`);
    console.log(`💾 Saved to: ${CONFIG.outputFile}`);

  } catch (error) {
    console.error('❌ Critical error:', error);
  } finally {
    await browser.close();
  }
}

/**
 * Search for businesses on Google Maps
 * @param {Page} page - Puppeteer page object
 * @param {string} keyword - Search keyword
 */
async function searchBusinesses(page, keyword) {
  try {
    // Navigate to Google Maps Poland
    await page.goto('https://www.google.pl/maps?hl=pl&gl=PL', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await delay(2000);

    // Accept cookies if present
    try {
      const acceptButton = await page.$('button[aria-label*="Accept"], button:has-text("Accept all")');
      if (acceptButton) {
        await acceptButton.click();
        await delay(1000);
      }
    } catch (e) {
      // Cookies dialog might not appear
    }

    // Find search box and enter keyword - try multiple selectors
    let searchBoxSelector = 'input[name="q"]';
    
    // Try alternative selectors if first doesn't work
    const searchSelectors = [
      'input[name="q"]',
      '#searchboxinput',
      'input[aria-label*="Search"]',
      'input[placeholder*="Search"]'
    ];
    
    let searchBox = null;
    for (const selector of searchSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        searchBox = await page.$(selector);
        if (searchBox) {
          searchBoxSelector = selector;
          console.log(`   ✓ Using selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!searchBox) {
      throw new Error('Could not find search box - Google Maps might have changed');
    }
    
    await page.click(searchBoxSelector);
    await page.type(searchBoxSelector, keyword, { delay: 100 });
    
    // Submit search
    await page.keyboard.press('Enter');
    await delay(3000);

    // Wait for results
    await page.waitForSelector('[role="feed"]', { timeout: 15000 });
    console.log('   ✓ Results loaded');

    // Scroll and collect business links
    const businessLinks = await scrollResults(page);
    console.log(`   ✓ Found ${businessLinks.length} businesses`);

    // Extract data from each business
    let successCount = 0;
    const limit = Math.min(businessLinks.length, CONFIG.maxBusinessesPerKeyword);

    for (let i = 0; i < limit; i++) {
      console.log(`   📋 Processing ${i + 1}/${limit}...`);
      
      try {
        const businessData = await extractBusinessData(page, businessLinks[i]);
        
        if (businessData && businessData.name) {
          // Check for duplicate
          const isDuplicate = allBusinesses.some(b => 
            b.name === businessData.name || b.phone === businessData.phone
          );
          
          if (!isDuplicate) {
            allBusinesses.push(businessData);
            successCount++;
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Skipped business ${i + 1}: ${error.message}`);
        continue;
      }
      
      await delay(CONFIG.actionDelay);
    }

    console.log(`   ✅ Successfully extracted: ${successCount} companies`);

  } catch (error) {
    console.error(`   ❌ Search failed: ${error.message}`);
    throw error;
  }
}

/**
 * Scroll results panel to load more businesses
 * @param {Page} page - Puppeteer page object
 * @returns {Array} - Array of business URLs
 */
async function scrollResults(page) {
  const businessLinks = [];
  
  try {
    const resultsSelector = '[role="feed"]';
    await page.waitForSelector(resultsSelector, { timeout: 10000 });

    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrolls = 8; // Limit scrolling to avoid infinite loops

    while (scrollAttempts < maxScrolls) {
      // Get all business links
      const links = await page.evaluate(() => {
        const items = document.querySelectorAll('[role="feed"] a[href*="/maps/place/"]');
        return Array.from(items).map(a => a.href);
      });

      // Add new unique links
      links.forEach(link => {
        if (!collectedUrls.has(link)) {
          collectedUrls.add(link);
          businessLinks.push(link);
        }
      });

      // Scroll the results panel
      const scrollContainer = await page.$(resultsSelector);
      if (scrollContainer) {
        await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (element) {
            element.scrollTop = element.scrollHeight;
          }
        }, resultsSelector);
      }

      await delay(CONFIG.scrollDelay);

      // Check if we've reached the end
      const currentHeight = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element ? element.scrollHeight : 0;
      }, resultsSelector);

      if (currentHeight === previousHeight) {
        break; // No more content to load
      }

      previousHeight = currentHeight;
      scrollAttempts++;
    }

  } catch (error) {
    console.log(`   ⚠️  Scroll error: ${error.message}`);
  }

  return businessLinks;
}

/**
 * Extract business data from Google Maps page
 * @param {Page} page - Puppeteer page object
 * @param {string} url - Business URL
 * @returns {Object} - Business data
 */
async function extractBusinessData(page, url) {
  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 20000
    });

    await delay(2000);

    // Extract data using page.evaluate
    const businessData = await page.evaluate(() => {
      const data = {
        name: '',
        phone: '',
        website: '',
        address: '',
        region: ''
      };

      // Business name
      const nameElement = document.querySelector('h1');
      data.name = nameElement ? nameElement.textContent.trim() : '';

      // Phone number
      const phoneButton = document.querySelector('button[data-item-id*="phone"]');
      if (phoneButton) {
        const phoneText = phoneButton.getAttribute('data-item-id');
        if (phoneText) {
          data.phone = phoneText.replace('phone:tel:', '').trim();
        }
      }
      
      // Alternative phone selector
      if (!data.phone) {
        const phoneElements = Array.from(document.querySelectorAll('[data-tooltip]'));
        for (const elem of phoneElements) {
          const text = elem.textContent;
          if (text && /[\+\d\s\(\)-]{8,}/.test(text)) {
            data.phone = text.trim();
            break;
          }
        }
      }

      // Website
      const websiteButton = document.querySelector('a[data-item-id*="authority"]');
      if (websiteButton) {
        data.website = websiteButton.href;
      }

      // Address
      const addressButton = document.querySelector('button[data-item-id*="address"]');
      if (addressButton) {
        const ariaLabel = addressButton.getAttribute('aria-label');
        if (ariaLabel) {
          data.address = ariaLabel.replace('Address:', '').trim();
        }
      }

      // Alternative address selector
      if (!data.address) {
        const addressElements = document.querySelectorAll('[data-item-id*="address"]');
        for (const elem of addressElements) {
          const text = elem.textContent.trim();
          if (text && text.length > 10) {
            data.address = text;
            break;
          }
        }
      }

      return data;
    });

    // Detect region from address
    businessData.region = detectRegion(businessData.address);

    // Clean website URL
    if (businessData.website) {
      try {
        const url = new URL(businessData.website);
        businessData.website = url.hostname.replace('www.', '');
      } catch (e) {
        // Keep original if URL parsing fails
      }
    }

    return businessData;

  } catch (error) {
    throw new Error(`Failed to extract data: ${error.message}`);
  }
}

/**
 * Detect region/country from address
 * @param {string} address - Business address
 * @returns {string} - Detected region
 */
function detectRegion(address) {
  if (!address) return 'Unknown';

  const lowerAddress = address.toLowerCase();

  for (const [region, keywords] of Object.entries(REGION_RULES)) {
    for (const keyword of keywords) {
      if (lowerAddress.includes(keyword)) {
        return region;
      }
    }
  }

  return 'Unknown';
}

/**
 * Save collected data to CSV file
 */
async function saveToCSV() {
  if (allBusinesses.length === 0) {
    console.log('\n⚠️  No data to save');
    return;
  }

  const csvWriter = createCsvWriter({
    path: CONFIG.outputFile,
    header: [
      { id: 'name', title: 'Name' },
      { id: 'phone', title: 'Phone' },
      { id: 'website', title: 'Website' },
      { id: 'address', title: 'Address' },
      { id: 'region', title: 'Region' }
    ]
  });

  try {
    await csvWriter.writeRecords(allBusinesses);
    console.log(`\n💾 Data saved to ${CONFIG.outputFile}`);
  } catch (error) {
    console.error('❌ Failed to save CSV:', error.message);
  }
}

/**
 * Delay helper function
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Interrupted by user');
  console.log(`📊 Collected ${allBusinesses.length} companies before stopping`);
  
  if (allBusinesses.length > 0) {
    await saveToCSV();
  }
  
  process.exit(0);
});

// Start crawler
main().catch(console.error);
