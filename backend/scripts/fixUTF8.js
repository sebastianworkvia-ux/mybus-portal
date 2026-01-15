// Skrypt do naprawy błędnego encoding w MongoDB
// Uruchom: node backend/scripts/fixUTF8.js

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from '../src/models/Carrier.js'
import User from '../src/models/User.js'
import Review from '../src/models/Review.js'

dotenv.config()

// Mapa znanych błędnych znaków → poprawne polskie znaki
const fixEncoding = (text) => {
  if (!text || typeof text !== 'string') return text
  
  // Usuń znaki � (U+FFFD - replacement character)
  let fixed = text.replace(/�/g, '')
  
  // Podstawowa naprawa encoding ISO-8859-2/Windows-1250 → UTF-8
  const map = {
    // Małe polskie znaki
    '\u0105': 'ą', 'Ä…': 'ą', 'ą': 'ą',
    '\u0107': 'ć', 'Ä‡': 'ć', 'ć': 'ć',
    '\u0119': 'ę', 'Ä™': 'ę', 'ę': 'ę',
    '\u0142': 'ł', 'Ĺ‚': 'ł', 'ł': 'ł',
    '\u0144': 'ń', 'Ĺ„': 'ń', 'ń': 'ń',
    '\u00f3': 'ó', 'Ăł': 'ó', 'ó': 'ó',
    '\u015b': 'ś', 'Ĺ›': 'ś', 'ś': 'ś',
    '\u017a': 'ź', 'Ĺş': 'ź', 'ź': 'ź',
    '\u017c': 'ż', 'ĹĽ': 'ż', 'ż': 'ż',
    // Wielkie polskie znaki  
    '\u0104': 'Ą', 'Ä„': 'Ą', 'Ą': 'Ą',
    '\u0106': 'Ć', 'Ä†': 'Ć', 'Ć': 'Ć',
    '\u0118': 'Ę', 'Ä\u0098': 'Ę', 'Ę': 'Ę',
    '\u0141': 'Ł', 'Ĺ\u0081': 'Ł', 'Ł': 'Ł',
    '\u0143': 'Ń', 'Ĺ\u0083': 'Ń', 'Ń': 'Ń',
    '\u00d3': 'Ó', 'Ă"': 'Ó', 'Ó': 'Ó',
    '\u015a': 'Ś', 'Ĺš': 'Ś', 'Ś': 'Ś',
    '\u0179': 'Ź', 'Ĺą': 'Ź', 'Ź': 'Ź',
    '\u017b': 'Ż', 'Ĺ»': 'Ż', 'Ż': 'Ż'
  }
  
  // Zastąp wszystkie znane błędne znaki
  for (const [bad, good] of Object.entries(map)) {
    fixed = fixed.split(bad).join(good)
  }
  
  // Dodatkowe naprawy dla częstych słów
  const wordFixes = {
    'Midzynarodowy': 'Międzynarodowy',
    'midzynarodowy': 'międzynarodowy', 
    'Przewz': 'Przewóz',
    'przewz': 'przewóz',
    'Osb': 'Osób',
    'osb': 'osób',
    'Pasaerskie': 'Pasażerskie',
    'pasaerskie': 'pasażerskie',
    'Krakw': 'Kraków',
    'Gdask': 'Gdańsk',
    'Wrocaw': 'Wrocław',
    'dź': 'Łódź',
    'Pozna': 'Poznań',
    'ukasz': 'Łukasz',
    'Twj': 'Twój',
    'twj': 'twój',
    'Augustw': 'Augustów',
    'Bagaowy': 'Bagażowy',
    'bagaowy': 'bagażowy',
    'Ciarowy': 'Ciężarowy',
    'ciarowy': 'ciężarowy',
    'Suwaki': 'Suwałki',
    'Warmiski': 'Warmiński',
    'autokarw': 'autokarów',
    'Oga': 'Olga'
  }
  
  for (const [bad, good] of Object.entries(wordFixes)) {
    fixed = fixed.split(bad).join(good)
  }
  
  return fixed.trim()
}

