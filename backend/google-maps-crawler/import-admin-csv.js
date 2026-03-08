import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Carrier Schema (simplified)
const carrierSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  companyName: { type: String, required: true },
  registrationNumber: String,
  phone: String,
  email: String,
  website: String,
  country: { type: String, enum: ['DE', 'NL', 'BE', 'FR', 'AT', 'PL', 'GB', 'SE', 'NO', 'DK'] },
  description: String,
  services: [String],
  operatingCountries: [String],
  location: {
    postalCode: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  schedules: {
    departureFromPoland: String,
    returnToPoland: String,
    baggageInfo: String
  },
  isPremium: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

const Carrier = mongoose.model('Carrier', carrierSchema);

// Parse country code
function parseCountryCode(country) {
  const map = {
    'Polska': 'PL',
    'Niemcy': 'DE',
    'Holandia': 'NL',
    'Belgia': 'BE',
    'Francja': 'FR',
    'Austria': 'AT',
    'Anglia': 'GB',
    'Norwegia': 'NO',
    'Dania': 'DK',
    'Szwecja': 'SE'
  };
  return map[country] || 'PL';
}

// Parse operating countries
function parseOperatingCountries(countriesStr) {
  if (!countriesStr) return ['PL', 'DE', 'NL', 'BE'];
  
  const countries = countriesStr.split(',').map(c => c.trim());
  const codes = countries.map(country => {
    const map = {
      'Polska': 'PL',
      'Niemcy': 'DE',
      'Holandia': 'NL',
      'Belgia': 'BE',
      'Francja': 'FR',
      'Austria': 'AT',
      'Anglia': 'GB',
      'Norwegia': 'NO',
      'Dania': 'DK',
      'Szwecja': 'SE',
      'Szwajcaria': 'CH',
      'Luksemburg': 'LU'
    };
    return map[country] || null;
  }).filter(Boolean);
  
  return codes.length > 0 ? codes : ['PL', 'DE', 'NL', 'BE'];
}

// Parse services
function parseServices(servicesStr) {
  if (!servicesStr) return ['transport'];
  
  const services = [];
  if (servicesStr.includes('Przewóz osób')) services.push('transport');
  if (servicesStr.includes('Paczki')) services.push('paczki');
  if (servicesStr.includes('Autokary')) services.push('autokary');
  
  return services.length > 0 ? services : ['transport'];
}

// Read CSV and parse
async function parseCSV(filePath) {
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', reject);
  });
}

// Create carrier document
function createCarrierData(row) {
  return {
    userId: null,
    companyName: row['Nazwa firmy'],
    registrationNumber: row['Numer rejestracyjny firmy'] || '',
    phone: row['Numer telefonu'] || '',
    email: row['Email'] || '',
    website: row['Strona WWW'] || '',
    country: parseCountryCode(row['Kraj działalności']),
    description: row['Opis firmy'] || `Firma transportowa z ${row['Miasto']}. Przewóz osób i paczek.`,
    services: parseServices(row['Oferowane usługi']),
    operatingCountries: parseOperatingCountries(row['Wybierz kraje, w których świadczysz usługi transportowe']),
    location: {
      postalCode: row['Kod pocztowy'] || '',
      city: row['Miasto'] || '',
      coordinates: {
        lat: null,
        lng: null
      }
    },
    schedules: {
      departureFromPoland: row['Dni wyjazdów do Polski'] || '',
      returnToPoland: row['Dni powrotów z Polski'] || '',
      baggageInfo: row['Informacje o bagażu'] || ''
    },
    isPremium: false,
    isFeatured: false,
    isActive: true,
    isVerified: false,
    rating: 0,
    reviewCount: 0
  };
}

// Check for duplicate
async function isDuplicate(companyName, phone) {
  if (!phone) return false;
  
  try {
    const existing = await Carrier.findOne({
      $or: [
        { companyName: { $regex: new RegExp(companyName.substring(0, 10), 'i') } },
        { phone: phone }
      ]
    }).maxTimeMS(5000);
    
    return !!existing;
  } catch (error) {
    console.log(`   ⚠️ Skipping duplicate check: ${error.message}`);
    return false; // If check fails, assume not duplicate
  }
}

// Main import function
async function main() {
  console.log('🚀 Starting CSV Import to MongoDB\n');
  
  try {
    // Connect to MongoDB with long timeouts
    console.log('📡 Connecting to MongoDB...');
    mongoose.set('bufferCommands', false);
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 120000, // 2 minutes
      socketTimeoutMS: 180000, // 3 minutes
      connectTimeoutMS: 120000,
      maxPoolSize: 1 // Single connection to avoid exhausting free tier
    });
    
    console.log('✅ Connected to MongoDB\n');
    
    // Read CSV
    console.log('📄 Reading CSV file...');
    const carriers = await parseCSV('carriers_for_import.csv');
    console.log(`✅ Found ${carriers.length} companies in CSV\n`);
    
    // Import in small batches
    const BATCH_SIZE = 5; // Very small batches for free tier
    const DELAY_BETWEEN_BATCHES = 10000; // 10 seconds between batches
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    console.log(`🔄 Importing in batches of ${BATCH_SIZE}...\n`);
    
    for (let i = 0; i < carriers.length; i += BATCH_SIZE) {
      const batch = carriers.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(carriers.length / BATCH_SIZE);
      
      console.log(`📦 Batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, carriers.length)}/${carriers.length})`);
      
      for (const row of batch) {
        const companyName = row['Nazwa firmy'];
        
        try {
          // Check duplicate
          const duplicate = await isDuplicate(companyName, row['Numer telefonu']);
          
          if (duplicate) {
            console.log(`   ⚠️ Skipping duplicate: ${companyName}`);
            skipped++;
            continue;
          }
          
          // Create carrier
          const carrierData = createCarrierData(row);
          await Carrier.create(carrierData);
          
          console.log(`   ✅ Imported: ${companyName}`);
          imported++;
          
          // Small delay between inserts
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.log(`   ❌ Error: ${companyName} - ${error.message}`);
          errors++;
        }
      }
      
      // Delay between batches
      if (i + BATCH_SIZE < carriers.length) {
        console.log(`   ⏳ Waiting ${DELAY_BETWEEN_BATCHES/1000}s before next batch...\n`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    // Final statistics
    console.log('\n======================================================================');
    console.log('📊 IMPORT STATISTICS');
    console.log('======================================================================');
    console.log(`📁 Total in CSV:        ${carriers.length}`);
    console.log(`✅ Imported (new):      ${imported}`);
    console.log(`⚠️  Duplicates skipped: ${skipped}`);
    console.log(`❌ Errors:              ${errors}`);
    console.log('======================================================================\n');
    
    if (imported > 0) {
      console.log('✅ Import completed successfully!\n');
    } else {
      console.log('⚠️ No new carriers imported.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Critical error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

main();
