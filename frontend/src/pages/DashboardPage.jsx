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
        const response = await carrierService.getCarriers()
        const myCarrier = response.data.find(c => c.userId === user.id)
        if (myCarrier) {
          setHasCarrier(true)
          setCarrier(myCarrier)
        }
      } catch (error) {
        console.error('Error checking carrier:', error)
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
    return <div className="dashboard-page">Ładowanie...</div>
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Panel użytkownika</h1>
          <div className="header-actions">
            <Link to="/settings" className="btn-settings">⚙️ Ustawienia</Link>
            <button onClick={handleLogout} className="btn-logout">
              Wyloguj się
            </button>
          </div>
        </div>

        <div className="user-info">
          <div className="user-header">
            <h2>Witaj, {user.firstName}!</h2>
            {user.isPremium && <span className="premium-badge-large">⭐ PREMIUM</span>}
          </div>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Typ konta:</strong> {user.userType === 'carrier' ? 'Przewoźnik' : 'Klient'}</p>
          <p><strong>Status:</strong> {user.isPremium ? '⭐ Premium' : '🆓 Free'}</p>
          
          {!user.isPremium && user.userType === 'carrier' && (
            <div className="upgrade-notice">
              <p><strong>💡 Przejdź na Premium!</strong></p>
              <p>Dodaj logo swojej firmy i wyświetlaj się wyżej w wynikach wyszukiwania.</p>
              <Link 
                to="/pricing"
                className="btn-upgrade-small"
              >
                ⭐ Wybierz plan abonamentowy
              </Link>
            </div>
          )}
        </div>

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
                <h3>Twoja firma w wyszukiwarce</h3>
                <div className="carrier-details">
                  <p><strong>Nazwa:</strong> {carrier.companyName}</p>
                  <p><strong>Rejestracja:</strong> {carrier.companyRegistration}</p>
                  <p><strong>Kraj:</strong> {carrier.country}</p>
                  <p><strong>Telefon:</strong> {carrier.phone}</p>
                  <p><strong>Status:</strong> {carrier.isActive ? '✅ Aktywna' : '❌ Nieaktywna'}</p>
                </div>
                <div className="carrier-actions">
                  <Link to={`/carrier/${carrier._id}`} className="btn-view">
                    👁️ Zobacz jak widzą Cię klienci
                  </Link>
                  <Link to={`/edit-carrier/${carrier._id}`} className="btn-edit">
                    ✏️ Edytuj dane firmy
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

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
