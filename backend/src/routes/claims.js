import express from 'express'
import rateLimit from 'express-rate-limit'
import nodemailer from 'nodemailer'
import ClaimRequest from '../models/ClaimRequest.js'
import Carrier from '../models/Carrier.js'

const router = express.Router()

// Dedykowany rate limiter: max 5 zgłoszeń / 15 min / IP
const claimLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Zbyt wiele zgłoszeń z tego adresu IP. Spróbuj ponownie za 15 minut.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Email transporter (wzorzec z userSettings.js)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

const roleLabels = {
  owner: 'Właściciel',
  employee: 'Pracownik',
  representative: 'Przedstawiciel firmy',
  other: 'Inna'
}

// POST /api/claims — publiczny endpoint zgłoszenia przejęcia profilu
router.post('/', claimLimiter, async (req, res) => {
  try {
    const {
      carrierId,
      carrierSlug,
      companyName,
      requesterName,
      requesterEmail,
      requesterPhone,
      roleInCompany,
      message,
      consent
    } = req.body

    // --- Walidacja pól wymaganych ---
    if (!carrierId) {
      return res.status(400).json({ error: 'Brak identyfikatora firmy (carrierId).' })
    }
    if (!requesterName || !requesterName.trim()) {
      return res.status(400).json({ error: 'Imię i nazwisko są wymagane.' })
    }
    if (!requesterEmail || !requesterEmail.trim()) {
      return res.status(400).json({ error: 'Adres email jest wymagany.' })
    }
    // Prosta walidacja formatu email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(requesterEmail)) {
      return res.status(400).json({ error: 'Podaj poprawny adres email.' })
    }
    if (!roleInCompany || !['owner', 'employee', 'representative', 'other'].includes(roleInCompany)) {
      return res.status(400).json({ error: 'Rola w firmie jest wymagana.' })
    }
    if (!consent) {
      return res.status(400).json({ error: 'Wymagana zgoda na przetwarzanie danych.' })
    }

    // --- Sprawdź czy carrier istnieje ---
    const carrier = await Carrier.findById(carrierId).lean()
    if (!carrier) {
      return res.status(404).json({ error: 'Profil firmy nie istnieje.' })
    }

    // --- Sprawdź czy profil jest już przejęty ---
    if (carrier.userId) {
      return res.status(409).json({ error: 'Ten profil jest już zarządzany przez właściciela. Jeśli to Twoja firma, skontaktuj się z nami na kontakt.mybus@gmail.com.' })
    }

    // --- Deduplikacja: 1 zgłoszenie per (carrierId + email) w ciągu 24h ---
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const existing = await ClaimRequest.findOne({
      carrierId,
      requesterEmail: requesterEmail.toLowerCase().trim(),
      createdAt: { $gte: oneDayAgo }
    })
    if (existing) {
      return res.status(429).json({
        error: 'Zgłoszenie dla tego profilu zostało już wysłane. Poczekaj na kontakt administratora.'
      })
    }

    // --- Zapisz zgłoszenie ---
    const claim = await ClaimRequest.create({
      carrierId,
      carrierSlug: carrierSlug || carrier.slug || '',
      companyName: companyName || carrier.companyName || '',
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.toLowerCase().trim(),
      requesterPhone: requesterPhone ? requesterPhone.trim() : '',
      roleInCompany,
      message: message ? message.trim().slice(0, 1000) : '',
      status: 'pending',
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || ''
    })

    // --- Email do admina (fire-and-forget) ---
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const slug = carrierSlug || carrier.slug || carrierId
      const profileUrl = `https://my-bus.eu/carrier/${slug}`
      const adminUrl = `https://my-bus.eu/admin`

      const emailHtml = `
        <h2>🏢 Nowe zgłoszenie przejęcia profilu — my-bus.eu</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px">
          <tr><td style="padding:6px 12px;background:#f8f9fa;font-weight:bold">Firma</td><td style="padding:6px 12px">${companyName || carrier.companyName}</td></tr>
          <tr><td style="padding:6px 12px;background:#f8f9fa;font-weight:bold">Link do profilu</td><td style="padding:6px 12px"><a href="${profileUrl}">${profileUrl}</a></td></tr>
          <tr><td style="padding:6px 12px;background:#f8f9fa;font-weight:bold">Imię i nazwisko</td><td style="padding:6px 12px">${requesterName.trim()}</td></tr>
          <tr><td style="padding:6px 12px;background:#f8f9fa;font-weight:bold">Email</td><td style="padding:6px 12px">${requesterEmail}</td></tr>
          <tr><td style="padding:6px 12px;background:#f8f9fa;font-weight:bold">Telefon</td><td style="padding:6px 12px">${requesterPhone || '—'}</td></tr>
          <tr><td style="padding:6px 12px;background:#f8f9fa;font-weight:bold">Rola w firmie</td><td style="padding:6px 12px">${roleLabels[roleInCompany] || roleInCompany}</td></tr>
          <tr><td style="padding:6px 12px;background:#f8f9fa;font-weight:bold">Wiadomość</td><td style="padding:6px 12px">${message ? message.trim().replace(/\n/g, '<br>') : '—'}</td></tr>
          <tr><td style="padding:6px 12px;background:#f8f9fa;font-weight:bold">ID zgłoszenia</td><td style="padding:6px 12px">${claim._id}</td></tr>
          <tr><td style="padding:6px 12px;background:#f8f9fa;font-weight:bold">Data</td><td style="padding:6px 12px">${new Date().toLocaleString('pl-PL')}</td></tr>
        </table>
        <br>
        <p style="color:#dc2626;font-weight:bold">⚠️ Zgłoszenie wymaga ręcznej weryfikacji. Profil NIE został automatycznie przypisany.</p>
        <p>Aby przypisać profil po weryfikacji, przejdź do panelu admina:<br>
        <a href="${adminUrl}">${adminUrl}</a><br>
        → Znajdź firmę → Assign User → podaj email użytkownika.</p>
        <p>Odpowiedz na ten email lub skontaktuj się z ${requesterEmail} po weryfikacji.</p>
      `

      createTransporter().sendMail({
        from: `MyBus <${process.env.SMTP_USER}>`,
        to: process.env.CLAIM_ADMIN_EMAIL || process.env.SMTP_USER || 'kontakt.mybus@gmail.com',
        replyTo: requesterEmail,
        subject: `[MyBus Claim] Przejęcie profilu: ${companyName || carrier.companyName}`,
        html: emailHtml
      }).catch((err) => {
        console.error('⚠️ Claim email send error (non-blocking):', err.message)
      })
    } else {
      // Dev fallback: log to console
      console.log('\n=== CLAIM REQUEST (no SMTP configured) ===')
      console.log(`Firma: ${companyName || carrier.companyName}`)
      console.log(`Od: ${requesterName.trim()} <${requesterEmail}>`)
      console.log(`Rola: ${roleInCompany}`)
      console.log(`Profil: https://my-bus.eu/carrier/${carrierSlug || carrier.slug || carrierId}`)
      console.log('==========================================\n')
    }

    res.status(201).json({
      message: 'Zgłoszenie zostało przyjęte. Skontaktujemy się po weryfikacji.'
    })
  } catch (error) {
    console.error('❌ Claim request error:', error)
    res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' })
  }
})

export default router
