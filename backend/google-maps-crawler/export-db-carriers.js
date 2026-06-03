/**
 * Eksportuje wszystkie firmy z MongoDB do CSV (do dedup w crawlerze)
 * Uruchomienie: node export-db-carriers.js
 */

import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const OUTPUT_FILE = path.join(__dirname, 'db_carriers_export.csv');

const carrierSchema = new mongoose.Schema({
  companyName: String,
  phone: String,
}, { strict: false });

const Carrier = mongoose.model('Carrier', carrierSchema);

async function main() {
  console.log('🔌 Łączenie z MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Połączono');

  const carriers = await Carrier.find({}, 'companyName phone').lean();
  console.log(`📦 Znaleziono ${carriers.length} firm w bazie`);

  // Zapisz jako CSV – ten sam format co inne pliki (kolumna 0: nazwa, kolumna 3: telefon)
  const lines = ['"Nazwa firmy";"Numer rejestracyjny firmy";"Kraj działalności";"Numer telefonu"'];
  for (const c of carriers) {
    const name = (c.companyName || '').replace(/"/g, '""');
    const phone = (c.phone || '').replace(/"/g, '""');
    lines.push(`"${name}";"";"";"${phone}"`);
  }

  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');
  console.log(`💾 Zapisano do: ${OUTPUT_FILE}`);
  console.log(`📊 ${carriers.length} rekordów`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
