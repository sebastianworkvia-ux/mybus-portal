import { Link } from 'react-router-dom'
import Logo from './Logo'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <Logo className="footer-logo-icon" />
              <span>MyBus</span>
            </div>
            <p>Portal dla przewoźników pasażerskich w Europie Zachodniej</p>
          </div>

          <div className="footer-section">
            <h4>Linki</h4>
            <ul>
              <li><Link to="/">Strona główna</Link></li>
              <li><Link to="/search">Szukaj przewoźników</Link></li>
              <li><Link to="/for-carriers">Dla przewoźników</Link></li>
              <li><Link to="/register">Dołącz jako przewoźnik</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Dokumenty prawne</h4>
            <ul>
              <li><Link to="/privacy">Polityka prywatności</Link></li>
              <li><Link to="/terms">Regulamin</Link></li>
              <li><Link to="/cookies">Polityka cookies</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Kontakt</h4>
            <ul>
              <li>Email: <a href="mailto:kontakt@mybus.pl">kontakt@mybus.pl</a></li>
              <li>Tel: +48 123 456 789</li>
              <li>RODO: <a href="mailto:rodo@mybus.pl">rodo@mybus.pl</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 MyBus. Wszelkie prawa zastrzeżone.</p>
          <p className="footer-small">
            Platforma pośrednicząca. Nie ponosimy odpowiedzialności za usługi świadczone przez przewoźników.
          </p>
        </div>
      </div>
    </footer>
  )
}
