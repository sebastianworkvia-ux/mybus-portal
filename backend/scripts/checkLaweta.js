import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Carrier from '../src/models/Carrier.js';

async function checkLaweta() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const lawetaCarriers = await Carrier.find({ services: 'laweta' });
    
    console.log('\n🚗 Firmy z usługą LAWETA w bazie:\n');
    console.log(`Łącznie: ${lawetaCarriers.length} firm\n`);
    
    if (lawetaCarriers.length > 0) {
      console.log('Pierwsze 10 firm:');
      lawetaCarriers.slice(0, 10).forEach((c, i) => {
        console.log(`${i + 1}. ${c.companyName}`);
        console.log(`   Tel: ${c.phone || 'brak'}`);
        console.log(`   Services: ${c.services.join(', ')}`);
        console.log(`   Verified: ${c.isVerified ? '✓' : '✗'}`);
        console.log('');
      });
    } else {
      console.log('❌ BRAK firm z tagiem "laweta"!');
      console.log('\nProblem: Import CSV prawdopodobnie się nie udał lub duplikaty zostały pominięte.\n');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Błąd:', error);
    process.exit(1);
  }
}

checkLaweta();
