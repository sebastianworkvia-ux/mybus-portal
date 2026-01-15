import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import carrierRoutes from './routes/carriers.js'
import adminRoutes from './routes/admin.js'
import adminStatsRoutes from './routes/adminStats.js'
import reviewRoutes from './routes/reviews.js'
import passwordResetRoutes from './routes/passwordReset.js'
import userSettingsRoutes from './routes/userSettings.js'
import paymentRoutes from './routes/payments.js'
import analyticsRoutes from './routes/analytics.js'
import airtableRoutes from './routes/airtable.js'
import importRoutes from './routes/import.js'
import { errorHandler } from './middleware/auth.js'

dotenv.config()

const app = express()

// Security Middleware
app.use(helmet()) // Zabezpiecza HTTP headers
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true 
}))

// Rate limiting - ochrona przed atakami
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // max 100 requestów z jednego IP
  message: 'Zbyt wiele żądań z tego adresu IP, spróbuj ponownie za 15 minut'
})
app.use(limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Set UTF-8 charset for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  next()
})

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err))

// Routes
app.get('/health', (req, res) => {
  res.json({ message: 'Backend is running' })
})

app.use('/auth', authRoutes)
app.use('/carriers', carrierRoutes)
app.use('/admin', adminRoutes)
app.use('/admin', adminStatsRoutes)
app.use('/reviews', reviewRoutes)
app.use('/password', passwordResetRoutes)
app.use('/user', userSettingsRoutes)
app.use('/payments', paymentRoutes)
app.use('/analytics', analyticsRoutes)
app.use('/airtable', airtableRoutes)
app.use('/import', importRoutes)

// Error handling middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
