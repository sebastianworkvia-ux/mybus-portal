import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { messageService } from '../services/services'
import Logo from './Logo'
import LanguageSwitcher from './LanguageSwitcher'
import './Header.css'

export default function Header() {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  // Zamknij menu przy zmianie strony
  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Zablokuj scroll gdy menu otwarte
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      try {
        const response = await messageService.getUnreadCount()
        setUnreadCount(response.data.count)
      } catch (err) {
        // ignoruj
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <header className={`header ${!isVisible ? 'header-hidden' : ''}`}>
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
            <Logo className="logo-icon" />
            <span className="logo-text">My-Bus.eu</span>
          </Link>

          {/* Desktop nav */}
          <nav className="nav nav-desktop">
            <Link to="/">{t('nav.home')}</Link>
            <Link to="/search">{t('nav.searchCarrier')}</Link>
            <Link to="/map" className="map-link">🗺️ {t('nav.searchMap')}</Link>
            <Link to="/for-carriers">{t('nav.forCarriers')}</Link>

            {user ? (
              <div className="user-menu">
                <span className="user-greeting">Witaj, {user.firstName}!</span>
                {user.userType === 'carrier' && (
                  <Link to="/dashboard" className="nav-link">{t('nav.dashboard')}</Link>
                )}
                {user.isAdmin && (
                  <Link to="/admin" className="admin-link">Panel Admina</Link>
                )}
                <Link to="/messages" className="messages-link">
                  📬 {t('nav.messages')}
                  {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                </Link>
                <Link to="/settings" className="settings-link">⚙️</Link>
                <button onClick={logout} className="btn-logout">
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">{t('nav.login')}</Link>
                <Link to="/register" className="btn-register">{t('nav.register')}</Link>
              </div>
            )}
          </nav>

          <div className="header-right">
            <div className="language-switcher-wrapper">
              <LanguageSwitcher />
            </div>

            {/* Hamburger button */}
            <button
              className={`hamburger ${menuOpen ? 'hamburger-open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`mobile-drawer ${menuOpen ? 'mobile-drawer-open' : ''}`}>
        <nav className="mobile-nav">
          <Link to="/" onClick={() => setMenuOpen(false)}>{t('nav.home')}</Link>
          <Link to="/search" onClick={() => setMenuOpen(false)}>{t('nav.searchCarrier')}</Link>
          <Link to="/map" className="mobile-map-link" onClick={() => setMenuOpen(false)}>🗺️ {t('nav.searchMap')}</Link>
          <Link to="/for-carriers" onClick={() => setMenuOpen(false)}>{t('nav.forCarriers')}</Link>

          {user ? (
            <>
              <div className="mobile-user-info">
                <span>👤 {user.firstName} {user.lastName}</span>
              </div>
              {user.userType === 'carrier' && (
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}>📊 {t('nav.dashboard')}</Link>
              )}
              {user.isAdmin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}>⚙️ Panel Admina</Link>
              )}
              <Link to="/messages" onClick={() => setMenuOpen(false)}>
                📬 {t('nav.messages')}
                {unreadCount > 0 && <span className="mobile-badge">{unreadCount}</span>}
              </Link>
              <Link to="/settings" onClick={() => setMenuOpen(false)}>⚙️ Ustawienia</Link>
              <button onClick={() => { logout(); setMenuOpen(false) }} className="mobile-logout">
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <div className="mobile-auth">
              <Link to="/login" className="mobile-btn-login" onClick={() => setMenuOpen(false)}>
                {t('nav.login')}
              </Link>
              <Link to="/register" className="mobile-btn-register" onClick={() => setMenuOpen(false)}>
                {t('nav.register')}
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Overlay */}
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}
    </header>
  )
}
