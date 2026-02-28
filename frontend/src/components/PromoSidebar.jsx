import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import './PromoSidebar.css'

export default function PromoSidebar() {
  const [promos, setPromos] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(() => {
    // Sprawdź czy użytkownik zamknął sidebar (zapamiętane w localStorage)
    return localStorage.getItem('promoSidebarClosed') !== 'true'
  })

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        // Pobierz tylko przewoźników premium/business z aktywną promocją
        const res = await apiClient.get('/carriers', {
          params: { hasPromo: true }
        })
        
        // Filtruj tylko z aktywną promocją i ważną datą
        const activePromos = res.data.filter(carrier => 
          carrier.promoOffer?.isActive && 
          carrier.promoOffer?.validUntil &&
          new Date(carrier.promoOffer.validUntil) > new Date()
        )
        
        setPromos(activePromos)
      } catch (err) {
        console.error('Failed to load promos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPromos()
  }, [])

  // Auto-przewijanie co 5 sekund
  useEffect(() => {
    if (promos.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % promos.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [promos.length])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('promoSidebarClosed', 'true')
  }

  if (loading || promos.length === 0 || !isVisible) {
    return null // Nie pokazuj sidebara jeśli brak promocji lub zamknięty
  }

  const currentPromo = promos[currentIndex]

  return (
    <div className="promo-sidebar">
      <button 
        className="promo-close" 
        onClick={handleClose}
        aria-label="Zamknij promocje"
      >
        ×
      </button>
      <div className="promo-header">
        <span className="promo-badge">🔥 PROMOCJA</span>
      </div>

      <Link 
        key={currentPromo._id} 
        to={`/carriers/${currentPromo._id}`} 
        className="promo-card"
      >
        <div className="promo-content">
          {currentPromo.logo && (
            <img 
              src={currentPromo.logo} 
              alt={currentPromo.companyName}
              className="promo-logo"
            />
          )}
          
          <h3 className="promo-title">{currentPromo.promoOffer.title}</h3>
          <p className="promo-description">{currentPromo.promoOffer.description}</p>
          
          {currentPromo.promoOffer.price && (
            <div className="promo-price">{currentPromo.promoOffer.price}</div>
          )}

          <p className="promo-company">{currentPromo.companyName}</p>
          
          {currentPromo.promoOffer.validUntil && (
            <p className="promo-validity">
              Ważne do: {new Date(currentPromo.promoOffer.validUntil).toLocaleDateString('pl-PL')}
            </p>
          )}
        </div>

        <div className="promo-cta">
          Zobacz szczegóły →
        </div>
      </Link>

      {promos.length > 1 && (
        <div className="promo-dots">
          {promos.map((_, index) => (
            <button
              key={index}
              className={`promo-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Promocja ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
