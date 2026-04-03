import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from './src/models/Carrier.js'

dotenv.config()

async function verifyAndCleanCarriers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // 1. STATYSTYKA PRZED CZYSZCZENIEM
    const totalBefore = await Carrier.countDocuments()
    console.log(`📊 STATYSTYKA PRZED CZYSZCZENIEM:`)
    console.log(`   Łączna liczba przewoźników: ${totalBefore}\n`)

    // 2. SZUKANIE DUPLIKATÓW (nazwa + miasto)
    console.log('🔍 Szukam duplikatów (nazwa + miasto)...\n')
    
    const allCarriers = await Carrier.find().lean()
    const duplicates = []
    const seen = new Map()
    const toDelete = []

    for (const carrier of allCarriers) {
      // Klucz: normalized nazwa + miasto
      const key = `${carrier.companyName?.trim().toLowerCase()}_${carrier.location?.city?.trim().toLowerCase()}`
      
      if (seen.has(key)) {
        // To jest duplikat
        const original = seen.get(key)
        console.log(`❌ DUPLIKAT ZNALEZIONY:`)
        console.log(`   Oryginał: ${original.companyName} (${original.location?.city}) - ID: ${original._id}`)
        console.log(`   Duplikat: ${carrier.companyName} (${carrier.location?.city}) - ID: ${carrier._id}`)
        
        // Wybierz który usunąć (zachowaj ten z więcej danych lub starszy)
        if (carrier.isPremium && !original.isPremium) {
          // Jeśli duplikat jest premium, zachowaj go
          toDelete.push(original._id)
          seen.set(key, carrier)
          console.log(`   ✓ Usuwam oryginał (duplikat jest Premium)\n`)
        } else if (carrier.userId && !original.userId) {
          // Jeśli duplikat ma userId, zachowaj go
          toDelete.push(original._id)
          seen.set(key, carrier)
          console.log(`   ✓ Usuwam oryginał (duplikat ma właściciela)\n`)
        } else {
          // Domyślnie zachowaj oryginał, usuń duplikat
          toDelete.push(carrier._id)
          console.log(`   ✓ Usuwam duplikat\n`)
        }
        
        duplicates.push({ original, duplicate: carrier })
      } else {
        seen.set(key, carrier)
      }
    }

    console.log(`\n📊 Znaleziono ${duplicates.length} duplikatów`)
    console.log(`🗑️  Do usunięcia: ${toDelete.length} przewoźników\n`)

    // 3. USUWANIE DUPLIKATÓW
    if (toDelete.length > 0) {
      console.log('🗑️  Usuwam duplikaty...')
      const deleteResult = await Carrier.deleteMany({ _id: { $in: toDelete } })
      console.log(`✅ Usunięto ${deleteResult.deletedCount} duplikatów\n`)
    }

    // 4. SPRAWDZANIE I NAPRAWA UNICODE
    console.log('🔤 Sprawdzam problemy z Unicode...\n')
    
    const carriersWithIssues = await Carrier.find({
      $or: [
        { companyName: /[\u0100-\u017F\u0180-\u024F]/ }, // Znaki diakrytyczne nie-polskie
        { 'location.city': /[\u0100-\u017F\u0180-\u024F]/ },
        { description: /[\u0100-\u017F\u0180-\u024F]/ }
      ]
    })

    console.log(`❌ Przewoźników z problemami: ${carriersWithIssues.length}`)

    let fixedCount = 0
    for (const carrier of carriersWithIssues) {
      let fixed = false
      const updates = {}

      // Funkcja do naprawy tekstu
      const fixText = (text) => {
        if (!text) return text
        
        // Usuń lub zamień problematyczne znaki
        let fixed = text
          // Usuń znaki kontrolne i nie-printowalne
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
          // Zamień częste błędy kodowania
          .replace(/Ã³/g, 'ó')
          .replace(/Ã¡/g, 'ą')
          .replace(/Ä\x85/g, 'ą')
          .replace(/Ä\x87/g, 'ć')
          .replace(/Ä\x99/g, 'ę')
          .replace(/Å\x82/g, 'ł')
          .replace(/Å\x84/g, 'ń')
          .replace(/Å\x9b/g, 'ś')
          .replace(/Åº/g, 'ź')
          .replace(/Å¼/g, 'ż')
          // Duże litery
          .replace(/Ä\x84/g, 'Ą')
          .replace(/Ä\x86/g, 'Ć')
          .replace(/Ä\x98/g, 'Ę')
          .replace(/Å\x81/g, 'Ł')
          .replace(/Å\x83/g, 'Ń')
          .replace(/Å\x9a/g, 'Ś')
          .replace(/Å¹/g, 'Ź')
          .replace(/Å»/g, 'Ż')
          .trim()

        return fixed !== text ? fixed : null
      }

      if (carrier.companyName) {
        const fixedName = fixText(carrier.companyName)
        if (fixedName && fixedName !== carrier.companyName) {
          console.log(`  Naprawiam nazwę: "${carrier.companyName}" → "${fixedName}"`)
          updates.companyName = fixedName
          fixed = true
        }
      }

      if (carrier.location?.city) {
        const fixedCity = fixText(carrier.location.city)
        if (fixedCity && fixedCity !== carrier.location.city) {
          console.log(`  Naprawiam miasto: "${carrier.location.city}" → "${fixedCity}"`)
          updates['location.city'] = fixedCity
          fixed = true
        }
      }

      if (carrier.description) {
        const fixedDesc = fixText(carrier.description)
        if (fixedDesc && fixedDesc !== carrier.description) {
          console.log(`  Naprawiam opis dla: ${carrier.companyName}`)
          updates.description = fixedDesc
          fixed = true
        }
      }

      if (fixed) {
        await Carrier.updateOne({ _id: carrier._id }, { $set: updates })
        fixedCount++
      }
    }

    console.log(`\n✅ Naprawiono ${fixedCount} przewoźników z problemami Unicode\n`)

    // 5. STATYSTYKA PO CZYSZCZENIU
    const totalAfter = await Carrier.countDocuments()
    console.log(`\n════════════════════════════════════════════════════════════`)
    console.log(`📊 STATYSTYKA PO CZYSZCZENIU:`)
    console.log(`   Przed: ${totalBefore} przewoźników`)
    console.log(`   Po: ${totalAfter} przewoźników`)
    console.log(`   Usunięto duplikatów: ${totalBefore - totalAfter}`)
    console.log(`   Naprawiono Unicode: ${fixedCount}`)
    console.log(`════════════════════════════════════════════════════════════\n`)

    // 6. PRÓBKA PO CZYSZCZENIU
    console.log('📋 PRÓBKA PRZEWOŹNIKÓW PO CZYSZCZENIU (10 losowych):\n')
    const sampleCarriers = await Carrier.aggregate([
      { $sample: { size: 10 } },
      { 
        $project: { 
          companyName: 1, 
          'location.city': 1,
          country: 1,
          services: 1,
          isPremium: 1
        } 
      }
    ])

    sampleCarriers.forEach((c, i) => {
      console.log(`${i+1}. ${c.companyName} | ${c.location?.city || 'Brak miasta'} | ${c.country} | ${c.isPremium ? '⭐' : ''}`)
    })

    process.exit(0)
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

verifyAndCleanCarriers()