async function fixCarriers() {
  console.log('\n🔧 Naprawiam encoding w Carriers...')
  
  const carriers = await Carrier.find({})
  let fixed = 0
  
  for (const carrier of carriers) {
    let needsUpdate = false
    
    if (carrier.companyName) {
      const newName = fixEncoding(carrier.companyName)
      if (newName !== carrier.companyName) {
        console.log(`  📝 ${carrier.companyName} → ${newName}`)
        carrier.companyName = newName
        needsUpdate = true
      }
    }
    
    if (carrier.description) {
      const newDesc = fixEncoding(carrier.description)
      if (newDesc !== carrier.description) {
        carrier.description = newDesc
        needsUpdate = true
      }
    }
    
    if (carrier.location?.city) {
      const newCity = fixEncoding(carrier.location.city)
      if (newCity !== carrier.location.city) {
        carrier.location.city = newCity
        needsUpdate = true
      }
    }
    
    if (needsUpdate) {
      await carrier.save()
      fixed++
    }
  }
  
  console.log(`✅ Naprawiono ${fixed} przewoźników\n`)
  return fixed
}

async function fixUsers() {
  console.log('🔧 Naprawiam encoding w Users...')
  
  const users = await User.find({})
  let fixed = 0
  
  for (const user of users) {
    let needsUpdate = false
    
    if (user.firstName) {
      const newName = fixEncoding(user.firstName)
      if (newName !== user.firstName) {
        user.firstName = newName
        needsUpdate = true
      }
    }
    
    if (user.lastName) {
      const newName = fixEncoding(user.lastName)
      if (newName !== user.lastName) {
        user.lastName = newName
        needsUpdate = true
      }
    }
    
    if (user.carrierProfile?.companyName) {
      const newName = fixEncoding(user.carrierProfile.companyName)
      if (newName !== user.carrierProfile.companyName) {
        user.carrierProfile.companyName = newName
        needsUpdate = true
      }
    }
    
    if (user.carrierProfile?.description) {
      const newDesc = fixEncoding(user.carrierProfile.description)
      if (newDesc !== user.carrierProfile.description) {
        user.carrierProfile.description = newDesc
        needsUpdate = true
      }
    }
    
    if (needsUpdate) {
      await user.save()
      fixed++
    }
  }
  
  console.log(`✅ Naprawiono ${fixed} użytkowników\n`)
  return fixed
}

async function fixReviews() {
  console.log('🔧 Naprawiam encoding w Reviews...')
  
  const reviews = await Review.find({})
  let fixed = 0
  
  for (const review of reviews) {
    if (review.comment) {
      const newComment = fixEncoding(review.comment)
      if (newComment !== review.comment) {
        review.comment = newComment
        await review.save()
        fixed++
      }
    }
  }
  
  console.log(`✅ Naprawiono ${fixed} recenzji\n`)
  return fixed
}

async function main() {
  try {
    console.log('🚀 Łączenie z MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('✅ Połączono z MongoDB\n')
    
    const carriersFixed = await fixCarriers()
    const usersFixed = await fixUsers()
    const reviewsFixed = await fixReviews()
    
    console.log('=' .repeat(60))
    console.log('📊 PODSUMOWANIE:')
    console.log(`   Przewoźnicy: ${carriersFixed}`)
    console.log(`   Użytkownicy: ${usersFixed}`)
    console.log(`   Recenzje: ${reviewsFixed}`)
    console.log(`   RAZEM: ${carriersFixed + usersFixed + reviewsFixed} naprawionych rekordów`)
    console.log('=' .repeat(60))
    
    if (carriersFixed + usersFixed + reviewsFixed === 0) {
      console.log('\n✨ Brak błędów encoding - wszystko OK!')
    } else {
      console.log('\n✅ Naprawa zakończona pomyślnie!')
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error)
  } finally {
    await mongoose.connection.close()
    console.log('\n👋 Rozłączono z MongoDB')
  }
}

main()
