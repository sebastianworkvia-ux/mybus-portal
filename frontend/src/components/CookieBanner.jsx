import { useState, useEffect } from 'react'
import './CookieBanner.css'

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    }
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted))
    setIsVisible(false)
  }

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    }
    localStorage.setItem('cookieConsent', JSON.stringify(onlyNecessary))
    setIsVisible(false)
  }

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences))
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        {!showSettings ? (
          <>
            <div className="cookie-text">
              <h3>🍪 Ta strona używa plików cookies</h3>
              <p>
                Używamy plików cookies, aby zapewnić najlepsze doświadczenie na naszej stronie. 
                Możesz zaakceptować wszystkie cookies lub dostosować swoje preferencje.
                <a href="/cookies" target="_blank"> Dowiedz się więcej</a>
              </p>
            </div>
            <div className="cookie-buttons">
              <button onClick={() => setShowSettings(true)} className="btn-settings">
                Ustawienia
              </button>
              <button onClick={handleRejectAll} className="btn-reject">
                Odrzuć wszystkie
              </button>
              <button onClick={handleAcceptAll} className="btn-accept">
                Akceptuj wszystkie
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cookie-text">
              <h3>Ustawienia Cookies</h3>
              <div className="cookie-preferences">
                <label className="cookie-option disabled">
                  <input type="checkbox" checked disabled />
                  <div>
                    <strong>Niezbędne</strong>
                    <p>Wymagane do podstawowego działania strony</p>
                  </div>
                </label>

                <label className="cookie-option">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) =>
                      setPreferences({ ...preferences, functional: e.target.checked })
                    }
                  />
                  <div>
                    <strong>Funkcjonalne</strong>
                    <p>Zapamiętują Twoje preferencje</p>
                  </div>
                </label>

                <label className="cookie-option">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                  />
                  <div>
                    <strong>Analityczne</strong>
                    <p>Pomagają nam ulepszać stronę</p>
                  </div>
                </label>

                <label className="cookie-option">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                  />
                  <div>
                    <strong>Marketingowe</strong>
                    <p>Personalizacja reklam</p>
                  </div>
                </label>
              </div>
            </div>
            <div className="cookie-buttons">
              <button onClick={() => setShowSettings(false)} className="btn-back">
                Wstecz
              </button>
              <button onClick={handleSavePreferences} className="btn-save">
                Zapisz ustawienia
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
