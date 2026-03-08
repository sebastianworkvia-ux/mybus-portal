import Carrier from '../models/Carrier.js'
import User from '../models/User.js'
import { checkProfanityInObject } from '../utils/textUtils.js'

export const getCarriers = async (req, res, next) => {
  try {
    const { routeFrom, routeTo, service, search, voivodeship, hasPromo } = req.query
    console.log('🔍 GET /carriers params:', { routeFrom, routeTo, service, search, voivodeship, hasPromo })
    
    const query = { isActive: true }

    // Filtruj tylko przewoźników z aktywną promocją
    if (hasPromo === 'true') {
      query['promoOffer.isActive'] = true
      query['promoOffer.validUntil'] = { $gt: new Date() }
      query.subscriptionPlan = { $in: ['premium', 'business'] }
    }

    // Filtrowanie po krajach obsługi
    if (routeFrom || routeTo) {
      const countryConditions = []
      if (routeFrom) countryConditions.push(routeFrom.toUpperCase())
      if (routeTo) countryConditions.push(routeTo.toUpperCase())
      
      // Przewoźnik musi obsługiwać oba kraje (jeśli podane)
      query.operatingCountries = { $all: countryConditions }
    }

    if (voivodeship) {
      query.servedVoivodeships = voivodeship
    }

    if (service) query.services = service
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Business first, then Premium, then free carriers
    const carriers = await Carrier.find(query)
      .select('-__v')
      .lean()
    
    // Custom sort: business > premium > free
    carriers.sort((a, b) => {
      const getPriority = (carrier) => {
        if (carrier.subscriptionPlan === 'business') return 3
        if (carrier.subscriptionPlan === 'premium') return 2
        return 1
      }
      return getPriority(b) - getPriority(a)
    })
    
    console.log(`✅ Znaleziono ${carriers.length} przewoźników`)
    res.json(carriers)
  } catch (error) {
    next(error)
  }
}

export const getCarrierById = async (req, res, next) => {
  try {
    const { id } = req.params
    const carrier = await Carrier.findById(id)
      .populate('userId', 'email firstName lastName')
      .select('-__v')
    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' })
    }
    res.json(carrier)
  } catch (error) {
    next(error)
  }
}

export const getMyCarrier = async (req, res, next) => {
  try {
    const carrier = await Carrier.findOne({ userId: req.user.id })
      .select('-__v')
      .lean()
    
    if (!carrier) {
      return res.status(404).json({ error: 'Carrier profile not found' })
    }
    
    res.json(carrier)
  } catch (error) {
    next(error)
  }
}

export const createCarrier = async (req, res, next) => {
  try {
    const existingCarrier = await Carrier.findOne({ userId: req.user.id })
    if (existingCarrier) {
      return res.status(409).json({ error: 'Carrier profile already exists' })
    }

    // Sprawdź czy dane zawierają wulgarne/obraźliwe słowa
    const profanityField = checkProfanityInObject(req.body)
    if (profanityField) {
      return res.status(400).json({ 
        error: 'Zawartość zawiera niedozwolone słowa',
        field: profanityField,
        message: `Pole "${profanityField}" zawiera obraźliwe lub wulgarne treści. Prosimy o wprowadzenie profesjonalnych informacji.`
      })
    }

    // Pobierz dane użytkownika
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Utwórz obiekt z wszystkich dozwolonych pól w req.body
    // Mongoose przefiltruje pola, które nie są w schemacie, ale warto być jawnym
    const carrierData = {
      ...req.body,
      userId: req.user.id,
      country: req.body.country ? req.body.country.toUpperCase() : undefined,
    }

    const carrier = new Carrier(carrierData)

    // Jeśli użytkownik ma aktywną subskrypcję, przypisz ją do firmy
    if (user.subscriptionPlan && user.subscriptionExpiry) {
      const now = new Date()
      if (user.subscriptionExpiry > now) {
        carrier.subscriptionPlan = user.subscriptionPlan
        carrier.isPremium = ['premium', 'business'].includes(user.subscriptionPlan)
        carrier.subscriptionExpiry = user.subscriptionExpiry
        console.log(`✅ Przypisano plan ${user.subscriptionPlan} do nowej firmy ${companyName}`)
      }
    }

    await carrier.save()

    res.status(201).json(carrier)
  } catch (error) {
    next(error)
  }
}

