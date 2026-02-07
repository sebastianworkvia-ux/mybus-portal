import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import './Footer.css'

export default function Footer() {
  const { t } = useTranslation()
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <Logo className="footer-logo-icon" />
              <span>MyBus</span>
            </div>
            <p>{t('footer.description')}</p>
          </div>

          <div className="footer-section">
            <h4>{t('footer.links')}</h4>
            <ul>
              <li><Link to="/">{t('footer.home')}</Link></li>
              <li><Link to="/search">{t('footer.search')}</Link></li>
              <li><Link to="/for-carriers">{t('footer.forCarriers')}</Link></li>
              <li><Link to="/register">{t('footer.joinAsCarrier')}</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>{t('footer.legal')}</h4>
            <ul>
              <li><Link to="/privacy">{t('footer.privacy')}</Link></li>
              <li><Link to="/terms">{t('footer.terms')}</Link></li>
              <li><Link to="/cookies">{t('footer.cookies')}</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>{t('footer.contact')}</h4>
            <ul>
              <li>{t('footer.email')} <a href="mailto:kontakt.mybus@gmail.com">kontakt.mybus@gmail.com</a></li>
              <li>{t('footer.phone')} +48 518 970 399</li>
              <li>{t('footer.rodo')} <a href="mailto:kontakt.mybus@gmail.com">kontakt.mybus@gmail.com</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 MyBus. {t('footer.rights')}.</p>
          <p className="footer-small">
            {t('footer.disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  )
}
