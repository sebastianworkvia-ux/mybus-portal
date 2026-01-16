import fs from 'fs'
import csv from 'csv-parser'

const filePath = 'D:\\----POBRANE -----\\Dane  firm do bazy.csv'

const results = []

// Usuń BOM jeśli istnieje
const stream = fs.createReadStream(filePath, { encoding: 'utf-8' })

stream.on('data', (chunk) => {
  if (chunk.charCodeAt(0) === 0xFEFF) {
    console.log('⚠️ Znaleziono BOM - usuwam')
  }
})

fs.createReadStream(filePath, { encoding: 'utf-8' })
  .pipe(csv({ 
    separator: ';',
    mapHeaders: ({ header }) => {
      // Usuń BOM z pierwszego nagłówka
      const cleaned = header.replace(/^\uFEFF/, '').trim()
      console.log(`Header: "${header}" -> "${cleaned}"`)
      return cleaned
    },
    skipEmptyLines: true
  }))
  .on('data', (row) => {
    results.push(row)
  })
  .on('end', () => {
    console.log(`📋 Znaleziono ${results.length} wierszy\n`)
    
    if (results.length > 0) {
      console.log('📝 Kolumny:', Object.keys(results[0]))
      console.log('\n📦 Pierwsze 3 wiersze:\n')
      
      for (let i = 0; i < Math.min(3, results.length); i++) {
        const row = results[i]
        const allEmpty = Object.values(row).every(val => !val || val.trim() === '')
        
        console.log(`Wiersz ${i + 1}:`)
        console.log(`  Czy pusty: ${allEmpty}`)
        console.log(`  Nazwa firmy: "${row['Nazwa firmy']}"`)
        console.log(`  Telefon: "${row['Numer telefonu']}"`)
        console.log(`  Email: "${row['Email']}"`)
        console.log(`  Miasto: "${row['Miasto']}"`)
        console.log()
      }
      
      // Zlicz niepuste wiersze
      const nonEmpty = results.filter(row => {
        return !Object.values(row).every(val => !val || val.trim() === '')
      })
      
      console.log(`✅ Niepustych wierszy: ${nonEmpty.length}`)
      console.log(`❌ Pustych wierszy: ${results.length - nonEmpty.length}`)
    }
  })
  .on('error', (err) => {
    console.error('❌ Błąd:', err)
  })
