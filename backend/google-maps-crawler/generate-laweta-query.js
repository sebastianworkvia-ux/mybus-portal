/**
 * Wyciągnij numery telefonów z CSV i wygeneruj MongoDB query
 */

import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = path.resolve(__dirname, 'carriers_format_admin.csv');

// Clean phone number
function cleanPhone(phone) {
  if (!phone) return '';
  return phone.replace(/\s+/g, '');
}

async function generateMongoQuery() {
  console.log('\n📋 Generuję MongoDB query na podstawie CSV...\n');
  
  const phonesFromCSV = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE, 'latin1')
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        const phone = cleanPhone(row['Numer telefonu']);
        if (phone) {
          phonesFromCSV.push(phone);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  const uniquePhones = [...new Set(phonesFromCSV)];
  console.log(`Znaleziono ${uniquePhones.length} unikalnych numerów telefonów.\n`);
  
  // Wygeneruj wszystkie warianty (z +48 i bez)
  const allPhoneVariants = [];
  for (const phone of uniquePhones) {
    allPhoneVariants.push(phone);
    // Dodaj wariant z +48
    if (!phone.startsWith('+48') && phone.startsWith('48')) {
      allPhoneVariants.push('+48' + phone.substring(2));
    }
    // Dodaj wariant bez +48
    if (phone.startsWith('+48')) {
      allPhoneVariants.push(phone.substring(1));
    }
  }
  
  const uniqueVariants = [...new Set(allPhoneVariants)];
  
  console.log('═════════════════════════════════════════════════════════════\n');
  console.log('INSTRUKCJA:\n');
  console.log('1. Wejdź na https://cloud.mongodb.com');
  console.log('2. Wybierz swoją bazę danych (przewoznicy)');
  console.log('3. Kolekcja: carriers');
  console.log('4. Zakładka: "Browse Collections"');
  console.log('5. Kliknij "..." → "Open MongoDB Shell"');
  console.log('6. Wklej poniższą komendę:\n');
  console.log('═════════════════════════════════════════════════════════════\n\n');
  
  // Generuj MongoDB query
  const query = `db.carriers.updateMany(
  { 
    phone: { $in: ${JSON.stringify(uniqueVariants, null, 2)} }
  },
  { 
    $addToSet: { services: "laweta" }
  }
)`;
  
  console.log(query);
  console.log('\n\n═════════════════════════════════════════════════════════════\n');
  console.log('Ta komenda:');
  console.log('- Znajdzie wszystkie firmy o tych numerach telefonu');
  console.log('- Doda im tag "laweta" (jeśli jeszcze nie mają)');
  console.log('- $addToSet zapewnia że nie będzie duplikatów\n');
  console.log('Po wykonaniu sprawdź ile firm zaktualizowano!\n');
  console.log('═════════════════════════════════════════════════════════════\n');
  
  // Zapisz do pliku
  const outputFile = path.join(__dirname, 'MONGODB_ADD_LAWETA_QUERY.txt');
  fs.writeFileSync(outputFile, query);
  console.log(`✅ Query zapisana do: ${outputFile}\n`);
}

generateMongoQuery().catch(console.error);
