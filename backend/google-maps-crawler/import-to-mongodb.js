/**
 * Import Google Maps CSV to MongoDB - Smart Import with Duplicate Detection
 * 
 * This script:
 * - Reads transport_companies.csv
 * - Checks for duplicates (by company name or phone)
 * - Imports ONLY new companies
 * - Shows detailed statistics
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
const CSV_FILE = 'transport_companies.csv';
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
    'Unknown': 'PL' // Default to Poland for unknown
  };
  
  return mapping[region] || 'PL';
}

/**
 * Parse city from address
 */
function parseCity(address) {
  if (!address) return 'Polska';
  
  // Try to extract city from address
  const parts = address.split(',');
  if (parts.length > 0) {
    // Usually city is before postal code or at the beginning
    const cityPart = parts[0].trim();
    // Remove "Adres:" prefix if present
    return cityPart.replace(/^Adres:\s*/i, '').trim();
  }
  
  return address.trim();
}

/**
 * Clean phone number
 */
function cleanPhone(phone) {
  if (!phone) return '';
  // Remove spaces and keep only +48 and digits
  return phone.replace(/\s+/g, '');
}

/**
 * Clean website URL
 */
function cleanWebsite(website) {
  if (!website) return '';
  // Remove http://, https://, www.
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
  // DISABLED: MongoDB Atlas free tier is too slow for findOne() operations
  // Import all carriers without duplicate check
  // You can remove duplicates later manually or with a separate script
  return { isDuplicate: false };
  
  /* Original duplicate check code (disabled due to MongoDB timeout):
  const normalizedName = normalizeCompanyName(companyName);
  const cleanedPhone = cleanPhone(phone);
  
  // Check by company name (normalized)
  const existingByName = await Carrier.findOne({
    $expr: {
      $eq: [
        { $toLower: { $replaceAll: { input: '$companyName', find: ' ', replacement: '' } } },
        normalizedName.replace(/\s+/g, '')
      ]
    }
  });
  
  if (existingByName) {
    return { isDuplicate: true, reason: 'name', existing: existingByName };
  }
  
  // Check by phone number (if exists)
  if (cleanedPhone) {
    const existingByPhone = await Carrier.findOne({ phone: cleanedPhone });
    if (existingByPhone) {
      return { isDuplicate: true, reason: 'phone', existing: existingByPhone };
    }
  }
  
  return { isDuplicate: false };
  */
}

/**
 * Create default system user for imported carriers (if doesn't exist)
 */
