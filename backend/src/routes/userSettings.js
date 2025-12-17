import express from 'express'
import bcryptjs from 'bcryptjs'
import { authMiddleware } from '../middleware/auth.js'
import User from '../models/User.js'
import Carrier from '../models/Carrier.js'
import Review from '../models/Review.js'
import nodemailer from 'nodemailer'

const router = express.Router()

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Wszystkie pola są wymagane' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nowe hasło musi mieć minimum 6 znaków' })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' })
    }

    // Verify current password
    const isMatch = await bcryptjs.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Obecne hasło jest nieprawidłowe' })
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = newPassword
    await user.save()

    res.json({ message: 'Hasło zostało zmienione pomyślnie' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete account
router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const { password, confirmation } = req.body

    if (confirmation !== 'USUŃ KONTO') {
      return res.status(400).json({ error: 'Nieprawidłowe potwierdzenie' })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' })
    }

    // Verify password
    const isMatch = await bcryptjs.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Nieprawidłowe hasło' })
    }

    // Delete associated data
    if (user.userType === 'carrier') {
      await Carrier.deleteMany({ userId: user._id })
    }
    await Review.deleteMany({ userId: user._id })
    
    // Delete user
    await User.findByIdAndDelete(user._id)

    res.json({ message: 'Konto zostało usunięte' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Send feedback
router.post('/send-feedback', authMiddleware, async (req, res) => {
  try {
    const { subject, message } = req.body

    if (!subject || !message) {
      return res.status(400).json({ error: 'Temat i wiadomość są wymagane' })
    }

    if (message.length < 10) {
      return res.status(400).json({ error: 'Wiadomość musi mieć minimum 10 znaków' })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' })
    }

    const emailContent = `
      <h2>Nowe zgłoszenie od użytkownika</h2>
      <p><strong>Od:</strong> ${user.firstName} ${user.lastName} (${user.email})</p>
      <p><strong>Typ konta:</strong> ${user.userType === 'carrier' ? 'Przewoźnik' : 'Klient'}</p>
      <p><strong>Temat:</strong> ${subject}</p>
      <hr>
      <h3>Treść wiadomości:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><small>Data: ${new Date().toLocaleString('pl-PL')}</small></p>
    `

    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = createTransporter()
        await transporter.sendMail({
          from: `MyBus <${process.env.SMTP_USER}>`,
          to: 'kontakt.mybus@gmail.com',
          replyTo: user.email,
          subject: `[MyBus] ${subject}`,
          html: emailContent
        })
      } else {
        // Log to console for development
        console.log('\n=== FEEDBACK FROM USER ===')
        console.log(`From: ${user.email}`)
        console.log(`Subject: ${subject}`)
        console.log(`Message: ${message}`)
        console.log('========================\n')
      }

      res.json({ message: 'Wiadomość została wysłana pomyślnie' })
    } catch (emailError) {
      console.error('Email send error:', emailError)
      return res.status(500).json({ error: 'Błąd podczas wysyłania wiadomości' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
