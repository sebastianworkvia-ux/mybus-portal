/**
 * SKRYPT POMOCNICZY - Znajdź duplikaty firm w bazie MongoDB
 * Użyj gdy w panelu weryfikacji masz dużo duplikatów
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Carrier from '../src/models/Carrier.js';

async function findDuplicates() {
  console.log('\n🔍 ZNAJDOWANIE DUPLIKATÓW W BAZIE DANYCH\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Połączono z MongoDB\n');
    
    // 1. Duplikaty po numerze telefonu (najbardziej wiarygodne)
    console.log('📞 Szukam duplikatów po numerze telefonu...\n');
    
    const phoneDuplicates = await Carrier.aggregate([
      { $match: { phone: { $exists: true, $ne: '', $ne: null } } },
      { $group: {
          _id: '$phone',
          count: { $sum: 1 },
          carriers: { $push: { id: '$_id', name: '$companyName', verified: '$isVerified' } }
        }
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    if (phoneDuplicates.length === 0) {
      console.log('✅ Brak duplikatów po telefonie\n');
    } else {
      console.log(`❌ Znaleziono ${phoneDuplicates.length} grup duplikatów (${phoneDuplicates.reduce((sum, d) => sum + d.count, 0)} firm)\n`);
      
      let totalDuplicates = 0;
      
      phoneDuplicates.forEach((dup, idx) => {
        console.log(`${idx + 1}. Telefon: ${dup._id}`);
        console.log(`   Duplikatów: ${dup.count}`);
        dup.carriers.forEach((c, i) => {
          const status = c.verified ? '✓ Zweryfikowana' : '⏳ Do weryfikacji';
          console.log(`   ${i + 1}) ${c.name.substring(0, 60)} - ${status}`);
        });
        console.log('');
        totalDuplicates += (dup.count - 1); // Pierwszy zachowujemy, reszta to duplikaty
      });
      
      console.log(`📊 Podsumowanie: ${totalDuplicates} firm do usunięcia\n`);
    }
    
    // 2. Duplikaty po nazwie (mniej wiarygodne, ale sprawdźmy)
    console.log('🏢 Szukam duplikatów po nazwie firmy...\n');
    
    const nameDuplicates = await Carrier.aggregate([
      { $match: { companyName: { $exists: true, $ne: '' } } },
      { $group: {
          _id: '$companyName',
          count: { $sum: 1 },
          carriers: { $push: { id: '$_id', phone: '$phone', verified: '$isVerified' } }
        }
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    if (nameDuplicates.length === 0) {
      console.log('✅ Brak duplikatów po nazwie\n');
    } else {
      console.log(`⚠️ Znaleziono ${nameDuplicates.length} grup duplikatów po nazwie\n`);
      
      nameDuplicates.slice(0, 10).forEach((dup, idx) => {
        console.log(`${idx + 1}. Nazwa: ${dup._id.substring(0, 60)}`);
        console.log(`   Duplikatów: ${dup.count}`);
        dup.carriers.slice(0, 3).forEach((c, i) => {
          const status = c.verified ? '✓ Zweryfikowana' : '⏳ Do weryfikacji';
          console.log(`   ${i + 1}) Tel: ${c.phone || 'brak'} - ${status}`);
        });
        console.log('');
      });
      
      if (nameDuplicates.length > 10) {
        console.log(`... i ${nameDuplicates.length - 10} więcej\n`);
      }
    }
    
    // 3. Statystyki ogólne
    console.log('═══════════════════════════════════════════════════\n');
    console.log('📊 STATYSTYKI:\n');
    
    const total = await Carrier.countDocuments();
    const verified = await Carrier.countDocuments({ isVerified: true });
    const unverified = await Carrier.countDocuments({ isVerified: false });
    const withLaweta = await Carrier.countDocuments({ services: 'laweta' });
    
    console.log(`Wszystkie firmy:        ${total}`);
    console.log(`Zweryfikowane:          ${verified}`);
    console.log(`Do weryfikacji:         ${unverified}`);
    console.log(`Z usługą 'laweta':      ${withLaweta}\n`);
    
    console.log('═══════════════════════════════════════════════════\n');
    console.log('💡 INSTRUKCJA USUWANIA DUPLIKATÓW:\n');
    console.log('1. Wejdź na panel weryfikacji: /admin/verify');
    console.log('2. Zaznacz duplikaty (checkboxy)');
    console.log('3. Kliknij "✗ Odrzuć zaznaczone"');
    console.log('4. Zachowaj tylko jedną firmę z każdej grupy duplikatów\n');
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Rozłączono z MongoDB\n');
  }
}

findDuplicates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