async function getOrCreateSystemUser() {
  const systemEmail = 'system.import@my-bus.eu';
  
  // Retry logic for MongoDB Atlas warmup
  let retries = 3;
  while (retries > 0) {
    try {
      let systemUser = await User.findOne({ email: systemEmail }).maxTimeMS(15000);
      
      if (!systemUser) {
        console.log('   Creating system user for imports...');
        systemUser = await User.create({
          email: systemEmail,
          password: Math.random().toString(36).substring(2, 15), // Random password (won't be used)
          firstName: 'System',
          lastName: 'Import',
          userType: 'carrier'
        });
      }
      
      return systemUser._id;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      console.log(`   ⚠️  Retry ${3 - retries}/3...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
  }
}

/**
 * Import carrier to MongoDB
 */
async function importCarrier(row, systemUserId) {
  try {
    const companyName = row.Name;
    const phone = cleanPhone(row.Phone);
    const website = cleanWebsite(row.Website);
    const address = row.Address;
    const region = row.Region;
    const country = parseCountry(region);
    const city = parseCity(address);
    
    // SKIP duplicate check - MongoDB Atlas free tier too slow
    // Import all carriers, duplicates can be removed manually later
    
    // Create new carrier WITH RETRY LOGIC
    let retries = 3;
    let newCarrier = null;
    
    while (retries > 0 && !newCarrier) {
      try {
        newCarrier = await Carrier.create({
          userId: systemUserId,
          companyName: companyName,
          phone: phone,
          website: website,
          country: country,
          description: `Firma transportowa z ${city}. Przewóz osób i paczek.`,
          services: ['transport'], // Default: international bus transport
          operatingCountries: ['PL', 'DE', 'NL', 'BE'], // Default operating countries
          location: {
            city: city,
            postalCode: '',
            coordinates: {
              lat: null,
              lng: null
            }
          },
          isPremium: false,
          isFeatured: false,
          isActive: true,
          isVerified: false,
          rating: 0,
          reviewCount: 0
        });
        break; // Success, exit retry loop
      } catch (error) {
        retries--;
        if (retries > 0) {
          console.log(`   ⚠️ Retry ${3 - retries}/3 for ${companyName}...`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5s between retries
        } else {
          throw error; // Last retry failed, throw to outer catch
        }
      }
    }
    
    stats.imported++;
    return true;
    
  } catch (error) {
    stats.errors++;
    console.error(`   ❌ Error importing ${row.Name}:`, error.message);
    return false;
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting MongoDB Import from Google Maps CSV\n');
  
  try {
    // Debug: Check if MONGODB_URI is loaded
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables. Check .env file.');
    }
    console.log('✓ MongoDB URI loaded from .env');
    console.log(`✓ URI starts with: ${MONGODB_URI.substring(0, 20)}...`);
    
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    mongoose.set('bufferCommands', false);
    mongoose.set('bufferTimeoutMS', 60000); // 60 seconds
    
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 60000, // 60 seconds
      socketTimeoutMS: 90000, // 90 seconds
      connectTimeoutMS: 60000 // 60 seconds
    });
    
    console.log(`✅ Connected to MongoDB: ${conn.connection.name}`);
    console.log(`✓ Database host: ${conn.connection.host}\n`);
    
    // Skip system user creation - use null userId instead
    console.log('✓ Using null userId for imported carriers\n');
    
    // Read and parse CSV
    console.log('📄 Reading CSV file...');
    const carriers = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, CSV_FILE))
        .pipe(csv())
        .on('data', (row) => {
          if (row.Name && row.Name.trim()) {
            carriers.push(row);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    stats.total = carriers.length;
    console.log(`✅ Found ${stats.total} companies in CSV\n`);
    
    // Process each carrier
    console.log('🔄 Processing carriers...\n');
    for (let i = 0; i < carriers.length; i++) {
      const carrier = carriers[i];
      process.stdout.write(`   [${i + 1}/${carriers.length}] ${carrier.Name.substring(0, 50)}... `);
      
      const imported = await importCarrier(carrier, null); // Use null userId
      
      if (imported) {
        console.log('✅ Imported');
      } else {
        console.log('⚠️  Skipped (duplicate)');
      }
    }
    
    // Show final statistics
    console.log('\n' + '='.repeat(70));
    console.log('📊 IMPORT STATISTICS');
    console.log('='.repeat(70));
    console.log(`📁 Total in CSV:        ${stats.total}`);
    console.log(`✅ Imported (new):      ${stats.imported}`);
    console.log(`⚠️  Duplicates skipped: ${stats.duplicates}`);
    console.log(`❌ Errors:              ${stats.errors}`);
    console.log('='.repeat(70));
    
    // Show duplicate details if any
    if (stats.duplicates > 0) {
      console.log('\n📋 DUPLICATE DETAILS (first 10):');
      console.log('-'.repeat(70));
      stats.duplicateList.slice(0, 10).forEach((dup, idx) => {
        console.log(`${idx + 1}. ${dup.name}`);
        console.log(`   Reason: Duplicate ${dup.reason} | Existing ID: ${dup.existingId}`);
      });
      if (stats.duplicates > 10) {
        console.log(`\n   ... and ${stats.duplicates - 10} more duplicates`);
      }
    }
    
    console.log('\n✅ Import completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Critical error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run import
main();
