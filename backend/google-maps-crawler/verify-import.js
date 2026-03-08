import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkImportedCarriers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Read CSV
    const csvCarriers = [];
    await new Promise((resolve) => {
      fs.createReadStream('carriers_format_admin.csv')
        .pipe(csv({ separator: ';' }))
        .on('data', (row) => csvCarriers.push(row['Nazwa firmy']))
        .on('end', resolve);
    });
    
    console.log(`\n📄 CSV contains: ${csvCarriers.length} companies`);
    
    // Check how many are in database
    let found = 0;
    let notFound = [];
    
    for (const companyName of csvCarriers) {
      // Escape special regex characters
      const escapedName = companyName.substring(0, 15).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const exists = await mongoose.connection.db.collection('carriers').findOne({
        companyName: { $regex: new RegExp(escapedName, 'i') }
      });
      
      if (exists) {
        found++;
      } else {
        notFound.push(companyName);
      }
    }
    
    console.log(`\n📊 RESULTS:`);
    console.log(`✅ Found in database: ${found}/${csvCarriers.length}`);
    console.log(`❌ Not found: ${notFound.length}`);
    
    if (notFound.length > 0 && notFound.length < 20) {
      console.log(`\n📋 Missing companies:`);
      notFound.forEach((name, i) => console.log(`   ${i+1}. ${name}`));
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkImportedCarriers();
