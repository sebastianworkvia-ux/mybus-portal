import express from 'express'
import crypto from 'crypto'
import bcryptjs from 'bcryptjs'
import User from '../models/User.js'
import nodemailer from 'nodemailer'

const router = express.Router()

// Create email transporter
const createTransporter = () => {
  // For production, use real SMTP service (Gmail, SendGrid, etc.)
  // For now, log to console
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

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email jest wymagany' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'Jeśli konto istnieje, link do resetu został wysłany na email' })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
    await user.save()

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`

    // Email content
    const message = `
      <h2>Reset hasła - MyBus</h2>
      <p>Otrzymałeś tę wiadomość, ponieważ Ty (lub ktoś inny) zażądał resetu hasła.</p>
      <p>Kliknij w poniższy link, aby ustawić nowe hasło:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #FF6B35; color: white; text-decoration: none; border-radius: 5px;">Resetuj hasło</a>
      <p>Link będzie ważny przez 1 godzinę.</p>
      <p>Jeśli nie żądałeś resetu hasła, zignoruj tę wiadomość.</p>
      <br>
      <p>Pozdrawiamy,<br>Zespół MyBus</p>
    `

    try {
      // If SMTP is configured, send email
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = createTransporter()
        await transporter.sendMail({
          from: `MyBus <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: 'Reset hasła - MyBus',
          html: message
        })
      } else {
        // For development: log reset link to console
        console.log('\n=== PASSWORD RESET LINK ===')
        console.log(`Email: ${user.email}`)
        console.log(`Link: ${resetUrl}`)
        console.log('===========================\n')
      }

      res.json({ message: 'Jeśli konto istnieje, link do resetu został wysłany na email' })
    } catch (emailError) {
      console.error('Email send error:', emailError)
      user.resetPasswordToken = undefined
      user.resetPasswordExpires = undefined
      await user.save()
      return res.status(500).json({ error: 'Błąd podczas wysyłania emaila' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Reset password with token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Hasło musi mieć minimum 6 znaków' })
    }

    // Hash the token from URL
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({ error: 'Token jest nieprawidłowy lub wygasł' })
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({ message: 'Hasło zostało zmienione pomyślnie' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
