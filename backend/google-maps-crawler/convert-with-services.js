import fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

const results = [];

// Detect services from company name and description
function detectServices(companyName) {
  const name = companyName.toLowerCase();
  const services = [];
  
  // Przewóz osób / busy
  if (name.match(/busy|przewóz osób|transport pasażerski|przewozy/)) {
    services.push('Przewóz osób');
  }
  
  // Paczki
  if (name.match(/paczk|pack|kurier|cargo|przesyłk/)) {
    services.push('Paczki');
  }
  
  // Transfery lotniskowe - rozszerzone wykrywanie
  if (name.match(/lotnisk|airport|transfer.*lotnisk|lotnisk.*transfer|taxi.*lotnisk|lotnisko|port lotniczy|modlin|chopin|okęcie|balice|gdańsk airport|waw|gdn|wro|kraków airport|katowice airport|poznań airport|rzeszów airport/)) {
    services.push('Transfery lotniskowe');
  }
  
  // Autokary / Wycieczki
  if (name.match(/autokar|wycieczk|tourist|turyst|coach/)) {
    services.push('Wycieczki autokarowe');
  }
  
  // Lawety
  if (name.match(/lawet|pomoc drogowa|holowanie|tow|transport pojazd|transport samochodów/)) {
    services.push('Lawety');
  }
  
  // Transport zwierząt (ogólny)
  if (name.match(/zwierzę|zwierząt|pet|animal/)) {
    services.push('Transport zwierząt');
  }
  
  // Transport koni (specjalistyczny)
  if (name.match(/koń|koni|horse|equi/)) {
    services.push('Transport koni');
  }
  
  // Przeprowadzki i transport mebli
  if (name.match(/przeprowadzk|moving|relocation|przenosi|mebl|furniture/)) {
    services.push('Przeprowadzki');
  }
  
  // Transport medyczny
  if (name.match(/medyczn|medical|karetk|ambulan|sanitarn/)) {
    services.push('Transport medyczny');
  }
  
  // Transport chłodniczy
  if (name.match(/chłodni|refrig|mrożon|frozen|chłodnia/)) {
    services.push('Transport chłodniczy');
  }
  
  // Transport specjalistyczny (ciężki, ponadgabarytowy, ADR)
  if (name.match(/ponadgabary|oversized|ciężki|heavy|adr|niebezpieczn|hazmat|dangerous/)) {
    services.push('Transport specjalistyczny');
  }
  
  // Transport ekspresowy
  if (name.match(/ekspress|express|szybki|fast|urgent|pilny/)) {
    services.push('Transport ekspresowy');
  }
  
  // Przejazdy służbowe  
  if (name.match(/pracownik|służbowy|biznes|business|corporate/)) {
    services.push('Przejazdy służbowe');
  }
  
  // Default: Przewóz osób jeśli nic nie wykryto
  if (services.length === 0) {
    services.push('Przewóz osób', 'Paczki');
  }
  
  return services.join(', ');
}

// Detect operating countries from company name
function detectOperatingCountries(companyName) {
  const name = companyName.toLowerCase();
  const countries = new Set(['Polska']); // Always include Poland
  
  if (name.match(/niemiec|germany|deutsch/)) countries.add('Niemcy');
  if (name.match(/holand|netherlands|nederland/)) countries.add('Holandia');
  if (name.match(/belg|belgium/)) countries.add('Belgia');
  if (name.match(/franc|france/)) countries.add('Francja');
  if (name.match(/austria|österreich|austrii/)) countries.add('Austria');
  if (name.match(/dani|denmark/)) countries.add('Dania');
  if (name.match(/norwegi|norway/)) countries.add('Norwegia');
  if (name.match(/szwecj|sweden/)) countries.add('Szwecja');
  if (name.match(/szwajcar|switzerland|swiss/)) countries.add('Szwajcaria');
  if (name.match(/luksemburg|luxembourg/)) countries.add('Luksemburg');
  if (name.match(/angl|uk|england|britain/)) countries.add('Anglia');
  if (name.match(/włoch|italy/)) countries.add('Włochy');
  if (name.match(/hiszpan|spain/)) countries.add('Hiszpania');
  if (name.match(/europ/)) {
    countries.add('Niemcy');
    countries.add('Holandia');
    countries.add('Belgia');
  }
  
  // Default countries for transport companies
  if (countries.size === 1) {
    countries.add('Niemcy');
    countries.add('Holandia');
    countries.add('Belgia');
  }
  
  return Array.from(countries).join(', ');
}

// Parse address details
function parseAddress(address) {
  const postalMatch = address.match(/(\d{2}-\d{3})/);
  const cityMatch = address.match(/\d{2}-\d{3}\s+([^,]+)/);
  
  return {
    postalCode: postalMatch ? postalMatch[1] : '',
    city: cityMatch ? cityMatch[1].trim() : ''
  };
}

// Parse country
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
  if (!website.startsWith('http')) {
    return 'https://' + website;
  }
  return website;
}

console.log('📄 Reading transport_companies_full.csv...\n');

fs.createReadStream('transport_companies_full.csv')
  .pipe(csv())
  .on('data', (row) => {
    const { postalCode, city } = parseAddress(row.Address);
    const country = parseCountry(row.Region);
    const website = cleanWebsite(row.Website);
    const services = detectServices(row.Name);
    const operatingCountries = detectOperatingCountries(row.Name);
    
    results.push({
      'Nazwa firmy': row.Name,
      'Numer rejestracyjny firmy': '',
      'Kraj działalności': country,
      'Opis firmy': '', // Będzie automatycznie wygenerowany przy imporcie
      'Numer telefonu': row.Phone || '',
      'Email': '',
      'Strona WWW': website,
      'Kod pocztowy': postalCode,
      'Miasto': city,
      'Wybierz kraje, w których świadczysz usługi transportowe': operatingCountries,
      'Oferowane usługi': services,
      'Dni wyjazdów do Polski': '',
      'Dni powrotów z Polski': '',
      'Informacje o bagażu': ''
    });
  })
  .on('end', async () => {
    console.log(`✅ Parsed ${results.length} companies\n`);
    
    // Show service statistics
    const serviceStats = {};
    results.forEach(r => {
      const services = r['Oferowane usługi'].split(', ');
      services.forEach(s => {
        serviceStats[s] = (serviceStats[s] || 0) + 1;
      });
    });
    
    console.log('📊 Services detected:');
    Object.entries(serviceStats).forEach(([service, count]) => {
      console.log(`   ${service}: ${count} companies`);
    });
    console.log('');
    
    console.log('💾 Creating carriers_for_import.csv...\n');
    
    const csvWriter = createObjectCsvWriter({
      path: 'carriers_for_import.csv',
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
      fieldDelimiter: ';',
      encoding: 'utf8'
    });
    
    await csvWriter.writeRecords(results);
    
    console.log('✅ SUCCESS!\n');
    console.log(`📁 File created: carriers_for_import.csv`);
    console.log(`📊 Total: ${results.length} companies`);
    console.log(`\n🎯 Ready for import with intelligent service detection!`);
  });
