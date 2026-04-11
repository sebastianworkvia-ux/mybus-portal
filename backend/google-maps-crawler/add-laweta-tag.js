/**
 * Dodaj tag 'laweta' do istniejących firm (po numerze telefonu z CSV)
 */

import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Carrier from '../src/models/Carrier.js';

const CSV_FILE = path.resolve(__dirname, 'carriers_format_admin.csv');

// Clean phone number
function cleanPhone(phone) {
  if (!phone) return '';
  return phone.replace(/\s+/g, '').replace(/^(\+48)?/, '+48');
}

async function addLawetaTag() {
  console.log('\n🔧 DODAWANIE TAGU LAWETA DO ISTNIEJĄCYCH FIRM\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    console.log('✅ Połączono z MongoDB\n');
    console.log('⏳ Warming up connection...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Wczytaj numery telefonów z CSV
    const phonesFromCSV = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE, 'latin1') // Windows-1250 encoding
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
    
    console.log(`📋 Wczytano ${phonesFromCSV.length} numerów z CSV\n`);
    
    // Znajdź unikalne telefony
    const uniquePhones = [...new Set(phonesFromCSV)];
    console.log(`📞 Unikalne numery: ${uniquePhones.length}\n`);
    
    // OPTYMALIZACJA: Znajdź wszystkie firmy jednym zapytaniem (batch)
    console.log('🔍 Szukam firm w bazie (batch query)...\n');
    
    // Przygotuj wszystkie warianty telefonów
    const allPhoneVariants = [];
    for (const phone of uniquePhones) {
      allPhoneVariants.push(phone);
      allPhoneVariants.push(phone.replace(/^\+48/, '48'));
      allPhoneVariants.push(phone.replace(/^48/, '+48'));
    }
    
    // Jedna query dla wszystkich (z retry)
    let carriersInDb = [];
    let retries = 3;
    
    while (retries > 0) {
      try {
        console.log(`   Próba ${4 - retries}/3...`);
        carriersInDb = await Carrier.find({ 
          phone: { $in: [...new Set(allPhoneVariants)] }
        }).maxTimeMS(60000);
        break; // Success
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        console.log(`   ⚠️  Timeout, czekam 5s przed kolejną próbą...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log(`✅ Znaleziono ${carriersInDb.length} firm w bazie\n`);
    
    // Aktualizuj firmy
    let updated = 0;
    let alreadyHas = 0;
    
    console.log('🔄 Aktualizuję firmy...\n');
    
    for (const carrier of carriersInDb) {
      // Sprawdź czy już ma tag 'laweta'
      if (carrier.services.includes('laweta')) {
        alreadyHas++;
        console.log(`  ⏭️  ${carrier.companyName.substring(0, 50)} - już ma tag laweta`);
      } else {
        // Dodaj tag 'laweta'
        carrier.services.push('laweta');
        await carrier.save();
        updated++;
        console.log(`  ✅ ${carrier.companyName.substring(0, 50)} - dodano tag laweta`);
      }
    }
    
    const notFound = uniquePhones.length - carriersInDb.length;
    
    console.log('\n═══════════════════════════════════════════════════\n');
    console.log('📊 PODSUMOWANIE:\n');
    console.log(`Zaktualizowano:        ${updated} firm ✅`);
    console.log(`Już miało tag:         ${alreadyHas} firm ⏭️`);
    console.log(`Nie znaleziono:        ${notFound} firm (nowe)`);
    console.log(`\nRazem firm z lawetą:   ${updated + alreadyHas} firm`);
    console.log('\n═══════════════════════════════════════════════════\n');
    
    // Weryfikacja
    const totalLaweta = await Carrier.countDocuments({ services: 'laweta' });
    console.log(`✅ Weryfikacja: ${totalLaweta} firm ma tag 'laweta' w bazie\n`);
    
    await mongoose.connection.close();
    console.log('🔌 Rozłączono z MongoDB\n');
    
  } catch (error) {
    console.error('❌ Błąd:', error);
    process.exit(1);
  }
}

addLawetaTag()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
