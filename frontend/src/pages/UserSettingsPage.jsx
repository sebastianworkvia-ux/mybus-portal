import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useAuthStore } from '../stores/authStore'
import './UserSettingsPage.css'

export default function UserSettingsPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  // Change password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Delete account state
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmation: ''
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Feedback state
  const [feedbackForm, setFeedbackForm] = useState({
    subject: '',
    message: ''
  })
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [feedbackSuccess, setFeedbackSuccess] = useState('')

  if (!user) {
    navigate('/login')
    return null
  }

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Nowe hasła nie są identyczne')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Nowe hasło musi mieć minimum 6 znaków')
      return
    }

    setPasswordLoading(true)

    try {
      await apiClient.post('/user/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      setPasswordSuccess('Hasło zostało zmienione pomyślnie!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Błąd podczas zmiany hasła')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Delete account handler
  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setDeleteError('')

    if (!window.confirm('Czy na pewno chcesz TRWALE usunąć swoje konto? Ta operacja jest nieodwracalna!')) {
      return
    }

    setDeleteLoading(true)

    try {
      await apiClient.delete('/user/delete-account', {
        data: {
          password: deleteForm.password,
          confirmation: deleteForm.confirmation
        }
      })
      alert('Twoje konto zostało usunięte')
      logout()
      navigate('/')
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Błąd podczas usuwania konta')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Send feedback handler
  const handleSendFeedback = async (e) => {
    e.preventDefault()
    setFeedbackError('')
    setFeedbackSuccess('')

    if (feedbackForm.message.length < 10) {
      setFeedbackError('Wiadomość musi mieć minimum 10 znaków')
      return
    }

    setFeedbackLoading(true)

    try {
      await apiClient.post('/user/send-feedback', feedbackForm)
      setFeedbackSuccess('Wiadomość została wysłana pomyślnie! Odpowiemy najszybciej jak to możliwe.')
      setFeedbackForm({ subject: '', message: '' })
    } catch (err) {
      setFeedbackError(err.response?.data?.error || 'Błąd podczas wysyłania wiadomości')
    } finally {
      setFeedbackLoading(false)
    }
  }

  return (
    <div className="user-settings-page">
      <div className="container">
        <div className="settings-header">
          <Link to={user.userType === 'carrier' ? '/dashboard' : '/'} className="back-link">
            ← Wróć
          </Link>
          <h1>⚙️ Ustawienia konta</h1>
          <p className="user-info">
            Zalogowany jako: <strong>{user.firstName} {user.lastName}</strong> ({user.email})
          </p>
        </div>

        <div className="settings-grid">
          {/* Change Password Section */}
          <div className="settings-card">
            <div className="card-header">
              <h2>🔑 Zmiana hasła</h2>
            </div>
            <form onSubmit={handleChangePassword}>
              {passwordError && <div className="error-message">{passwordError}</div>}
              {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}

              <div className="form-group">
                <label>Obecne hasło</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  required
                  disabled={passwordLoading}
                />
              </div>

              <div className="form-group">
                <label>Nowe hasło</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                  minLength={6}
                  disabled={passwordLoading}
                />
              </div>

              <div className="form-group">
                <label>Potwierdź nowe hasło</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                  minLength={6}
                  disabled={passwordLoading}
                />
              </div>

              <button type="submit" className="btn-submit" disabled={passwordLoading}>
                {passwordLoading ? 'Zapisywanie...' : 'Zmień hasło'}
              </button>
            </form>
          </div>

          {/* Send Feedback Section */}
          <div className="settings-card">
            <div className="card-header">
              <h2>💬 Zgłoś uwagi</h2>
              <p className="card-subtitle">Masz pytanie lub sugestię? Skontaktuj się z nami!</p>
            </div>
            <form onSubmit={handleSendFeedback}>
              {feedbackError && <div className="error-message">{feedbackError}</div>}
              {feedbackSuccess && <div className="success-message">{feedbackSuccess}</div>}

              <div className="form-group">
                <label>Temat</label>
                <input
                  type="text"
                  value={feedbackForm.subject}
                  onChange={(e) => setFeedbackForm({...feedbackForm, subject: e.target.value})}
                  placeholder="Np. Sugestia dotycząca funkcji..."
                  required
                  disabled={feedbackLoading}
                />
              </div>

              <div className="form-group">
                <label>Wiadomość</label>
                <textarea
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                  placeholder="Opisz swoją uwagę lub pytanie..."
                  rows="6"
                  required
                  minLength={10}
                  disabled={feedbackLoading}
                />
              </div>

              <button type="submit" className="btn-submit feedback-btn" disabled={feedbackLoading}>
                {feedbackLoading ? 'Wysyłanie...' : 'Wyślij wiadomość'}
              </button>
            </form>
          </div>

          {/* Delete Account Section */}
          <div className="settings-card danger-card">
            <div className="card-header">
              <h2>⚠️ Usuń konto</h2>
              <p className="card-subtitle danger">Ta operacja jest nieodwracalna! Wszystkie Twoje dane zostaną trwale usunięte.</p>
            </div>
            <form onSubmit={handleDeleteAccount}>
              {deleteError && <div className="error-message">{deleteError}</div>}

              <div className="form-group">
                <label>Potwierdź hasło</label>
                <input
                  type="password"
                  value={deleteForm.password}
                  onChange={(e) => setDeleteForm({...deleteForm, password: e.target.value})}
                  placeholder="Wpisz swoje hasło"
                  required
                  disabled={deleteLoading}
                />
              </div>

              <div className="form-group">
                <label>Wpisz: USUŃ KONTO</label>
                <input
                  type="text"
                  value={deleteForm.confirmation}
                  onChange={(e) => setDeleteForm({...deleteForm, confirmation: e.target.value})}
                  placeholder="USUŃ KONTO"
                  required
                  disabled={deleteLoading}
                />
              </div>

              <button type="submit" className="btn-submit danger-btn" disabled={deleteLoading}>
                {deleteLoading ? 'Usuwanie...' : 'Usuń konto na zawsze'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
