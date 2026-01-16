import Carrier from '../models/Carrier.js'
import User from '../models/User.js'

export const getCarriers = async (req, res, next) => {
  try {
    const { routeFrom, routeTo, service, search } = req.query
    const query = { isActive: true, isVerified: true }

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

    // Premium carriers first, then free carriers
    const carriers = await Carrier.find(query)
      .select('-__v')
      .sort({ isPremium: -1, createdAt: -1 })
    res.json(carriers)
  } catch (error) {
    next(error)
  }
}

export const getCarrierById = async (req, res, next) => {
  try {
    const { id } = req.params
    const carrier = await Carrier.findById(id).select('-__v')
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
    const { companyName, companyRegistration, country, description, services } =
      req.body

    const existingCarrier = await Carrier.findOne({ userId: req.user.id })
    if (existingCarrier) {
      return res.status(409).json({ error: 'Carrier profile already exists' })
    }

    const carrier = new Carrier({
      userId: req.user.id,
      companyName,
      companyRegistration,
      country: country.toUpperCase(),
      description,
      services
    })

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
