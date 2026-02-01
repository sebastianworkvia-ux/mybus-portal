import Carrier from '../models/Carrier.js'
import User from '../models/User.js'

export const getCarriers = async (req, res, next) => {
  try {
    const { routeFrom, routeTo, service, search } = req.query
    console.log('🔍 GET /carriers params:', { routeFrom, routeTo, service, search })
    
    const query = { isActive: true }

    // Filtrowanie po krajach obsługi
    if (routeFrom || routeTo) {
      const countryConditions = []
      if (routeFrom) countryConditions.push(routeFrom.toUpperCase())
      if (routeTo) countryConditions.push(routeTo.toUpperCase())
      
      // Przewoźnik musi obsługiwać oba kraje (jeśli podane)
      query.operatingCountries = { $all: countryConditions }
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

export const createCarrier = async (req, res, next) => {
  try {
    const existingCarrier = await Carrier.findOne({ userId: req.user.id })
    if (existingCarrier) {
      return res.status(409).json({ error: 'Carrier profile already exists' })
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
