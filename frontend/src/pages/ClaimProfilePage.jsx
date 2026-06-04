import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { carrierService, claimService } from '../services/services'
import './ClaimProfilePage.css'

const ROLE_OPTIONS = [
  { value: '', label: '— Wybierz rolę —' },
  { value: 'owner', label: 'Właściciel' },
  { value: 'employee', label: 'Pracownik' },
  { value: 'representative', label: 'Przedstawiciel firmy' },
  { value: 'other', label: 'Inna' }
]

export default function ClaimProfilePage() {
  const { slug } = useParams()

  const [carrier, setCarrier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  const [form, setForm] = useState({
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    roleInCompany: '',
    message: '',
    consent: false
  })
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    const fetchCarrier = async () => {
      try {
        const res = await carrierService.getCarrierById(slug)
        setCarrier(res.data)
      } catch (err) {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchCarrier()
  }, [slug])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setFieldErrors(prev => ({ ...prev, [name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const errors = {}
    if (!form.requesterName.trim()) errors.requesterName = 'Imię i nazwisko są wymagane.'
    if (!form.requesterEmail.trim()) {
      errors.requesterEmail = 'Adres email jest wymagany.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.requesterEmail)) {
      errors.requesterEmail = 'Podaj poprawny adres email.'
    }
    if (!form.roleInCompany) errors.roleInCompany = 'Wybierz swoją rolę w firmie.'
    if (!form.consent) errors.consent = 'Zgoda jest wymagana, aby wysłać zgłoszenie.'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    setServerError('')

    try {
      await claimService.submitClaim({
        carrierId: carrier._id,
        carrierSlug: carrier.slug || slug,
        companyName: carrier.companyName,
        requesterName: form.requesterName.trim(),
        requesterEmail: form.requesterEmail.trim(),
        requesterPhone: form.requesterPhone.trim(),
        roleInCompany: form.roleInCompany,
        message: form.message.trim(),
        consent: form.consent
      })
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.error || 'Błąd serwera. Spróbuj ponownie później.'
      setServerError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // --- Stany ładowania ---
  if (loading) {
    return (
      <div className="claim-page">
        <div className="claim-container">
          <p className="claim-loading">Ładowanie danych firmy…</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="claim-page">
        <Helmet>
          <title>Profil nie znaleziony | My-Bus.eu</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="claim-container">
          <div className="claim-error-state">
            <span className="claim-error-icon">🔍</span>
            <h1>Nie znaleziono profilu</h1>
            <p>Profil firmy o tym adresie nie istnieje lub został usunięty.</p>
            <Link to="/search" className="claim-btn-back">← Wróć do wyszukiwarki</Link>
          </div>
        </div>
      </div>
    )
  }

  // --- Profil już przejęty ---
  if (carrier.userId) {
    return (
      <div className="claim-page">
        <Helmet>
          <title>Profil zarządzany | My-Bus.eu</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="claim-container">
          <div className="claim-error-state">
            <span className="claim-error-icon">🔒</span>
            <h1>Profil już zarządzany</h1>
            <p>Ten profil jest już zarządzany przez właściciela.</p>
            <p className="claim-error-sub">Jeśli to Twoja firma i uważasz, że to błąd, napisz do nas: <a href="mailto:kontakt.mybus@gmail.com">kontakt.mybus@gmail.com</a></p>
            <div className="claim-error-actions">
              <Link to="/login" className="claim-btn-primary">Zaloguj się</Link>
              <Link to={`/carrier/${carrier.slug || carrier._id}`} className="claim-btn-back">← Wróć do profilu</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- Stan sukcesu ---
  if (success) {
    return (
      <div className="claim-page">
        <Helmet>
          <title>Zgłoszenie wysłane | My-Bus.eu</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="claim-container">
          <div className="claim-success-state">
            <span className="claim-success-icon">✅</span>
            <h1>Zgłoszenie wysłane</h1>
            <p>Zgłoszenie zostało wysłane. Sprawdzimy dane i skontaktujemy się z Tobą po weryfikacji.</p>
            <p className="claim-success-note">Weryfikacja trwa zazwyczaj do 48 godzin roboczych.</p>
            <Link to={`/carrier/${carrier.slug || carrier._id}`} className="claim-btn-back">← Wróć do profilu firmy</Link>
          </div>
        </div>
      </div>
    )
  }

  // --- Formularz ---
  return (
    <div className="claim-page">
      <Helmet>
        <title>Przejmij profil: {carrier.companyName} | My-Bus.eu</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="claim-container">
        <nav className="claim-breadcrumbs">
          <Link to="/">Strona główna</Link>
          <span className="claim-sep">›</span>
          <Link to={`/carrier/${carrier.slug || carrier._id}`}>{carrier.companyName}</Link>
          <span className="claim-sep">›</span>
          <span>Przejmij profil</span>
        </nav>

        <div className="claim-header">
          <span className="claim-company-icon">🏢</span>
          <div>
            <h1 className="claim-title">Przejmij profil firmy</h1>
            <p className="claim-company-name">{carrier.companyName}</p>
          </div>
        </div>

        <div className="claim-info-box">
          <p>
            Po wysłaniu zgłoszenia sprawdzimy, czy jesteś właścicielem lub upoważnionym przedstawicielem firmy.
            Samo wysłanie formularza nie oznacza automatycznego przejęcia profilu.
          </p>
          <p>Po weryfikacji skontaktujemy się z Tobą i przyznamy dostęp do edycji profilu.</p>
        </div>

        <form className="claim-form" onSubmit={handleSubmit} noValidate>
          <div className="claim-field">
            <label htmlFor="requesterName">Imię i nazwisko <span className="required">*</span></label>
            <input
              id="requesterName"
              name="requesterName"
              type="text"
              value={form.requesterName}
              onChange={handleChange}
              autoComplete="name"
              placeholder="Jan Kowalski"
            />
            {fieldErrors.requesterName && <span className="claim-field-error">{fieldErrors.requesterName}</span>}
          </div>

          <div className="claim-field">
            <label htmlFor="requesterEmail">Adres email <span className="required">*</span></label>
            <input
              id="requesterEmail"
              name="requesterEmail"
              type="email"
              value={form.requesterEmail}
              onChange={handleChange}
              autoComplete="email"
              placeholder="jan@firma.pl"
            />
            {fieldErrors.requesterEmail && <span className="claim-field-error">{fieldErrors.requesterEmail}</span>}
          </div>

          <div className="claim-field">
            <label htmlFor="requesterPhone">Telefon <span className="optional">(opcjonalnie)</span></label>
            <input
              id="requesterPhone"
              name="requesterPhone"
              type="tel"
              value={form.requesterPhone}
              onChange={handleChange}
              autoComplete="tel"
              placeholder="+48 600 000 000"
            />
          </div>

          <div className="claim-field">
            <label htmlFor="roleInCompany">Rola w firmie <span className="required">*</span></label>
            <select
              id="roleInCompany"
              name="roleInCompany"
              value={form.roleInCompany}
              onChange={handleChange}
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.value === ''}>{opt.label}</option>
              ))}
            </select>
            {fieldErrors.roleInCompany && <span className="claim-field-error">{fieldErrors.roleInCompany}</span>}
          </div>

          <div className="claim-field">
            <label htmlFor="message">Dodatkowa wiadomość <span className="optional">(opcjonalnie)</span></label>
            <textarea
              id="message"
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={4}
              maxLength={1000}
              placeholder="Możesz opisać, jak możemy zweryfikować Twoje powiązanie z firmą (np. NIP, strona WWW, numer licencji)."
            />
          </div>

          <div className="claim-field claim-field--checkbox">
            <label className="claim-checkbox-label">
              <input
                type="checkbox"
                name="consent"
                checked={form.consent}
                onChange={handleChange}
              />
              <span>
                Potwierdzam, że jestem właścicielem lub upoważnionym przedstawicielem tej firmy
                i zgadzam się na kontakt w sprawie weryfikacji zgłoszenia. <span className="required">*</span>
              </span>
            </label>
            {fieldErrors.consent && <span className="claim-field-error">{fieldErrors.consent}</span>}
          </div>

          {serverError && (
            <div className="claim-server-error">{serverError}</div>
          )}

          <button
            type="submit"
            className="claim-btn-submit"
            disabled={submitting}
          >
            {submitting ? 'Wysyłanie…' : '✅ Wyślij zgłoszenie'}
          </button>
        </form>
      </div>
    </div>
  )
}
