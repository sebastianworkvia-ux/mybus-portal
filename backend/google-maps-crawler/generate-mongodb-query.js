// Skrypt do wygenerowania MongoDB query z telefonami
import fs from 'fs';
import csv from 'csv-parser';

const CSV_FILE = './carriers_format_admin.csv';

const phones = [];

fs.createReadStream(CSV_FILE, 'latin1')
  .pipe(csv({ separator: ';' }))
  .on('data', (row) => {
    const phone = row['Numer telefonu'];
    if (phone && phone.trim()) {
      const cleaned = phone.trim().replace(/\s+/g, '');
      phones.push(cleaned);
    }
  })
  .on('end', () => {
    console.log('// === MONGODB QUERY - Dodaj tag laweta ===\n');
    console.log('// Wklej to w MongoDB Atlas Shell:\n');
    
    // Wygeneruj warianty
    const variants = [];
    for (const phone of phones) {
      const base = phone.replace(/^\+48/, '').replace(/^48/, '');
      variants.push(base);
      variants.push(`+48${base}`);
      variants.push(`48${base}`);
    }
    
    const unique = [...new Set(variants)];
    
    console.log('db.carriers.updateMany(');
    console.log('  {');
    console.log('    phone: {');
    console.log('      $in: [');
    
    unique.forEach((phone, i) => {
      const comma = i < unique.length - 1 ? ',' : '';
      console.log(`        "${phone}"${comma}`);
    });
    
    console.log('      ]');
    console.log('    },');
    console.log('    services: { $ne: "laweta" }');
    console.log('  },');
    console.log('  {');
    console.log('    $addToSet: { services: "laweta" }');
    console.log('  }');
    console.log(');');
    
    console.log(`\n// Znalezionych telefonów: ${phones.length}`);
    console.log(`// Wariantów: ${unique.length}`);
  });
