import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import './AuthPages.css'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register, error, loading } = useAuthStore()
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
      alert(t('register.consentRequired'))
      return
    }
    
    try {
      // Add consents to registration data
      await register({
        ...formData,
        marketingConsent: consents.marketing
      })
      navigate('/')
    } catch (err) {
      // Error is handled by store
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>{t('register.title')}</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="userType">{t('register.userType')}</label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
            >
              <option value="customer">{t('register.customer')}</option>
              <option value="carrier">{t('register.carrier')}</option>
            </select>
          </div>

          {formData.userType === 'carrier' ? (
            <div className="form-group">
              <label htmlFor="companyName">{t('register.companyName')}</label>
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
                <label htmlFor="firstName">{t('register.firstName')}</label>
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
                <label htmlFor="lastName">{t('register.lastName')}</label>
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
            <label htmlFor="email">{t('register.email')}</label>
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
            <label htmlFor="password">{t('register.password')}</label>
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
                {t('register.consentData')}{' '}
                <Link to="/privacy" target="_blank" className="link-inline">
                  {t('register.privacyPolicy')}
                </Link>{' '}
                <span className="required-mark">{t('register.required')}</span>
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
                {t('register.consentMarketing')}
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? t('register.submitting') : t('register.submit')}
          </button>
        </form>

        <p className="auth-link">
          {t('register.haveAccount')} <Link to="/login">{t('register.loginLink')}</Link>
        </p>
      </div>
    </div>
  )
}
