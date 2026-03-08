import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkCarriers() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const count = await mongoose.connection.db.collection('carriers').countDocuments();
    const sample = await mongoose.connection.db.collection('carriers').find().limit(5).toArray();
    
    console.log('\n📊 STATYSTYKI BAZY DANYCH');
    console.log('========================================');
    console.log(`✅ Liczba firm w bazie: ${count}`);
    console.log('========================================\n');
    
    if (sample.length > 0) {
      console.log('📋 Przykładowe firmy:\n');
      sample.forEach((carrier, i) => {
        console.log(`${i +1}. ${carrier.companyName}`);
        console.log(`   📞 ${carrier.phone || 'brak'}`);
        console.log(`   🌐 ${carrier.website || 'brak'}`);
        console.log(`   📍 ${carrier.location?.city || 'brak'}, ${carrier.country || 'brak'}`);
        console.log('');
      });
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCarriers();
