/**
 * Import Laweta Companies (Car Towing Services) to MongoDB
 * 
 * This script:
 * - Reads laweta_companies.csv
 * - Maps data to Carrier model
 * - Sets services: ['laweta', 'transport-pojazdów', 'pomoc-drogowa']
 * - Sets subscriptionPlan: 'free'
 * - Imports to MongoDB with duplicate detection
 */

import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env (parent directory)
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Import Carrier and User models
import Carrier from '../src/models/Carrier.js';
import User from '../src/models/User.js';

// Configuration
const CSV_FILE = 'laweta_companies.csv';
const MONGODB_URI = process.env.MONGODB_URI;

// Statistics
const stats = {
  total: 0,
  duplicates: 0,
  imported: 0,
  errors: 0,
  duplicateList: []
};

/**
 * Parse region from CSV to country code
 */
function parseCountry(region) {
  const mapping = {
    'Poland': 'PL',
    'Germany': 'DE',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'France': 'FR',
    'Austria': 'AT',
    'Unknown': 'PL' // Default to Poland for laweta services
  };
  
  return mapping[region] || 'PL';
}

/**
 * Parse city from address (Polish cities extraction)
 */
function parseCity(address) {
  if (!address) return 'Polska';
  
  // Try to extract city from Polish address formats
  const parts = address.split(',');
  if (parts.length > 0) {
    // Usually city is in the first part
    let cityPart = parts[0].trim();
    
    // Remove common prefixes
    cityPart = cityPart.replace(/^Adres:\s*/i, '').trim();
    
    // If it looks like a postal code + city, extract city
    const postalMatch = cityPart.match(/^\d{2}-?\d{3}\s+(.+)$/);
    if (postalMatch) {
      return postalMatch[1].trim();
    }
    
    return cityPart;
  }
  
  return 'Polska';
}

/**
 * Clean phone number
 */
function cleanPhone(phone) {
  if (!phone) return '';
  // Keep only +48 and digits, remove spaces
  return phone.replace(/\s+/g, '');
}

/**
 * Clean website URL
 */
function cleanWebsite(website) {
  if (!website || website === 'N/A') return '';
  // Remove http://, https://, www., trailing slash
  return website.replace(/^(https?:\/\/)?(www\.)?/i, '').replace(/\/$/, '');
}

/**
 * Normalize company name for comparison
 */
function normalizeCompanyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if carrier already exists in database
 */
async function checkDuplicate(companyName, phone) {
  const cleanedPhone = cleanPhone(phone);
  
  // Check by phone number (most reliable)
  if (cleanedPhone) {
    try {
      const existingByPhone = await Carrier.findOne({ phone: cleanedPhone }).maxTimeMS(10000);
      if (existingByPhone) {
        return { isDuplicate: true, reason: 'phone', existing: existingByPhone };
      }
    } catch (error) {
      console.log(`   ⚠️ Timeout checking phone, skipping duplicate check`);
      return { isDuplicate: false };
    }
  }
  
  // Check by company name (normalized)
  try {
    const normalizedName = normalizeCompanyName(companyName);
    const existingByName = await Carrier.findOne({
      companyName: new RegExp(`^${normalizedName.replace(/\s+/g, '\\s*')}$`, 'i')
    }).maxTimeMS(10000);
    
    if (existingByName) {
      return { isDuplicate: true, reason: 'name', existing: existingByName };
    }
  } catch (error) {
    console.log(`   ⚠️ Timeout checking name, skipping duplicate check`);
    return { isDuplicate: false };
  }
  
  return { isDuplicate: false };
}

/**
 * Create default system user for imported carriers (if doesn't exist)
 */
