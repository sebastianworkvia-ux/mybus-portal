import fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapowanie Region → Kraj
const REGION_TO_COUNTRY = {
  'Poland': 'Polska',
  'Germany': 'Niemcy',
  'Netherlands': 'Holandia',
  'Belgium': 'Belgia',
  'France': 'Francja',
  'Austria': 'Austria',
  'Unknown': 'Polska' // Domyślnie Polska dla unknown
};

// Parse city from address
function parseCity(address) {
  if (!address) return '';
  const parts = address.split(',');
  if (parts.length > 0) {
    return parts[0].trim().replace(/^Adres:\s*/i, '').trim();
  }
  return '';
}

// Clean phone
function cleanPhone(phone) {
  if (!phone) return '';
  return phone.replace(/\s+/g, '');
}

// Clean website
function cleanWebsite(website) {
  if (!website || website === 'N/A') return '';
  return website.replace(/^(https?:\/\/)?(www\.)?/i, '').replace(/\/$/, '');
}

console.log('🔄 Converting laweta_companies.csv to admin panel format...\n');

const inputFile = path.join(__dirname, 'laweta_companies.csv');
const outputFile = path.join(__dirname, 'carriers_format_admin.csv');

const results = [];

fs.createReadStream(inputFile)
  .pipe(csv())
  .on('data', (row) => {
    const companyName = row['Company Name'];
    const phone = cleanPhone(row.Phone);
    const website = cleanWebsite(row.Website);
    const region = row.Region;
    const address = row.Address;
    
    const country = REGION_TO_COUNTRY[region] || 'Polska';
    const city = parseCity(address) || 'Polska';
    
    // Format dla panelu admina
    const formatted = {
      'Nazwa firmy': companyName,
      'Numer rejestracyjny firmy': '',
      'Kraj działalności': country,
      'Numer telefonu': phone,
      'Email': '',
      'Strona WWW': website,
      'Opis firmy': `Firma świadcząca usługi lawety i pomocy drogowej. ${city}. Holowanie pojazdów, transport samochodów, pomoc drogowa 24h.`,
      'Kod pocztowy': '',
      'Miasto': city,
      'Wybierz kraje, w których świadczysz usługi transportowe': 'PL,DE,NL,BE,FR,AT',
      'Oferowane usługi': 'laweta',
      'Dni wyjazdów do Polski': '',
      'Dni powrotów z Polski': '',
      'Informacje o bagażu': ''
    };
    
    results.push(formatted);
  })
  .on('end', async () => {
    console.log(`📊 Przekonwertowano ${results.length} firm\n`);
    
    // Zapisz do CSV z separatorem średnik (tak jak oczekuje import)
    const csvWriter = createObjectCsvWriter({
      path: outputFile,
      header: [
        { id: 'Nazwa firmy', title: 'Nazwa firmy' },
        { id: 'Numer rejestracyjny firmy', title: 'Numer rejestracyjny firmy' },
        { id: 'Kraj działalności', title: 'Kraj działalności' },
        { id: 'Numer telefonu', title: 'Numer telefonu' },
        { id: 'Email', title: 'Email' },
        { id: 'Strona WWW', title: 'Strona WWW' },
        { id: 'Opis firmy', title: 'Opis firmy' },
        { id: 'Kod pocztowy', title: 'Kod pocztowy' },
        { id: 'Miasto', title: 'Miasto' },
        { id: 'Wybierz kraje, w których świadczysz usługi transportowe', title: 'Wybierz kraje, w których świadczysz usługi transportowe' },
        { id: 'Oferowane usługi', title: 'Oferowane usługi' },
        { id: 'Dni wyjazdów do Polski', title: 'Dni wyjazdów do Polski' },
        { id: 'Dni powrotów z Polski', title: 'Dni powrotów z Polski' },
        { id: 'Informacje o bagażu', title: 'Informacje o bagażu' }
      ],
      fieldDelimiter: ';',
      encoding: 'utf8',
      alwaysQuote: true
    });
    
    await csvWriter.writeRecords(results);
    
    // Teraz przekonwertuj do Windows-1250 (polskie znaki)
    const iconv = await import('iconv-lite');
    const utf8Content = fs.readFileSync(outputFile, 'utf8');
    const win1250Content = iconv.default.encode(utf8Content, 'windows-1250');
    fs.writeFileSync(outputFile, win1250Content);
    
    console.log('✅ Konwersja zakończona!\n');
    console.log(`📁 Nowy plik: ${outputFile}\n`);
    console.log('📋 Format zgodny z panelem admina:');
    console.log('   - Separator: średnik (;)');
    console.log('   - Encoding: UTF-8');
    console.log('   - Tag usługi: "laweta"');
    console.log('   - Kraje: PL,DE,NL,BE,FR,AT\n');
    console.log('Możesz teraz zaimportować ten plik przez panel admina!');
  })
  .on('error', (error) => {
    console.error('❌ Błąd:', error);
  });
