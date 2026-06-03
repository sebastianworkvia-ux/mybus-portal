import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Carrier = mongoose.model('Carrier', new mongoose.Schema({}, { strict: false }));
await mongoose.connect(process.env.MONGODB_URI);

const all = await Carrier.find({}).select('_id companyName phone').lean();
console.log(`Łącznie firm w bazie: ${all.length}`);

// --- Duplikaty wg TELEFONU ---
const phoneMap = new Map(); // phone → [carrier]
for (const c of all) {
  const phone = (c.phone || '').replace(/\s/g, '').trim();
  if (!phone) continue;
  if (!phoneMap.has(phone)) phoneMap.set(phone, []);
  phoneMap.get(phone).push(c);
}
const dupsByPhone = [...phoneMap.entries()].filter(([, arr]) => arr.length > 1);

// --- Duplikaty wg NAZWY ---
const nameMap = new Map(); // normalized name → [carrier]
for (const c of all) {
  const name = (c.companyName || '').toLowerCase().trim();
  if (!name) continue;
  if (!nameMap.has(name)) nameMap.set(name, []);
  nameMap.get(name).push(c);
}
const dupsByName = [...nameMap.entries()].filter(([, arr]) => arr.length > 1);

// Firmy będące duplikatem tylko wg nazwy (nie telefonu) - żeby nie liczyć dwa razy
const dupPhoneIds = new Set(dupsByPhone.flatMap(([, arr]) => arr.map(c => String(c._id))));
const dupsByNameOnly = dupsByName.filter(([, arr]) =>
  arr.some(c => !dupPhoneIds.has(String(c._id)))
);

// --- Raport ---
console.log('\n========== DUPLIKATY WG TELEFONU ==========');
let totalDupPhone = 0;
for (const [phone, arr] of dupsByPhone) {
  console.log(`\n  Tel: ${phone} (${arr.length} wpisów)`);
  arr.forEach(c => console.log(`    - ${c._id} | ${c.companyName}`));
  totalDupPhone += arr.length - 1; // ile "nadmiarowych"
}

console.log('\n========== DUPLIKATY WG NAZWY (bez tel-duplikatów) ==========');
let totalDupName = 0;
for (const [name, arr] of dupsByNameOnly) {
  // pokaż tylko te w grupie które nie są już w phone-dups
  const unique = arr.filter(c => !dupPhoneIds.has(String(c._id)));
  if (unique.length < 2) continue;
  console.log(`\n  Nazwa: "${arr[0].companyName}" (${arr.length} wpisów)`);
  arr.forEach(c => console.log(`    - ${c._id} | tel: ${c.phone}`));
  totalDupName += arr.length - 1;
}

console.log('\n========== PODSUMOWANIE ==========');
console.log(`  Grupy duplikatów wg telefonu:  ${dupsByPhone.length}`);
console.log(`  Nadmiarowe wpisy wg telefonu:   ${totalDupPhone}`);
console.log(`  Grupy duplikatów wg nazwy:      ${dupsByName.length}`);
console.log(`  Nadmiarowe wpisy wg nazwy:      ${totalDupName}`);
console.log(`  Łącznie do usunięcia (estymacja): ${totalDupPhone + totalDupName}`);
console.log('\n  (nic nie zostało usunięte)');

await mongoose.disconnect();
