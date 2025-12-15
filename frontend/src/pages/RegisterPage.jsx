import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import './AuthPages.css'

export default function RegisterPage() {
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await register(formData)
      navigate('/')
    } catch (err) {
      // Error is handled by store
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

          <button type="submit" disabled={loading} className="btn-submit">
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
