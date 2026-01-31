import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { sanitizeBodyMiddleware } from './utils/textUtils.js'
import authRoutes from './routes/auth.js'
import carrierRoutes from './routes/carriers.js'
import adminRoutes from './routes/admin.js'
import adminStatsRoutes from './routes/adminStats.js'
import reviewRoutes from './routes/reviews.js'
import passwordResetRoutes from './routes/passwordReset.js'
import userSettingsRoutes from './routes/userSettings.js'
import paymentRoutes from './routes/payments.js'
import analyticsRoutes from './routes/analytics.js'
import importRoutes from './routes/import.js'
import messageRoutes from './routes/messages.js'
import { errorHandler } from './middleware/auth.js'

dotenv.config()

const app = express()

// Render / reverse proxy support (required for express-rate-limit with X-Forwarded-For)
app.set('trust proxy', 1)

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

// Body parsing - jawne UTF-8
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Wymusz UTF-8 dla wszystkich requestów
    req.rawBody = buf.toString('utf8')
  }
}))
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  charset: 'utf-8'
}))

// Set UTF-8 charset for all responses (polskie znaki: ąćęłńóśźż)
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Language', 'pl')
  res.setHeader('Accept-Charset', 'utf-8')
  
  // Override res.json to ensure UTF-8
  const originalJson = res.json.bind(res)
  res.json = function(data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return originalJson(data)
  }
  
  next()
})

// Sanityzuj dane wejściowe (napraw encoding)
app.use(sanitizeBodyMiddleware)

// MongoDB Connection z UTF-8
mongoose.set('strictQuery', false)
mongoose.connect(process.env.MONGODB_URI, {
  // MongoDB domyślnie używa UTF-8, ale wymuszamy to dla pewności
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected with UTF-8 support'))
  .catch(err => console.log('MongoDB connection error:', err))

// Routes
app.get('/health', (req, res) => {
  res.json({ message: 'Backend is running' })
})

app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running' })
})

// Test UTF-8 endpoint (polskie znaki: ąćęłńóśźż)
app.get('/test-utf8', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Test polskich znaków UTF-8',
    chars: 'ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ',
    sample: {
      firma: 'Przewoźnik Szczęśliwy Sp. z o.o.',
      opis: 'Szybki i tani transport paczek do Polski. Obsługujemy Niemcy, Holandię i Belgię.',
      miasta: ['Kraków', 'Gdańsk', 'Wrocław', 'Łódź', 'Poznań'],
      usługi: ['przewóz osób', 'przesyłki kurierskie', 'przeprowadzki']
    },
    test: {
      question: 'Czy widzisz polskie znaki?',
      answer: 'Jeśli tak, to wszystko działa świetnie! 🇵🇱'
    }
  })
})

app.get('/api/test-utf8', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Test polskich znaków UTF-8',
    chars: 'ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ',
    sample: {
      firma: 'Przewoźnik Szczęśliwy Sp. z o.o.',
      opis: 'Szybki i tani transport paczek do Polski. Obsługujemy Niemcy, Holandię i Belgię.',
      miasta: ['Kraków', 'Gdańsk', 'Wrocław', 'Łódź', 'Poznań'],
      usługi: ['przewóz osób', 'przesyłki kurierskie', 'przeprowadzki']
    },
    test: {
      question: 'Czy widzisz polskie znaki?',
      answer: 'Jeśli tak, to wszystko działa świetnie! 🇵🇱'
    }
  })
})

app.use('/auth', authRoutes)
app.use('/carriers', carrierRoutes)
app.use('/admin', adminStatsRoutes) // MUSI BYĆ PRZED adminRoutes - bardziej konkretny endpoint
app.use('/admin', adminRoutes)
app.use('/reviews', reviewRoutes)
app.use('/password', passwordResetRoutes)
app.use('/user', userSettingsRoutes)
app.use('/payments', paymentRoutes)
app.use('/analytics', analyticsRoutes)
app.use('/import', importRoutes)
app.use('/messages', messageRoutes)

// /api prefixed routes for frontend baseURL '/api'
app.use('/api/auth', authRoutes)
app.use('/api/carriers', carrierRoutes)
app.use('/api/admin', adminStatsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/password', passwordResetRoutes)
app.use('/api/user', userSettingsRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/import', importRoutes)
app.use('/api/messages', messageRoutes)

// Error handling middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})
