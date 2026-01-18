import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import axios from 'axios'

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, companyName, userType, marketingConsent, recaptchaToken } = req.body

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA verification required' })
    }

    // Verify reCAPTCHA with Google
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'
    const recaptchaVerify = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`
    )

    if (!recaptchaVerify.data.success) {
      return res.status(400).json({ error: 'reCAPTCHA verification failed' })
    }

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
