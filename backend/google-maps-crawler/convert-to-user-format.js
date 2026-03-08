import fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

const results = [];

// Parse city and postal code from address
function parseAddress(address) {
  // Pattern: "Adres: Ulica XX, 12-345 Miasto, Polska"
  const postalMatch = address.match(/(\d{2}-\d{3})/);
  const cityMatch = address.match(/\d{2}-\d{3}\s+([^,]+)/);
  
  return {
    postalCode: postalMatch ? postalMatch[1] : '',
    city: cityMatch ? cityMatch[1].trim() : ''
  };
}

// Parse country from region
function parseCountry(region) {
  const countryMap = {
    'Poland': 'Polska',
    'Germany': 'Niemcy',
    'Netherlands': 'Holandia',
    'Belgium': 'Belgia',
    'France': 'Francja',
    'Austria': 'Austria'
  };
  return countryMap[region] || 'Polska';
}

// Clean website URL
function cleanWebsite(website) {
  if (!website) return '';
  // Add https:// if missing
  if (!website.startsWith('http')) {
    return 'https://' + website;
  }
  return website;
}

console.log('📄 Reading transport_companies.csv...\n');

fs.createReadStream('transport_companies.csv')
  .pipe(csv())
  .on('data', (row) => {
    const { postalCode, city } = parseAddress(row.Address);
    const country = parseCountry(row.Region);
    const website = cleanWebsite(row.Website);
    
    results.push({
      'Nazwa firmy': row.Name,
      'Numer rejestracyjny firmy': '', // Brak w danych z crawlera
      'Kraj działalności': country,
      'Opis firmy': '', // Zostaw puste - użytkownik może wypełnić
      'Numer telefonu': row.Phone || '',
      'Email': '', // Brak w danych z crawlera
      'Strona WWW': website,
      'Kod pocztowy': postalCode,
      'Miasto': city,
      'Wybierz kraje, w których świadczysz usługi transportowe': 'Niemcy, Belgia, Holandia', // Default dla firm busy
      'Oferowane usługi': 'Przewóz osób, Paczki', // Default
      'Dni wyjazdów do Polski': '', // Brak w danych
      'Dni powrotów z Polski': '', // Brak w danych
      'Informacje o bagażu': '' // Brak w danych
    });
  })
  .on('end', async () => {
    console.log(`✅ Parsed ${results.length} companies\n`);
    console.log('💾 Creating carriers_format_admin.csv...\n');
    
    const csvWriter = createObjectCsvWriter({
      path: 'carriers_format_admin.csv',
      header: [
        { id: 'Nazwa firmy', title: 'Nazwa firmy' },
        { id: 'Numer rejestracyjny firmy', title: 'Numer rejestracyjny firmy' },
        { id: 'Kraj działalności', title: 'Kraj działalności' },
        { id: 'Opis firmy', title: 'Opis firmy' },
        { id: 'Numer telefonu', title: 'Numer telefonu' },
        { id: 'Email', title: 'Email' },
        { id: 'Strona WWW', title: 'Strona WWW' },
        { id: 'Kod pocztowy', title: 'Kod pocztowy' },
        { id: 'Miasto', title: 'Miasto' },
        { id: 'Wybierz kraje, w których świadczysz usługi transportowe', title: 'Wybierz kraje, w których świadczysz usługi transportowe' },
        { id: 'Oferowane usługi', title: 'Oferowane usługi' },
        { id: 'Dni wyjazdów do Polski', title: 'Dni wyjazdów do Polski' },
        { id: 'Dni powrotów z Polski', title: 'Dni powrotów z Polski' },
        { id: 'Informacje o bagażu', title: 'Informacje o bagażu' }
      ],
      fieldDelimiter: ';', // WAŻNE: Separator średnik jak w Twoim pliku
      encoding: 'utf8'
    });
    
    await csvWriter.writeRecords(results);
    
    console.log('✅ SUCCESS!\n');
    console.log(`📁 File created: carriers_format_admin.csv`);
    console.log(`📊 Total: ${results.length} companies`);
    console.log(`\n🎯 Format compatibility:`);
    console.log(`   ✅ Separator: semicolon (;)`);
    console.log(`   ✅ Columns: 14 (same as your example)`);
    console.log(`   ✅ Encoding: UTF-8`);
    console.log(`\n📝 Note: Some fields are empty (Email, Registration number, Baggage info)`);
    console.log(`   You can fill them manually or they will be optional in import.`);
  });
