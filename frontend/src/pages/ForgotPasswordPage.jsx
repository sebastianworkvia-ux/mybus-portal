import { useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import './ForgotPasswordPage.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await apiClient.post('/password/forgot-password', { email })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas wysyłania linku resetującego')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="forgot-password-page">
        <div className="container">
          <div className="forgot-password-card success-card">
            <div className="success-icon">✉️</div>
            <h2>Link wysłany!</h2>
            <p>Jeśli konto z tym adresem email istnieje, wysłaliśmy na niego link do resetowania hasła.</p>
            <p>Sprawdź swoją skrzynkę pocztową i folder spam.</p>
            <p className="note">Link będzie ważny przez 1 godzinę.</p>
            <Link to="/login" className="btn-primary">
              Wróć do logowania
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password-page">
      <div className="container">
        <div className="forgot-password-card">
          <h2>🔐 Zapomniałeś hasła?</h2>
          <p className="subtitle">Wpisz swój adres email, a wyślemy Ci link do resetowania hasła.</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.com"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
            </button>
          </form>

          <div className="back-link">
            <Link to="/login">← Wróć do logowania</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