export const updateCarrier = async (req, res, next) => {
  try {
    const carrier = await Carrier.findOne({ userId: req.user.id })
    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' })
    }

    // Sprawdź czy dane zawierają wulgarne/obraźliwe słowa
    const profanityField = checkProfanityInObject(req.body)
    if (profanityField) {
      return res.status(400).json({ 
        error: 'Zawartość zawiera niedozwolone słowa',
        field: profanityField,
        message: `Pole "${profanityField}" zawiera obraźliwe lub wulgarne treści. Prosimy o wprowadzenie profesjonalnych informacji.`
      })
    }

    Object.assign(carrier, req.body)
    await carrier.save()

    res.json(carrier)
  } catch (error) {
    next(error)
  }
}

export const deleteCarrier = async (req, res, next) => {
  try {
    const carrier = await Carrier.findOne({ userId: req.user.id })
    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' })
    }

    await Carrier.deleteOne({ _id: carrier._id })
    res.json({ message: 'Carrier deleted' })
  } catch (error) {
    next(error)
  }
}

// Get carriers by destination country (for SEO pages)
export const getCarriersByDestination = async (req, res, next) => {
  try {
    const { country } = req.params
    
    // Map country path to country code
    const countryMap = {
      'germany': 'DE',
      'niemcy': 'DE',
      'netherlands': 'NL',
      'holandia': 'NL',
      'belgium': 'BE',
      'belgia': 'BE',
      'france': 'FR',
      'francja': 'FR',
      'austria': 'AT',
      'austria': 'AT',
      'denmark': 'DK',
      'dania': 'DK',
      'norway': 'NO',
      'norwegia': 'NO',
      'sweden': 'SE',
      'szwecja': 'SE',
      'switzerland': 'CH',
      'szwajcaria': 'CH',
      'luxembourg': 'LU',
      'luksemburg': 'LU',
      'england': 'GB',
      'anglia': 'GB',
      'uk': 'GB'
    }
    
    const countryCode = countryMap[country.toLowerCase()]
    
    if (!countryCode) {
      return res.status(404).json({ error: 'Country not found' })
    }
    
    console.log(`🔍 GET /carriers/by-destination/${country} → ${countryCode}`)
    
    // Find carriers that operate in this country
    const carriers = await Carrier.find({
      isActive: true,
      operatingCountries: countryCode
    })
      .select('-__v')
      .lean()
    
    // Sort: business > premium > free
    carriers.sort((a, b) => {
      const getPriority = (carrier) => {
        if (carrier.subscriptionPlan === 'business') return 3
        if (carrier.subscriptionPlan === 'premium') return 2
        return 1
      }
      return getPriority(b) - getPriority(a)
    })
    
    console.log(`✅ Znaleziono ${carriers.length} przewoźników do ${country}`)
    
    res.json({
      country: country,
      countryCode: countryCode,
      carriers: carriers,
      count: carriers.length
    })
  } catch (error) {
    next(error)
  }
}

