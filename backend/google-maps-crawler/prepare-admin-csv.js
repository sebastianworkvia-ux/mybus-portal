const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const results = [];

// Parse country from region
function parseCountry(region) {
  const countryMap = {
    'Poland': 'PL',
    'Germany': 'DE',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'France': 'FR',
    'Austria': 'AT'
  };
  return countryMap[region] || 'PL';
}

// Extract city from address
function parseCity(address) {
  // Pattern: "Adres: Ulica XX, 12-345 Miasto, Polska"
  const match = address.match(/\d{2}-\d{3}\s+([^,]+)/);
  if (match) return match[1].trim();
  
  // Fallback: last part before "Polska"
  const parts = address.split(',');
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim().replace(/^\d{2}-\d{3}\s*/, '');
  }
  
  return '';
}

// Clean website
function cleanWebsite(website) {
  if (!website) return '';
  return website.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
}

console.log('📄 Reading transport_companies.csv...\n');

fs.createReadStream('transport_companies.csv')
  .pipe(csv())
  .on('data', (row) => {
    const city = parseCity(row.Address);
    const country = parseCountry(row.Region);
    
    results.push({
      companyName: row.Name,
      phone: row.Phone || '',
      website: cleanWebsite(row.Website),
      country: country,
      city: city,
      services: 'transport',
      operatingCountries: 'PL,DE,NL,BE',
      description: `Firma transportowa z ${city || 'Polski'}. Przewóz osób i paczek.`,
      isActive: 'true',
      isPremium: 'false',
      isVerified: 'false'
    });
  })
  .on('end', async () => {
    console.log(`✅ Parsed ${results.length} companies\n`);
    console.log('💾 Creating carriers_import_ready.csv...\n');
    
    const csvWriter = createObjectCsvWriter({
      path: 'carriers_import_ready.csv',
      header: [
        { id: 'companyName', title: 'companyName' },
        { id: 'phone', title: 'phone' },
        { id: 'website', title: 'website' },
        { id: 'country', title: 'country' },
        { id: 'city', title: 'city' },
        { id: 'services', title: 'services' },
        { id: 'operatingCountries', title: 'operatingCountries' },
        { id: 'description', title: 'description' },
        { id: 'isActive', title: 'isActive' },
        { id: 'isPremium', title: 'isPremium' },
        { id: 'isVerified', title: 'isVerified' }
      ]
    });
    
    await csvWriter.writeRecords(results);
    
    console.log('✅ SUCCESS!\n');
    console.log(`📁 File created: carriers_import_ready.csv`);
    console.log(`📊 Total: ${results.length} companies`);
    console.log(`\n🎯 Ready to import in admin panel!`);
  });
