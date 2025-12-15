import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './src/models/User.js'
import Carrier from './src/models/Carrier.js'

dotenv.config()

const seedCarriers = [
  {
    email: 'kontakt@euroshuttle.de',
    password: 'test123',
    firstName: 'Jan',
    lastName: 'Kowalski',
    userType: 'carrier',
    companyName: 'EuroShuttle Express',
    companyRegistration: 'DE-2345678',
    country: 'DE',
    description: 'Profesjonalny transport pasażerski Polska-Niemcy. Obsługujemy trasy Berlin, Hamburg, Monachium. Busy 9-osobowe, klimatyzacja, WiFi.',
    phone: '+49 176 234 5678',
    services: ['transport', 'paczki'],
    rating: 4.8,
    reviewCount: 47,
    routes: [
      { from: 'Berlin', to: 'Warszawa', days: ['poniedziałek', 'czwartek', 'sobota'], time: '07:00' },
      { from: 'Hamburg', to: 'Gdańsk', days: ['wtorek', 'piątek'], time: '08:00' },
      { from: 'Monachium', to: 'Kraków', days: ['środa', 'niedziela'], time: '06:30' }
    ],
    luggageInfo: {
      maxPieces: 2,
      maxWeight: 25,
      additionalInfo: 'Dodatkowy bagaż 10€/szt. Bagaż ponadgabarytowy po wcześniejszym uzgodnieniu.'
    }
  },
  {
    email: 'biuro@polandexpress.nl',
    password: 'test123',
    firstName: 'Maria',
    lastName: 'Nowak',
    userType: 'carrier',
    companyName: 'Poland Express Transport',
    companyRegistration: 'NL-9876543',
    country: 'NL',
    description: 'Przewozy pasażerskie Polska-Holandia. Amsterdam, Rotterdam, Utrecht. Wygodne minibusy, przejazdy door-to-door. 15 lat doświadczenia.',
    phone: '+31 6 1234 5678',
    services: ['transport', 'przeprowadzki'],
    rating: 4.9,
    reviewCount: 89,
    routes: [
      { from: 'Amsterdam', to: 'Warszawa', days: ['wtorek', 'czwartek', 'sobota'], time: '19:00' },
      { from: 'Rotterdam', to: 'Wrocław', days: ['poniedziałek', 'środa', 'piątek'], time: '20:00' },
      { from: 'Utrecht', to: 'Kraków', days: ['niedziela'], time: '18:30' }
    ],
    luggageInfo: {
      maxPieces: 3,
      maxWeight: 30,
      additionalInfo: 'Przy przeprowadzkach możliwość przewozu większych przedmiotów. Kontakt telefoniczny wymagany.'
    }
  },
  {
    email: 'info@quick-trans.de',
    password: 'test123',
    firstName: 'Piotr',
    lastName: 'Wiśniewski',
    userType: 'carrier',
    companyName: 'QuickTrans Berlin',
    companyRegistration: 'DE-5432109',
    country: 'DE',
    description: 'Szybkie połączenia Berlin-Warszawa. Codziennie o 6:00 i 18:00. Nowe busy Mercedes, komfortowe fotele, ładowarki USB.',
    phone: '+49 30 987 6543',
    services: ['transport'],
    rating: 4.7,
    reviewCount: 112,
    routes: [
      { from: 'Berlin', to: 'Warszawa', days: ['codziennie'], time: '06:00' },
      { from: 'Berlin', to: 'Warszawa', days: ['codziennie'], time: '18:00' }
    ],
    luggageInfo: {
      maxPieces: 2,
      maxWeight: 20,
      additionalInfo: 'Standardowy bagaż podręczny gratis. Walizki do 20kg bez dopłat.'
    }
  },
  {
    email: 'kontakt@belgiabus.be',
    password: 'test123',
    firstName: 'Anna',
    lastName: 'Kowalczyk',
    userType: 'carrier',
    companyName: 'BelgiaBus Service',
    companyRegistration: 'BE-3456789',
    country: 'BE',
    description: 'Transport Polska-Belgia. Bruksela, Antwerpia, Gandawa. Busy 8-osobowe. Możliwość przesyłek do 50kg. Licencja transportowa UE.',
    phone: '+32 456 78 90 12',
    services: ['transport', 'paczki', 'transport-rzeczy'],
    rating: 4.6,
    reviewCount: 34,
    routes: [
      { from: 'Bruksela', to: 'Warszawa', days: ['wtorek', 'piątek'], time: '17:00' },
      { from: 'Antwerpia', to: 'Kraków', days: ['środa', 'sobota'], time: '16:30' },
      { from: 'Gandawa', to: 'Katowice', days: ['czwartek', 'niedziela'], time: '17:30' }
    ],
    luggageInfo: {
      maxPieces: 2,
      maxWeight: 50,
      additionalInfo: 'Transport paczek do 50kg. Większe przesyłki po wcześniejszym kontakcie.'
    }
  },
  {
    email: 'biuro@nl-shuttle.nl',
    password: 'test123',
    firstName: 'Tomasz',
    lastName: 'Lewandowski',
    userType: 'carrier',
    companyName: 'NL-Shuttle Amsterdam',
    companyRegistration: 'NL-7654321',
    country: 'NL',
    description: 'Codzienne kursy Amsterdam-Kraków przez Katowice. Klimatyzowane busy VW Crafter. WiFi gratis. Rezerwacja online.',
    phone: '+31 20 456 7890',
    services: ['transport'],
    rating: 4.9,
    reviewCount: 156,
    routes: [
      { from: 'Amsterdam', to: 'Kraków', days: ['codziennie'], time: '20:00' }
    ],
    luggageInfo: {
      maxPieces: 2,
      maxWeight: 25,
      additionalInfo: 'Walizki standardowe do 23kg każda. WiFi i gniazdka w cenie biletu.'
    }
  },
  {
    email: 'info@hamburg-trans.de',
    password: 'test123',
    firstName: 'Krzysztof',
    lastName: 'Zieliński',
    userType: 'carrier',
    companyName: 'Hamburg Transport Service',
    companyRegistration: 'DE-8765432',
    country: 'DE',
    description: 'Hamburg-Gdańsk-Warszawa. Transport osób i paczek. Busy 9-osobowe Ford Transit. Punktualność gwarantowana. Ubezpieczenie OC/NNW.',
    phone: '+49 40 123 4567',
    services: ['transport', 'paczki'],
    rating: 4.5,
    reviewCount: 68,
    routes: [
      { from: 'Hamburg', to: 'Gdańsk', days: ['poniedziałek', 'środa', 'piątek'], time: '09:00' },
      { from: 'Hamburg', to: 'Warszawa', days: ['wtorek', 'czwartek', 'sobota'], time: '08:00' }
    ],
    luggageInfo: {
      maxPieces: 2,
      maxWeight: 30,
      additionalInfo: 'Transport paczek kurierskich. Pełne ubezpieczenie OC/NNW dla pasażerów.'
    }
  },
  {
    email: 'kontakt@france-shuttle.fr',
    password: 'test123',
    firstName: 'Magdalena',
    lastName: 'Szymańska',
    userType: 'carrier',
    companyName: 'France Shuttle Express',
    companyRegistration: 'FR-2345678',
    country: 'FR',
    description: 'Paryż-Polska przez Strasburg i Katowice. Luksusowe minibusy Mercedes. Przejazdy 2x w tygodniu. Transfer z/na lotniska.',
    phone: '+33 1 23 45 67 89',
    services: ['transport', 'dokumenty'],
    rating: 4.8,
    reviewCount: 45,
    routes: [
      { from: 'Paryż', to: 'Warszawa', days: ['wtorek', 'piątek'], time: '19:00' },
      { from: 'Strasburg', to: 'Katowice', days: ['środa', 'sobota'], time: '20:00' }
    ],
    luggageInfo: {
      maxPieces: 3,
      maxWeight: 25,
      additionalInfo: 'Luksusowe minibusy. Transfer z/na lotniska Charles de Gaulle. Transport dokumentów ekspresowy.'
    }
  },
  {
    email: 'office@austria-bus.at',
    password: 'test123',
    firstName: 'Paweł',
    lastName: 'Dąbrowski',
    userType: 'carrier',
    companyName: 'Austria Bus Connect',
    companyRegistration: 'AT-9876543',
    country: 'AT',
    description: 'Wiedeń-Kraków-Warszawa. Busy premium z WiFi i gniazdkami. Przesyłki kurierskie do 30kg. Odjazdy czwartek i niedziela.',
    phone: '+43 1 234 5678',
    services: ['transport', 'paczki', 'dokumenty'],
    rating: 4.7,
    reviewCount: 52,
    routes: [
      { from: 'Wiedeń', to: 'Kraków', days: ['czwartek', 'niedziela'], time: '18:00' },
      { from: 'Wiedeń', to: 'Warszawa', days: ['czwartek', 'niedziela'], time: '17:00' }
    ],
    luggageInfo: {
      maxPieces: 2,
      maxWeight: 30,
      additionalInfo: 'Przesyłki kurierskie do 30kg. WiFi premium, gniazdka USB-C. Napoje gratis.'
    }
  },
  {
    email: 'biuro@rotterdam-express.nl',
    password: 'test123',
    firstName: 'Katarzyna',
    lastName: 'Wójcik',
    userType: 'carrier',
    companyName: 'Rotterdam Express Line',
    companyRegistration: 'NL-5432198',
    country: 'NL',
    description: 'Rotterdam-Wrocław-Warszawa codziennie. Busy Iveco Daily 14 miejsc. Duży bagażnik. Transport osób i przeprowadzki małogabarytowe.',
    phone: '+31 10 765 4321',
    services: ['transport', 'przeprowadzki'],
    rating: 4.6,
    reviewCount: 71,
    routes: [
      { from: 'Rotterdam', to: 'Wrocław', days: ['codziennie'], time: '19:30' },
      { from: 'Rotterdam', to: 'Warszawa', days: ['codziennie'], time: '19:00' }
    ],
    luggageInfo: {
      maxPieces: 3,
      maxWeight: 35,
      additionalInfo: 'Duży bagażnik Iveco Daily. Przeprowadzki małogabarytowe - kontakt telefoniczny.'
    }
  },
  {
    email: 'info@munchen-shuttle.de',
    password: 'test123',
    firstName: 'Michał',
    lastName: 'Kamiński',
    userType: 'carrier',
    companyName: 'München Shuttle Service',
    companyRegistration: 'DE-1122334',
    country: 'DE',
    description: 'Monachium-Kraków przez Pragę. Nowe busy Mercedes Sprinter. Darmowa kawa/herbata. Przejazdy środa-sobota. Pełna polisa.',
    phone: '+49 89 111 2233',
    services: ['transport', 'zwierzeta'],
    rating: 4.9,
    reviewCount: 94,
    routes: [
      { from: 'Monachium', to: 'Kraków', days: ['środa', 'sobota'], time: '07:00' }
    ],
    luggageInfo: {
      maxPieces: 2,
      maxWeight: 25,
      additionalInfo: 'Transport zwierząt domowych w transporterach (małe psy, koty). Darmowa kawa/herbata. Pełna polisa ubezpieczeniowa.'
    }
  }
]

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing data
    console.log('Clearing existing carriers and users...')
    await User.deleteMany({ userType: 'carrier' })
    await Carrier.deleteMany({})
    console.log('✅ Cleared existing data')

    console.log('Creating test carriers...')
    
    for (const carrierData of seedCarriers) {
      // Create user
      const user = new User({
        email: carrierData.email,
        password: carrierData.password,
        firstName: carrierData.firstName,
        lastName: carrierData.lastName,
        userType: carrierData.userType
      })
      await user.save()

      // Create carrier profile
      const carrier = new Carrier({
        userId: user._id,
        companyName: carrierData.companyName,
        companyRegistration: carrierData.companyRegistration,
        country: carrierData.country,
        description: carrierData.description,
        phone: carrierData.phone,
        email: carrierData.email,
        services: carrierData.services,
        rating: carrierData.rating,
        reviewCount: carrierData.reviewCount,
        routes: carrierData.routes,
        luggageInfo: carrierData.luggageInfo,
        isVerified: true,
        isActive: true
      })
      await carrier.save()

      console.log(`✅ Created: ${carrierData.companyName}`)
    }

    console.log('\n🎉 Successfully seeded 10 test carriers!')
    console.log('📧 Email: kontakt@euroshuttle.de')
    console.log('🔑 Password: test123')
    console.log('(Same password for all test accounts)')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
