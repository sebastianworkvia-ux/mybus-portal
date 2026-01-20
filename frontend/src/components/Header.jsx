import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { messageService } from '../services/services'
import Logo from './Logo'
import './Header.css'

export default function Header() {
  const { user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down
        setIsVisible(false)
      } else {
        // Scrolling up
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Pobierz liczbę nieprzeczytanych wiadomości
  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      try {
        const response = await messageService.getUnreadCount()
        setUnreadCount(response.data.count)
      } catch (err) {
        // Ignoruj błędy (użytkownik może być niezalogowany)
      }
    }

    fetchUnreadCount()
    
    // Odśwież co 30 sekund
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <header className={`header ${!isVisible ? 'header-hidden' : ''}`}>
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <Logo className="logo-icon" />
            <span className="logo-text">My-Bus.eu</span>
          </Link>

          <nav className="nav">
            <Link to="/">Strona główna</Link>
            <Link to="/search">Szukaj przewoźników</Link>
            <Link to="/map" className="map-link">🗺️ Mapa</Link>
            <Link to="/for-carriers">Dla przewoźników</Link>

            {user ? (
              <div className="user-menu">
                <span className="user-greeting">Witaj, {user.firstName}!</span>
                {user.userType === 'carrier' && (
                  <Link to="/dashboard" className="nav-link">Mój panel</Link>
                )}
                {user.isAdmin && (
                  <Link to="/admin" className="admin-link">Panel Admina</Link>
                )}
                <Link to="/messages" className="messages-link">
                  📬 Wiadomości
                  {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                </Link>
                <Link to="/settings" className="settings-link">⚙️ Ustawienia</Link>
                <button onClick={logout} className="btn-logout">
                  Wyloguj
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">
                  Logowanie
                </Link>
                <Link to="/register" className="btn-register">
                  Rejestracja
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
