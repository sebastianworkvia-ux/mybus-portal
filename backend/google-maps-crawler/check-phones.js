import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Carrier = mongoose.model('Carrier', new mongoose.Schema({}, { strict: false }));
await mongoose.connect(process.env.MONGODB_URI);

const dbCarriers = await Carrier.find({}).select('companyName phone').lean();
const dbPhones = new Set(dbCarriers.map(c => (c.phone||'').replace(/\s/g,'')).filter(Boolean));
const dbNames = new Set(dbCarriers.map(c => (c.companyName||'').toLowerCase().trim()).filter(Boolean));

console.log(`Baza: ${dbCarriers.length} firm, ${dbPhones.size} unikalnych tel`);

// Wczytaj v3 CSV
function splitCSV(line) {
  const r=[]; let cur='', q=false;
  for(const ch of line) {
    if(ch==='"') q=!q;
    else if(ch===';' && !q) { r.push(cur); cur=''; }
    else cur+=ch;
  }
  r.push(cur); return r;
}

const lines = fs.readFileSync('wyniki_crawler_v3.csv','utf8').split('\n');
let dupPhone=0, dupName=0, ok=0;
for(let i=1;i<lines.length;i++) {
  const line=lines[i].trim(); if(!line) continue;
  const cols=splitCSV(line);
  const name=(cols[0]||'').replace(/^"|"$/g,'').trim();
  const phone=(cols[3]||'').replace(/^"|"$/g,'').trim().replace(/\s/g,'');
  if(phone && dbPhones.has(phone)) { dupPhone++; continue; }
  if(dbNames.has(name.toLowerCase())) { dupName++; continue; }
  ok++;
}
console.log(`\nV3 CSV analiza:`);
console.log(`  Nowe (do dodania): ${ok}`);
console.log(`  Duplikaty wg tel: ${dupPhone}`);
console.log(`  Duplikaty wg nazwy: ${dupName}`);
console.log(`  Łącznie w v3: ${ok+dupPhone+dupName}`);

await mongoose.disconnect();
