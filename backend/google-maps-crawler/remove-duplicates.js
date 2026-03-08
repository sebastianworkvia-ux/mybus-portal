import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const carrierSchema = new mongoose.Schema({}, { strict: false });
const Carrier = mongoose.model('Carrier', carrierSchema);

// Normalize company name for comparison
function normalizeCompanyName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

async function removeDuplicates() {
  console.log('🔍 Starting duplicate detection and removal\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 90000
    });
    
    console.log('✅ Connected to MongoDB\n');
    
    // Get all carriers
    const carriers = await Carrier.find({}).lean();
    console.log(`📊 Found ${carriers.length} total carriers\n`);
    
    // Group by normalized name + city
    const groups = {};
    
    carriers.forEach(carrier => {
      const normalizedName = normalizeCompanyName(carrier.companyName || '');
      const city = (carrier.location?.city || '').toLowerCase().trim();
      const key = `${normalizedName}|${city}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(carrier);
    });
    
    // Find duplicates
    const duplicateGroups = Object.entries(groups)
      .filter(([key, carriers]) => carriers.length > 1)
      .map(([key, carriers]) => ({
        key,
        carriers: carriers.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt) // Keep oldest
        )
      }));
    
    console.log(`🔍 Found ${duplicateGroups.length} duplicate groups\n`);
    
    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicates found!\n');
      await mongoose.disconnect();
      return;
    }
    
    // Show duplicates
    let totalToRemove = 0;
    duplicateGroups.forEach((group, i) => {
      const [name, city] = group.key.split('|');
      console.log(`${i + 1}. "${group.carriers[0].companyName}" (${city || 'no city'})`);
      console.log(`   Duplicates: ${group.carriers.length}`);
      console.log(`   Will keep: ${group.carriers[0]._id} (oldest)`);
      console.log(`   Will remove: ${group.carriers.length - 1} duplicates\n`);
      totalToRemove += group.carriers.length - 1;
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total carriers: ${carriers.length}`);
    console.log(`   Duplicate groups: ${duplicateGroups.length}`);
    console.log(`   Carriers to remove: ${totalToRemove}\n`);
    
    // Ask for confirmation (in production you might want to automatically proceed)
    console.log('🗑️  Removing duplicates (keeping oldest entry in each group)...\n');
    
    let removed = 0;
    for (const group of duplicateGroups) {
      // Keep first (oldest), remove rest
      const toRemove = group.carriers.slice(1);
      
      for (const carrier of toRemove) {
        await Carrier.deleteOne({ _id: carrier._id });
        removed++;
        console.log(`   ✅ Removed: ${carrier.companyName} (${carrier._id})`);
      }
    }
    
    console.log(`\n✅ Removed ${removed} duplicate carriers\n`);
    
    // Final count
    const finalCount = await Carrier.countDocuments();
    console.log(`📊 Final count: ${finalCount} carriers (was ${carriers.length})\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

removeDuplicates();
