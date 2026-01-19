import { useState, useEffect } from 'react'
import './FacebookPopup.css'

export default function FacebookPopup() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Sprawdź czy popup był już pokazany
    const lastShown = localStorage.getItem('facebook_popup_shown')
    const now = Date.now()
    
    // Pokazuj popup co 24h
    if (!lastShown || (now - parseInt(lastShown)) > 24 * 60 * 60 * 1000) {
      // Pokaż popup po 10 sekundach od wejścia
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('facebook_popup_shown', Date.now().toString())
  }

  const handleVisitFacebook = () => {
    localStorage.setItem('facebook_popup_shown', Date.now().toString())
    window.open('https://www.facebook.com/profile.php?id=61584903104321', '_blank', 'noopener,noreferrer')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="facebook-popup-overlay" onClick={handleClose}>
      <div className="facebook-popup" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={handleClose}>✕</button>
        
        <div className="popup-icon">📘</div>
        
        <h2>Polub nas na Facebooku!</h2>
        
        <p>Bądź na bieżąco z:</p>
        <ul className="popup-benefits">
          <li>✅ Nowymi przewoźnikami</li>
          <li>✅ Promocjami i zniżkami</li>
          <li>✅ Aktualnościami z branży</li>
          <li>✅ Ofertami specjalnymi</li>
        </ul>

        <button className="btn-popup-facebook" onClick={handleVisitFacebook}>
          👍 Polub My-Bus.eu na Facebooku
        </button>

        <button className="btn-popup-later" onClick={handleClose}>
          Może później
        </button>
      </div>
    </div>
  )
}
