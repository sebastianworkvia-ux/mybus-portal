import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import ReCAPTCHA from 'react-google-recaptcha'
import './AuthPages.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, error, loading } = useAuthStore()
  const recaptchaRef = useRef(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    userType: 'customer'
  })
  const [consents, setConsents] = useState({
    dataProcessing: false,
    marketing: false
  })
  const [recaptchaToken, setRecaptchaToken] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required consent
    if (!consents.dataProcessing) {
      alert('Musisz wyrazić zgodę na przetwarzanie danych osobowych, aby się zarejestrować.')
      return
    }

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      alert('Potwierdź, że nie jesteś robotem')
      return
    }
    
    try {
      // Add consents and reCAPTCHA token to registration data
      await register({
        ...formData,
        marketingConsent: consents.marketing,
        recaptchaToken
      })
      navigate('/')
    } catch (err) {
      // Error is handled by store
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset()
        setRecaptchaToken(null)
      }
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Rejestracja</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="userType">Rejestruję się jako:</label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
            >
              <option value="customer">Klient (szukam przewoźnika)</option>
              <option value="carrier">Przewoźnik (moja firma transportowa)</option>
            </select>
          </div>

          {formData.userType === 'carrier' ? (
            <div className="form-group">
              <label htmlFor="companyName">Nazwa firmy</label>
              <input
                id="companyName"
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Imię</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Nazwisko</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength="6"
              required
            />
          </div>

          <div className="consent-section">
            <div className="form-group-checkbox">
              <input
                id="dataProcessing"
                type="checkbox"
                checked={consents.dataProcessing}
                onChange={(e) => setConsents({...consents, dataProcessing: e.target.checked})}
              />
              <label htmlFor="dataProcessing">
                Wyrażam zgodę na przetwarzanie moich danych osobowych zgodnie z{' '}
                <Link to="/privacy" target="_blank" className="link-inline">
                  Polityką Prywatności
                </Link>{' '}
                <span className="required-mark">*</span>
              </label>
            </div>

            <div className="form-group-checkbox">
              <input
                id="marketing"
                type="checkbox"
                checked={consents.marketing}
                onChange={(e) => setConsents({...consents, marketing: e.target.checked})}
              />
              <label htmlFor="marketing">
                Wyrażam zgodę na otrzymywanie informacji marketingowych i newslettera
                (opcjonalne)
              </label>
            </div>
          </div>

          <div className="recaptcha-wrapper">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              onChange={(token) => setRecaptchaToken(token)}
              onExpired={() => setRecaptchaToken(null)}
            />
          </div>

          <button type="submit" disabled={loading || !recaptchaToken} className="btn-submit">
            {loading ? 'Rejestracja...' : 'Zarejestruj się'}
          </button>
        </form>

        <p className="auth-link">
          Masz już konto? <Link to="/login">Zaloguj się</Link>
        </p>
      </div>
    </div>
  )
}
