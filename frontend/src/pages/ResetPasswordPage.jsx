import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import './ResetPasswordPage.css'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne')
      return
    }

    if (password.length < 6) {
      setError('Hasło musi mieć minimum 6 znaków')
      return
    }

    setLoading(true)

    try {
      await apiClient.post(`/password/reset-password/${token}`, { password })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas resetowania hasła')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="container">
          <div className="reset-password-card success-card">
            <div className="success-icon">✅</div>
            <h2>Hasło zmienione!</h2>
            <p>Twoje hasło zostało pomyślnie zmienione.</p>
            <p>Za chwilę zostaniesz przekierowany do strony logowania...</p>
            <Link to="/login" className="btn-primary">
              Przejdź do logowania
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-password-page">
      <div className="container">
        <div className="reset-password-card">
          <h2>🔑 Ustaw nowe hasło</h2>
          <p className="subtitle">Wprowadź nowe hasło dla swojego konta.</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">Nowe hasło</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 znaków"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Potwierdź hasło</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Wpisz hasło ponownie"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zmień hasło'}
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
