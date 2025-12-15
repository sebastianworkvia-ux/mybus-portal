import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Logo from './Logo'
import './Header.css'

export default function Header() {
  const { user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <Logo className="logo-icon" />
            <span className="logo-text">MyBus</span>
          </Link>

          <nav className="nav">
            <Link to="/">Strona główna</Link>
            <Link to="/search">Szukaj przewoźników</Link>
            <Link to="/for-carriers">Dla przewoźników</Link>

            {user ? (
              <div className="user-menu">
                <span>Cześć, {user.firstName}!</span>
                {user.userType === 'carrier' && (
                  <Link to="/dashboard">Mój panel</Link>
                )}
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