async function getOrCreateSystemUser() {
  const systemEmail = 'system.laweta@my-bus.eu';
  
  // Extended retry logic for MongoDB Atlas free tier (can be slow)
  let retries = 5;
  while (retries > 0) {
    try {
      console.log(`   🔍 Searching for system user... (attempt ${6 - retries}/5)`);
      let systemUser = await User.findOne({ email: systemEmail }).maxTimeMS(30000);
      
      if (!systemUser) {
        console.log('   📝 Creating system user for laweta imports...');
        systemUser = await User.create({
          email: systemEmail,
          password: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), // Random password
          firstName: 'System',
          lastName: 'Laweta Import',
          userType: 'carrier'
        });
        console.log('   ✅ System user created');
      } else {
        console.log('   ✅ System user found');
      }
      
      return systemUser._id;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('   ❌ Failed to create/fetch system user:', error.message);
        throw error;
      }
      console.log(`   ⚠️ Retry in 5 seconds... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between retries
    }
  }
}

/**
 * Import carrier to MongoDB
 */
async function importCarrier(row) {
  try {
    const companyName = row['Company Name'];
    const phone = cleanPhone(row.Phone);
    const website = cleanWebsite(row.Website);
    const address = row.Address;
    const region = row.Region;
    const country = parseCountry(region);
    const city = parseCity(address);
    
    if (!companyName) {
      stats.errors++;
      console.log(`   ⏭️ Skipping row with no company name`);
      return false;
    }
    
    // Check for duplicates
    const dupCheck = await checkDuplicate(companyName, phone);
    if (dupCheck.isDuplicate) {
      stats.duplicates++;
      stats.duplicateList.push({
        name: companyName,
        phone: phone,
        reason: dupCheck.reason
      });
      console.log(`   ⏭️ DUPLICATE: ${companyName.substring(0, 50)} (${dupCheck.reason})`);
      return false;
    }
    
    // Generate description for laweta service
    const description = `Firma świadcząca usługi lawety i pomocy drogowej. ${city}. Holowanie pojazdów, transport samochodów, pomoc drogowa 24h.`;
    
    // Create new carrier WITH RETRY LOGIC
    let retries = 3;
    let newCarrier = null;
    
    while (retries > 0 && !newCarrier) {
      try {
        newCarrier = await Carrier.create({
          // userId is optional (required: false in model), can be linked later
          companyName: companyName,
          phone: phone,
          website: website || '',
          country: country,
          description: description,
          services: ['laweta', 'transport-rzeczy'], // Valid enum values for laweta services
          operatingCountries: ['PL', 'DE', 'NL', 'BE', 'FR', 'AT'], // International towing
          location: {
            city: city,
            postalCode: '',
            coordinates: {
              lat: null,
              lng: null
            }
          },
          subscriptionPlan: 'free', // All imported carriers are free tier
          isPremium: false,
          isActive: true,
          isVerified: false,
          rating: 0,
          reviewCount: 0
        });
        
        console.log(`   ✅ ${companyName.substring(0, 50)}... (${city}, ${country})`);
        stats.imported++;
        return true;
        
      } catch (error) {
        retries--;
        if (retries > 0) {
          console.log(`   ⚠️ Retry ${3 - retries}/3 for ${companyName.substring(0, 40)}...`);
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3s between retries
        } else {
          throw error; // Last retry failed
        }
      }
    }
    
  } catch (error) {
    stats.errors++;
    console.error(`   ❌ Error importing ${row['Company Name']?.substring(0, 40)}:`, error.message);
    return false;
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('\n🚛 LAWETA COMPANIES IMPORT TO MONGODB\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Check if CSV file exists
  const csvPath = path.join(__dirname, CSV_FILE);
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${CSV_FILE}`);
    process.exit(1);
  }
  
  // Connect to MongoDB
  console.log('🔌 Connecting to MongoDB Atlas...');
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
    });
    console.log('✅ Connected to MongoDB\n');
    console.log('⏳ Warming up connection (Atlas free tier can be slow)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Ready to import\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
  
  // Get or create system user
  console.log('👤 Getting system user for imports...');
  console.log('⏭️ SKIPPING user creation (importing without userId - can be linked later)\n');
  
  // Read and process CSV
  console.log(`📂 Reading CSV: ${CSV_FILE}\n`);
  console.log('───────────────────────────────────────────────────\n');
  
  const carriers = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        carriers.push(row);
        stats.total++;
      })
      .on('end', async () => {
        console.log(`📊 Total rows in CSV: ${stats.total}\n`);
        console.log('🔄 Starting import (with duplicate detection)...\n');
        
        // Import carriers one by one (to handle duplicates properly)
        for (let i = 0; i < carriers.length; i++) {
          const carrier = carriers[i];
          process.stdout.write(`[${i + 1}/${carriers.length}] `);
          await importCarrier(carrier);
          
          // Small delay to avoid MongoDB rate limits
          if ((i + 1) % 20 === 0) {
            console.log('\n⏸️ Pausing 5 seconds (rate limit)...\n');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
        
        console.log('\n───────────────────────────────────────────────────\n');
        console.log('✅ IMPORT FINISHED\n');
        console.log(`📊 Statistics:`);
        console.log(`   Total rows:      ${stats.total}`);
        console.log(`   Imported:        ${stats.imported} ✅`);
        console.log(`   Duplicates:      ${stats.duplicates} ⏭️`);
        console.log(`   Errors:          ${stats.errors} ❌`);
        
        if (stats.duplicateList.length > 0 && stats.duplicateList.length <= 20) {
          console.log('\n🔍 Duplicate companies (first 20):');
          stats.duplicateList.slice(0, 20).forEach((dup) => {
            console.log(`   - ${dup.name.substring(0, 60)} (${dup.reason})`);
          });
        }
        
        console.log('\n═══════════════════════════════════════════════════\n');
        
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed\n');
        resolve();
      })
      .on('error', (error) => {
        console.error('❌ CSV reading error:', error.message);
        reject(error);
      });
  });
}

// Run import
main()
  .then(() => {
    console.log('✅ Import completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
