import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Carrier Schema
const carrierSchema = new mongoose.Schema({
  companyName: String,
  services: [String],
}, { strict: false });

const Carrier = mongoose.model('Carrier', carrierSchema);

async function fixAirportServices() {
  try {
    console.log('\n🔧 Naprawianie usług transferów lotniskowych...\n');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Połączono z MongoDB\n');
    
    // Znajdź firmy z słowami kluczowymi lotniskowych w nazwie
    const airportKeywords = /lotnisk|airport|transfer.*lotnisk|taxi.*lotnisk|modlin|chopin|okęcie|balice|waw|gdn|wro|port lotniczy/i;
    
    const carriers = await Carrier.find({
      companyName: { $regex: airportKeywords }
    });
    
    console.log(`📋 Znaleziono ${carriers.length} firm z słowami kluczowymi lotnisk\n`);
    
    let updated = 0;
    let alreadyHave = 0;
    
    for (const carrier of carriers) {
      const hasAirportService = carrier.services && carrier.services.includes('Transfery lotniskowe');
      
      if (!hasAirportService) {
        console.log(`   ✏️  ${carrier.companyName}`);
        console.log(`      Dodaję: Transfery lotniskowe`);
        
        // Dodaj usługę
        if (!carrier.services) carrier.services = [];
        carrier.services.push('Transfery lotniskowe');
        
        await carrier.save();
        updated++;
      } else {
        alreadyHave++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PODSUMOWANIE');
    console.log('='.repeat(60));
    console.log(`📋 Sprawdzono:           ${carriers.length}`);
    console.log(`✅ Zaktualizowano:       ${updated}`);
    console.log(`✓  Już miały usługę:    ${alreadyHave}`);
    console.log('='.repeat(60) + '\n');
    
    await mongoose.disconnect();
    console.log('✅ Zakończono\n');
    
  } catch (error) {
    console.error('❌ Błąd:', error);
    process.exit(1);
  }
}

fixAirportServices();
