import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { carrierService } from '../services/services'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [hasCarrier, setHasCarrier] = useState(false)
  const [carrier, setCarrier] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Sprawdź czy przewoźnik ma już dodaną firmę
    const checkCarrier = async () => {
      try {
        const response = await carrierService.getMyCarrier()
        setHasCarrier(true)
        setCarrier(response.data)
      } catch (error) {
        if (error.response?.status === 404) {
          // Użytkownik nie ma jeszcze firmy
          setHasCarrier(false)
        } else {
          console.error('Error checking carrier:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    checkCarrier()
  }, [user, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-hero">
          <div className="hero-top-row">
            <div className="hero-greeting">
              <div style={{ height: '2rem', width: '240px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '0.5rem' }} />
              <div style={{ height: '1rem', width: '160px', background: 'rgba(255,255,255,0.07)', borderRadius: '6px' }} />
            </div>
          </div>
        </div>
        <div className="dashboard-container">
          <div className="user-info">
            <div className="skeleton" style={{ height: '120px', borderRadius: '14px' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      {/* Hero banner */}
      <div className="dashboard-hero">
        <div className="hero-top-row">
          <div className="hero-greeting">
            <h1>Witaj, {user.firstName}! 👋</h1>
            <p className="hero-subtitle">
              {user.userType === 'carrier' ? 'Panel przewoźnika' : 'Panel klienta'} · my-bus.eu
            </p>
          </div>
          <div className="hero-actions">
            <Link to="/settings" className="btn-settings">⚙️ Ustawienia</Link>
            <button onClick={handleLogout} className="btn-logout">🚪 Wyloguj</button>
          </div>
        </div>

        <div className="hero-meta">
          <div className="hero-meta-item">
            <span className="hero-meta-label">E-mail</span>
            <span className="hero-meta-value">{user.email}</span>
          </div>
          <div className="hero-meta-item">
            <span className="hero-meta-label">Typ konta</span>
            <span className="hero-meta-value">
              {user.userType === 'carrier' ? '🚐 Przewoźnik' : '👤 Klient'}
            </span>
          </div>
          <div className="hero-meta-item">
            <span className="hero-meta-label">Status</span>
            <span className="hero-meta-value">
              {user.isPremium
                ? <span className="premium-badge-large">⭐ PREMIUM</span>
                : '🆓 Free'}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Upgrade prompt for free carriers */}
        {!user.isPremium && user.userType === 'carrier' && (
          <div className="user-info">
            <div className="upgrade-notice">
              <p>💡 Przejdź na Premium!</p>
              <p>Dodaj logo swojej firmy i wyświetlaj się wyżej w wynikach wyszukiwania.</p>
              <Link to="/pricing" className="btn-upgrade-small">⭐ Wybierz plan abonamentowy</Link>
            </div>
          </div>
        )}

        {/* Carrier section */}
        {user.userType === 'carrier' && (
          <div className="carrier-section">
            {!hasCarrier ? (
              <div className="add-carrier-card">
                <h3>Dodaj swoją firmę do wyszukiwarki</h3>
                <p>
                  Twoja firma nie jest jeszcze widoczna w wyszukiwarce.
                  Wypełnij formularz, aby klienci mogli Cię znaleźć!
                </p>
                <Link to="/add-carrier" className="btn-add-carrier">
                  ➕ Dodaj firmę do wyszukiwarki
                </Link>
              </div>
            ) : (
              <div className="carrier-info-card">
                <h3>🏢 Twoja firma w wyszukiwarce</h3>
                <div className="carrier-details">
                  <p><strong>Nazwa firmy</strong>{carrier.companyName}</p>
                  <p><strong>Nr rejestracyjny</strong>{carrier.companyRegistration}</p>
                  <p><strong>Kraj operowania</strong>{carrier.country}</p>
                  <p><strong>Telefon kontaktowy</strong>{carrier.phone}</p>
                  <p><strong>Widoczność</strong>{carrier.isActive ? '✅ Widoczna' : '❌ Ukryta'}</p>
                </div>
                <div className="carrier-actions">
                  <Link to={`/carrier/${carrier.slug || carrier._id}`} className="btn-view">
                    👁️ Podgląd profilu
                  </Link>
                  <Link to={`/edit-carrier/${carrier._id}`} className="btn-edit">
                    ✏️ Edytuj dane firmy
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer section */}
        {user.userType === 'customer' && (
          <div className="customer-section">
            <h3>Znajdź przewoźnika</h3>
            <p>Przejdź do wyszukiwarki, aby znaleźć przewoźnika dla siebie.</p>
            <Link to="/search" className="btn-search">
              🔍 Wyszukaj przewoźnika
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