// City to country/voivodeship mapping for route pages
const CITY_INFO = {
  // Polish cities
  'warsaw': { pl: 'Warszawa', country: 'PL', voivodeship: 'Mazowieckie' },
  'warszawa': { pl: 'Warszawa', country: 'PL', voivodeship: 'Mazowieckie' },
  'krakow': { pl: 'Kraków', country: 'PL', voivodeship: 'Małopolskie' },
  'cracow': { pl: 'Kraków', country: 'PL', voivodeship: 'Małopolskie' },
  'wroclaw': { pl: 'Wrocław', country: 'PL', voivodeship: 'Dolnośląskie' },
  'poznan': { pl: 'Poznań', country: 'PL', voivodeship: 'Wielkopolskie' },
  'gdansk': { pl: 'Gdańsk', country: 'PL', voivodeship: 'Pomorskie' },
  'szczecin': { pl: 'Szczecin', country: 'PL', voivodeship: 'Zachodniopomorskie' },
  'lodz': { pl: 'Łódź', country: 'PL', voivodeship: 'Łódzkie' },
  'katowice': { pl: 'Katowice', country: 'PL', voivodeship: 'Śląskie' },
  'lublin': { pl: 'Lublin', country: 'PL', voivodeship: 'Lubelskie' },
  'bialystok': { pl: 'Białystok', country: 'PL', voivodeship: 'Podlaskie' },
  
  // German cities
  'berlin': { pl: 'Berlin', country: 'DE', voivodeship: null },
  'munich': { pl: 'Monachium', country: 'DE', voivodeship: null },
  'monachium': { pl: 'Monachium', country: 'DE', voivodeship: null },
  'hamburg': { pl: 'Hamburg', country: 'DE', voivodeship: null },
  'cologne': { pl: 'Kolonia', country: 'DE', voivodeship: null },
  'frankfurt': { pl: 'Frankfurt', country: 'DE', voivodeship: null },
  'dortmund': { pl: 'Dortmund', country: 'DE', voivodeship: null },
  'dusseldorf': { pl: 'Düsseldorf', country: 'DE', voivodeship: null },
  'bremen': { pl: 'Brema', country: 'DE', voivodeship: null },
  'hannover': { pl: 'Hanower', country: 'DE', voivodeship: null },
  
  // Dutch cities
  'amsterdam': { pl: 'Amsterdam', country: 'NL', voivodeship: null },
  'rotterdam': { pl: 'Rotterdam', country: 'NL', voivodeship: null },
  'hague': { pl: 'Haga', country: 'NL', voivodeship: null },
  'utrecht': { pl: 'Utrecht', country: 'NL', voivodeship: null },
  'eindhoven': { pl: 'Eindhoven', country: 'NL', voivodeship: null },
  
  // Belgian cities
  'brussels': { pl: 'Bruksela', country: 'BE', voivodeship: null },
  'antwerp': { pl: 'Antwerpia', country: 'BE', voivodeship: null },
  'ghent': { pl: 'Gandawa', country: 'BE', voivodeship: null },
  'bruges': { pl: 'Brugia', country: 'BE', voivodeship: null },
  
  // French cities
  'paris': { pl: 'Paryż', country: 'FR', voivodeship: null },
  'lyon': { pl: 'Lyon', country: 'FR', voivodeship: null },
  'marseille': { pl: 'Marsylia', country: 'FR', voivodeship: null },
  
  // Austrian cities
  'vienna': { pl: 'Wiedeń', country: 'AT', voivodeship: null },
  'wien': { pl: 'Wiedeń', country: 'AT', voivodeship: null },
  
  // UK cities
  'london': { pl: 'Londyn', country: 'GB', voivodeship: null },
  'manchester': { pl: 'Manchester', country: 'GB', voivodeship: null },
  'birmingham': { pl: 'Birmingham', country: 'GB', voivodeship: null }
}

export const getCarriersByRoute = async (req, res, next) => {
  try {
    const { fromCity, toCity } = req.params
    
    const fromInfo = CITY_INFO[fromCity.toLowerCase()]
    const toInfo = CITY_INFO[toCity.toLowerCase()]
    
    if (!fromInfo || !toInfo) {
      return res.status(404).json({ 
        error: 'City not found',
        message: 'One or both cities are not supported yet'
      })
    }
    
    console.log(`🔍 GET /carriers/route/${fromCity}/${toCity}`)
    console.log(`   From: ${fromInfo.pl} (${fromInfo.country})`)
    console.log(`   To: ${toInfo.pl} (${toInfo.country})`)
    
    // Build query to find carriers operating on this route
    const query = {
      isActive: true,
      $or: []
    }
    
    // 1. Carriers that operate in both countries
    if (fromInfo.country && toInfo.country) {
      query.$or.push({
        operatingCountries: { $all: [fromInfo.country, toInfo.country] }
      })
    }
    
    // 2. Carriers located in one of these cities
    query.$or.push({
      'location.city': { $in: [fromInfo.pl, toInfo.pl] }
    })
    
    // 3. For Polish cities: carriers serving these voivodeships
    if (fromInfo.voivodeship) {
      query.$or.push({
        servedVoivodeships: fromInfo.voivodeship,
        operatingCountries: toInfo.country
      })
    }
    if (toInfo.voivodeship) {
      query.$or.push({
        servedVoivodeships: toInfo.voivodeship,
        operatingCountries: fromInfo.country
      })
    }
    
    const carriers = await Carrier.find(query)
      .select('-__v')
      .lean()
    
    // Sort: business > premium > free
    carriers.sort((a, b) => {
      const getPriority = (carrier) => {
        if (carrier.subscriptionPlan === 'business') return 3
        if (carrier.subscriptionPlan === 'premium') return 2
        return 1
      }
      return getPriority(b) - getPriority(a)
    })
    
    console.log(`✅ Znaleziono ${carriers.length} przewoźników na trasie ${fromCity}-${toCity}`)
    
    res.json({
      route: {
        from: { slug: fromCity, name: fromInfo.pl, country: fromInfo.country },
        to: { slug: toCity, name: toInfo.pl, country: toInfo.country }
      },
      carriers: carriers,
      count: carriers.length
    })
  } catch (error) {
    next(error)
  }
}
