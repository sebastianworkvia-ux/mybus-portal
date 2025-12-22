import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { syncUserToAirtable } from '../services/airtableService.js'

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, companyName, userType, marketingConsent } = req.body

    // Validate
    if (!email || !password || !userType) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validate based on userType
    if (userType === 'carrier' && !companyName) {
      return res.status(400).json({ error: 'Company name is required for carriers' })
    }

    if (userType === 'customer' && (!firstName || !lastName)) {
      return res.status(400).json({ error: 'First name and last name are required for customers' })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' })
    }

    // Create user
    const user = new User({
      email,
      password,
      firstName: userType === 'carrier' ? companyName : firstName,
      lastName: userType === 'carrier' ? 'Firma' : lastName,
      userType,
      marketingConsent: marketingConsent || false
    })

    await user.save()

    // Synchronizacja do Airtable (asynchronicznie, nie blokuje odpowiedzi)
    syncUserToAirtable(user).catch(err => 
      console.error('Airtable sync failed:', err.message)
    )

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        userType: user.userType,
        isPremium: user.isPremium || false,
        isAdmin: user.isAdmin || false
      }
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check if account is active
    if (user.isActive === false) {
      return res.status(403).json({ error: 'Account has been deactivated. Please contact support.' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        userType: user.userType,
        isPremium: user.isPremium || false,
        isAdmin: user.isAdmin || false
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    res.json(user)
  } catch (error) {
    next(error)
  }
}
