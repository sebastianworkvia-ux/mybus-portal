import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Carrier from './src/models/Carrier.js'

dotenv.config()

async function cleanDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // STATYSTYKA PRZED
    const totalBefore = await Carrier.countDocuments()
    console.log(`📊 Przewoźników w bazie: ${totalBefore}\n`)

    // CZYSZCZENIE UNICODE
    console.log('🔤 Naprawiam problemy z Unicode...\n')
    
    const allCarriers = await Carrier.find().lean()
    let fixedCount = 0

    for (const carrier of allCarriers) {
      const updates = {}
      let hasChanges = false

      // Funkcja naprawy tekstu
      const fixText = (text) => {
        if (!text) return null
        
        // Sprawdź czy są problemy
        const hasProblems = /[ĂĄĹŤâ€ž™]/g.test(text) || 
                           /PrzewĂłz|osĂłb|OsĂłb|Ĺ›|â€ť|PRZEWĂ"|OSĂ"|ZDZISĹ�AW|pasaźerĂłw|KierowcĂłw|DwĂłch|WÄ™|KÄ™|AndrychĂłw|BÄ™dzin|NowodwĂłr|JustynĂłw|GĂł|TwĂłj|ŚwiÄ™tokrzyski|MiÄ™dzynarodowy|ZdrĂłj|JĂłzef|CzÄ™|WieĹ›|CzumĂłw|AugustĂłw|Duchn|granicÄ™|źywno|Ä™|Kł.*bek/i.test(text)
        
        if (!hasProblems) return null
        
        let original = text
        let fixed = text
          // U+0102 (Ă) + U+201C (") = składa się na niepoprawne "Ó"
          .replace(/\u0102\u201CZ/g, 'ÓZ')  // PRZEWĂ"Z → PRZEWÓZ
          .replace(/\u0102\u201CB/g, 'ÓB')  // OSĂ"B → OSÓB
          .replace(/\u0102\u201C/g, 'Ó')    // Ă" → Ó (pojedynczo)
          // U+00C4 (Ä) + U+2122 (™) = niepoprawne "ę"
          .replace(/\u00C4\u2122/g, 'ę')    // Ä™ → ę
          .replace(/\u0119/g, 'ę')          // Ä™ → ę (standardowe)
          .replace(/\u201C/g, '')           // " (lewy) - usunąć
          .replace(/\u201D/g, '')           // " (prawy) - usunąć
          .replace(/ZDZISĹ�AW/g, 'ZDZISŁAW')
          .replace(/KłÄ™bek/g, 'Kłębek')
          .replace(/źywnoĹ›ci/g, 'żywności')
          .replace(/miÄ™dzynarodowa/g, 'międzynarodowa')
          .replace(/MiÄ™dzynarodowa/g, 'Międzynarodowa')
          .replace(/â€žJERRYâ€ť/g, '"JERRY"')
          .replace(/â€ž/g, '"')
          .replace(/â€ť/g, '"')
          .replace(/â€Ž/g, '')
          // Główne problemy kodowania UTF-8
          .replace(/PrzewĂłz/g, 'Przewóz')
          .replace(/przewĂłz/g, 'przewóz')
          .replace(/osĂłb/g, 'osób')
          .replace(/OsĂłb/g, 'Osób')
          .replace(/MiÄ™dzynarodowy/g, 'Międzynarodowy')
          .replace(/miÄ™dzynarodowy/g, 'międzynarodowy')
          .replace(/MiÄ™dzynarodowa/g, 'Międzynarodowa')
          .replace(/miÄ™dzynarodowa/g, 'międzynarodowa')
          .replace(/pracownikĂłw/g, 'pracowników')
          .replace(/pasaĹĽerĂłw/g, 'pasażerów')
          .replace(/pasaźerĂłw/g, 'pasażerów')
          .replace(/autokarĂłw/g, 'autokarów')
          .replace(/busĂłw/g, 'busów')
          .replace(/samochodĂłw/g, 'samochodów')
          .replace(/towarĂłw/g, 'towarów')
          .replace(/KierowcĂłw/g, 'Kierowców')
          .replace(/DwĂłch/g, 'Dwóch')
          .replace(/TwĂłj/g, 'Twój')
          .replace(/lekĂłw/g, 'leków')
          // Nazwy miast
          .replace(/WrocĹ‚aw/g, 'Wrocław')
          .replace(/GdaĹ„sk/g, 'Gdańsk')
          .replace(/GdaĹ„/g, 'Gdań')
          .replace(/PoznaĹ„/g, 'Poznań')
          .replace(/KrakĂłw/g, 'Kraków')
          .replace(/ZłotĂłw/g, 'Złotów')
          .replace(/WÄ™glew/g, 'Węglew')
          .replace(/AndrychĂłw/g, 'Andrychów')
          .replace(/BÄ™dzin/g, 'Będzin')
          .replace(/NowodwĂłr/g, 'Nowodwór')
          .replace(/JustynĂłw/g, 'Justynów')
          .replace(/TomaszĂłw/g, 'Tomaszów')
          .replace(/LubartĂłw/g, 'Lubartów')
          .replace(/PiotrkĂłw/g, 'Piotrków')
          .replace(/SÄ™dziszĂłw/g, 'Sędziszów')
          .replace(/Tarnowskie GĂłry/g, 'Tarnowskie Góry')
          .replace(/ŚwieradĂłw/g, 'Świeradów')
          .replace(/ŚwiÄ™tokrzyski/g, 'Świętokrzyski')
          .replace(/ZdrĂłj/g, 'Zdrój')
          .replace(/JĂłzefĂłw/g, 'Józefów')
          .replace(/CzÄ™stochowa/g, 'Częstochowa')
          .replace(/AugustĂłw/g, 'Augustów')
          .replace(/CzumĂłw/g, 'Czumów')
          .replace(/DuchnĂłw/g, 'Duchnów')
          .replace(/WieĹ›/g, 'Wieś')
          .replace(/KłÄ™bek/g, 'Kłębek')
          .replace(/KÄ™trzyn/g, 'Kętrzyn')
          .replace(/BiaĹ‚ystok/g, 'Białystok')
          .replace(/WĹ‚ocĹ‚awek/g, 'Włocławek')
          .replace(/InowrocĹ‚aw/g, 'Inowrocław')
          .replace(/PiĹ‚a/g, 'Piła')
          .replace(/WaĹ‚brzych/g, 'Wałbrzych')
          .replace(/Ĺšwidnica/g, 'Świdnica')
          .replace(/Ĺšlesin/g, 'Ślesin')
          .replace(/Ĺšwierklaniec/g, 'Świerklaniec')
          .replace(/ToruĹ„/g, 'Toruń')
          .replace(/CheĹ‚m/g, 'Chełm')
          .replace(/CheĹ‚mek/g, 'Chełmek')
          .replace(/BiĹ‚goraj/g, 'Biłgoraj')
          .replace(/RadzyĹ„/g, 'Radzyń')
          .replace(/WaĹ‚cz/g, 'Wałcz')
          .replace(/GoĹ‚aĹ„cz/g, 'Gołańcz')
          .replace(/GrudziÄ…dz/g, 'Grudziądz')
          .replace(/MrÄ…gowo/g, 'Mrągowo')
          .replace(/JastrzÄ™bie/g, 'Jastrzębie')
          .replace(/Ĺ»dĹĽanne/g, 'Żdźanne')
          .replace(/Ĺ»ary/g, 'Żary')
          .replace(/Ĺ"Ăłdź/g, 'Łódź')
          .replace(/SioĹ‚kowice/g, 'Siołkowice')
          .replace(/DÄ…browa/g, 'Dąbrowa')
          .replace(/LicheĹ„/g, 'Licheń')
          .replace(/KramarzĂłwka/g, 'Kramar​zówka')
          // Województwa
          .replace(/GorÄ™/g, 'Gorę')
          .replace(/ĹšlÄ…/g, 'Ślą')
          .replace(/DolnoĹ›lÄ…/g, 'Dolnośląś')
          .replace(/Ĺ›lÄ…skie/g, 'śląskie')
          .replace(/dolnoĹ›lÄ…skie/g, 'dolnośląskie')
          .replace(/maĹ‚opolskie/g, 'małopolskie')
          .replace(/Ĺ›wiÄ™tokrzyskie/g, 'świętokrzyskie')
          // Pozostałe słowa
          .replace(/niepeĹ‚nosprawnych/g, 'niepełnosprawnych')
          .replace(/niepeĹ‚/g, 'niepełś')
          .replace(/pasaĹĽerski/g, 'pasażerski')
          .replace(/PasaĹĽerski/g, 'Pasażerski')
          .replace(/LÄ…dowy/g, 'Lądowy')
          .replace(/usĹ‚ugi/g, 'usługi')
          .replace(/spoĹĽywczy/g, 'spożywczy')
          .replace(/ĹĽywnoĹ›ci/g, 'żywności')
          .replace(/WypoĹĽyczalnia/g, 'Wypożyczalnia')
          .replace(/granicÄ™/g, 'granicę')
          .replace(/ChĹ‚odniczy/g, 'Chłodniczy')
          // Imiona
          .replace(/JarosĹ‚aw/g, 'Jarosław')
          .replace(/WiesĹ‚aw/g, 'Wiesław')
          .replace(/WĹ‚adysĹ‚aw/g, 'Władysław')
          .replace(/Ĺ�ukasz/g, 'Łukasz')
          .replace(/JabĹ‚oĹ„ski/g, 'Jabłoński')
          .replace(/DuĹ„czyk/g, 'Duńczyk')
          .replace(/PolaĹ„ski/g, 'Polański')
          // Pojedyncze znaki - szerokie
          .replace(/Ă³/g, 'ó')
          .replace(/Ĺ‚/g, 'ł')
          .replace(/Ä…/g, 'ą')
          .replace(/Ä™/g, 'ę')
          .replace(/Ĺ„/g, 'ń')
          .replace(/ĹĄ/g, 'ś')
          .replace(/ĹĽ/g, 'ź')
          .replace(/Ĺź/g, 'ż')
          // Duże litery
          .replace(/Ă"/g, 'Ó')
          .replace(/Ĺ\x81/g, 'Ł')
          .replace(/Ĺ�/g, 'Ł')
          .replace(/Ä„/g, 'Ą')
          .replace(/Ä†/g, 'Ć')
          .replace(/Ä˜/g, 'Ę')
          .replace(/Ä™/g, 'Ę')
          .replace(/Ĺƒ/g, 'Ń')
          .replace(/Ĺš/g, 'Ś')
          .replace(/Ĺą/g, 'Ź')
          .replace(/Ĺ»/g, 'Ż')
          .trim()

        return fixed !== original ? fixed : null
      }

      // Napraw nazwę firmy
      if (carrier.companyName) {
        const fixedName = fixText(carrier.companyName)
        if (fixedName) {
          console.log(`  📝 Naprawiam nazwę: "${carrier.companyName}" → "${fixedName}"`)
          updates.companyName = fixedName
          hasChanges = true
        }
      }

      // Napraw miasto
      if (carrier.location?.city) {
        const fixedCity = fixText(carrier.location.city)
        if (fixedCity) {
          console.log(`  📍 Naprawiam miasto: "${carrier.location.city}" → "${fixedCity}"`)
          updates['location.city'] = fixedCity
          hasChanges = true
        }
      }

      // Napraw adres
      if (carrier.location?.address) {
        const fixedAddress = fixText(carrier.location.address)
        if (fixedAddress) {
          updates['location.address'] = fixedAddress
          hasChanges = true
        }
      }

      // Napraw opis
      if (carrier.description) {
        const fixedDesc = fixText(carrier.description)
        if (fixedDesc) {
          updates.description = fixedDesc
          hasChanges = true
        }
      }

      // Napraw szczegółowy opis
      if (carrier.detailedDescription) {
        const fixedDetailedDesc = fixText(carrier.detailedDescription)
        if (fixedDetailedDesc) {
          updates.detailedDescription = fixedDetailedDesc
          hasChanges = true
        }
      }

      // Zapisz zmiany
      if (hasChanges) {
        await Carrier.updateOne({ _id: carrier._id }, { $set: updates })
        fixedCount++
      }
    }

    console.log(`\n✅ Naprawiono ${fixedCount} przewoźników\n`)

    // STATYSTYKA PO
    const totalAfter = await Carrier.countDocuments()
    console.log(`════════════════════════════════════════════`)
    console.log(`📊 PODSUMOWANIE:`)
    console.log(`   Przewoźników w bazie: ${totalAfter}`)
    console.log(`   Naprawiono Unicode: ${fixedCount}`)
    console.log(`════════════════════════════════════════════\n`)

    // PRÓBKA
    console.log('📋 PRÓBKA 10 LOSOWYCH PRZEWOŹNIKÓW:\n')
    const sample = await Carrier.aggregate([
      { $sample: { size: 10 } },
      { $project: { companyName: 1, 'location.city': 1, country: 1, isPremium: 1 } }
    ])

    sample.forEach((c, i) => {
      console.log(`${i+1}. ${c.companyName} | ${c.location?.city || '-'} | ${c.country} ${c.isPremium ? '⭐' : ''}`)
    })

    console.log('\n')
    process.exit(0)
  } catch (error) {
    console.error('❌ Błąd:', error)
    process.exit(1)
  }
}

cleanDatabase()
