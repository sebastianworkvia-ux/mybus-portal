import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin only.' })
    }

    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong'
  })
}
