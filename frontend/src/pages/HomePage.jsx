import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/SearchBar'
import CarrierCard from '../components/CarrierCard'
import PromoSidebar from '../components/PromoSidebar'
import FloatingActionButtons from '../components/FloatingActionButtons'
import { SearchIllustration, TravelIllustration, CommunityIllustration, VerifiedIllustration } from '../components/Illustrations'
import { useCarrierStore } from '../stores/carrierStore'
import './HomePage.css'

export default function HomePage() {
  const { t } = useTranslation()
  const { carriers, loading, error, getCarriers } = useCarrierStore()
  const [showCTABar, setShowCTABar] = useState(false)

  useEffect(() => {
    const loadCarriers = async () => {
      try {
        await getCarriers()
      } catch (err) {
        console.error('Failed to load carriers:', err)
      }
    }
    loadCarriers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sticky CTA bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) {
        setShowCTABar(true)
      } else {
        setShowCTABar(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Losuj przewoźników do wyświetlenia: wszystkie premium/business + losowe free do 8
  const featuredCarriers = useMemo(() => {
    if (!carriers || carriers.length === 0) return []
    
    // Rozdziel na premium/business i free
    const premiumCarriers = carriers.filter(c => c.subscriptionPlan === 'business' || c.subscriptionPlan === 'premium')
    const freeCarriers = carriers.filter(c => c.subscriptionPlan === 'free' || !c.subscriptionPlan)
    
    // Shuffle free carriers (Fisher-Yates shuffle)
    const shuffledFree = [...freeCarriers]
    for (let i = shuffledFree.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledFree[i], shuffledFree[j]] = [shuffledFree[j], shuffledFree[i]]
    }
    
    // Połącz: wszystkie premium + losowe free (do 8 total)
    const featured = [...premiumCarriers]
    const remainingSlots = 8 - featured.length
    if (remainingSlots > 0) {
      featured.push(...shuffledFree.slice(0, remainingSlots))
    }
    
    return featured.slice(0, 8)
  }, [carriers])

  return (
    <div className="home-page">
      <PromoSidebar />
      <section className="hero">
        <div className="hero-background-image" style={{backgroundImage: "url('/hero-bus.png')"}}>
          {/* Tło ustawi się przez CSS jeśli plik nie istnieje, lub style inline nadpisze jak użytkownik wrzuci plik */}
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <h1>{t('hero.title')}</h1>
            <p>{t('hero.description')}</p>
          </div>
          {/* Ilustracja usunięta, bo mamy zdjęcie w tle */}
          <div className="hero-image" style={{opacity: 0}}></div> 
        </div>
      </section>

      {/* Urgency Banner */}
      <div className="urgency-banner">
        <p className="urgency-text">
          {t('urgency.text', '🎯 Specjalna oferta! Rezerwuj transport teraz i zyskaj do')} <strong>30% {t('urgency.discount', 'rabatu')}</strong>
        </p>
      </div>

      <div className="search-section-wrapper">
        <div className="container">
          <SearchBar />
        </div>
      </div>

      <div className="container" style={{marginTop: '3rem'}}>
        {/* Usługi - Kategorie */}
        <section className="services-categories">
          <h2>{t('services.title')}</h2>
          <div className="categories-grid">
            <Link to="/search?service=transport" className="category-card">
              <span className="cat-icon">🚐</span>
              <h3>{t('services.transport')}</h3>
            </Link>
            <Link to="/search?service=transfery-lotniskowe" className="category-card">
              <span className="cat-icon">✈️</span>
              <h3>{t('services.transfers')}</h3>
            </Link>
            <Link to="/search?service=paczki" className="category-card">
              <span className="cat-icon">📦</span>
              <h3>{t('services.packages')}</h3>
            </Link>
            <Link to="/search?service=laweta" className="category-card">
              <span className="cat-icon">🚗</span>
              <h3>{t('services.vehicles')}</h3>
            </Link>
            <Link to="/search?service=autokary" className="category-card">
              <span className="cat-icon">🚌</span>
              <h3>{t('services.coaches')}</h3>
            </Link>
            <Link to="/search?service=zwierzeta" className="category-card">
              <span className="cat-icon">🐕</span>
              <h3>{t('services.pets')}</h3>
            </Link>
            <Link to="/search?service=przeprowadzki" className="category-card">
              <span className="cat-icon">🏠</span>
              <h3>{t('services.moving')}</h3>
            </Link>
            <Link to="/search?service=przejazdy-sluzbowe" className="category-card">
              <span className="cat-icon">👔</span>
              <h3>{t('services.business')}</h3>
            </Link>
          </div>
        </section>

        {/* Trust Signals Section */}
        <section className="trust-section">
          <h2>{t('trust.title', 'Dlaczego nam zaufali tysiące klientów?')}</h2>
          <p>{t('trust.subtitle', 'Sprawdzone firmy transportowe z całej Europy w jednym miejscu')}</p>
          <div className="trust-badges">
            <div className="trust-badge">
              <div className="trust-badge-icon">✅</div>
              <div className="trust-badge-number">190+</div>
              <p className="trust-badge-label">{t('trust.carriers', 'Zweryfikowanych Przewoźników')}</p>
            </div>
            <div className="trust-badge">
              <div className="trust-badge-icon">🌍</div>
              <div className="trust-badge-number">6</div>
              <p className="trust-badge-label">{t('trust.countries', 'Krajów w Europie')}</p>
            </div>
            <div className="trust-badge">
              <div className="trust-badge-icon">🔒</div>
              <div className="trust-badge-number">100%</div>
              <p className="trust-badge-label">{t('trust.secure', 'Bezpieczne Transakcje')}</p>
            </div>
            <div className="trust-badge">
              <div className="trust-badge-icon">⭐</div>
              <div className="trust-badge-number">4.8/5</div>
              <p className="trust-badge-label">{t('trust.rating', 'Średnia Ocena')}</p>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="features-section" style={{marginTop: '4rem'}}>
          <div className="feature-card">
            <SearchIllustration />
            <h3>{t('features.searchTitle')}</h3>
            <p>{t('features.searchDesc')}</p>
          </div>

          <div className="feature-card">
            <VerifiedIllustration />
            <h3>{t('features.verifiedTitle')}</h3>
            <p>{t('features.verifiedDesc')}</p>
          </div>

          <div className="feature-card">
            <TravelIllustration />
            <h3>{t('features.contactTitle')}</h3>
            <p>{t('features.contactDesc')}</p>
          </div>
        </section>

        {/* CTA Section - Zarejestruj się */}
        <section className="register-benefits-section">
          <div className="benefits-card">
            <h2>{t('cta.customerTitle')}</h2>
            <div className="benefits-grid">
              <div className="benefit-item">
                <span className="benefit-icon">💬</span>
                <h4>{t('cta.benefitDirectTitle')}</h4>
                <p>{t('cta.benefitDirectDesc')}</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">⭐</span>
                <h4>{t('cta.benefitReputationTitle')}</h4>
                <p>{t('cta.benefitReputationDesc')}</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🔔</span>
                <h4>{t('cta.benefitNotificationsTitle')}</h4>
                <p>{t('cta.benefitNotificationsDesc')}</p>
              </div>
            </div>
            <div className="cta-buttons">
              <Link to="/register" className="btn-cta-primary" onClick={() => window.scrollTo(0, 0)}>
                {t('cta.registerFree')}
              </Link>
              <Link to="/login" className="btn-cta-secondary" onClick={() => window.scrollTo(0, 0)}>
                {t('cta.haveAccount')}
              </Link>
            </div>
          </div>
        </section>

        <section className="search-section">
          <h2>{t('searchSection.title')}</h2>
          <SearchBar />
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/map" className="btn-map">
              {t('searchSection.viewMap')}
            </Link>
          </div>
        </section>

        <section className="featured-carriers">
          <h2>{t('featuredCarriers.title')}</h2>
          
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>{t('featuredCarriers.loading')}</p>
              <small style={{ opacity: 0.7, marginTop: '8px' }}>
                {t('featuredCarriers.loadingNote')}
              </small>
            </div>
          )}

          {error && (
            <div className="error">
              <p>{t('featuredCarriers.error')} {error}</p>
              <button onClick={() => getCarriers()} className="btn-retry">
                {t('featuredCarriers.retry')}
              </button>
            </div>
          )}

          {!loading && !error && carriers.length > 0 && (
            <div className="carriers-grid">
              {featuredCarriers.map((carrier) => (
                <CarrierCard key={carrier._id} carrier={carrier} />
              ))}
            </div>
          )}

          {!loading && !error && carriers.length === 0 && (
            <div className="no-carriers">
              <p>{t('featuredCarriers.noCarriers')}</p>
              <p className="text-small">{t('featuredCarriers.beFirst')}</p>
            </div>
          )}
        </section>

        <section className="facebook-cta-section">
          <div className="facebook-cta-card">
            <div className="facebook-icon">📘</div>
            <h2>{t('cta.facebook')}</h2>
            <p>{t('cta.facebookDesc')}</p>
            <a 
              href="https://www.facebook.com/profile.php?id=61584903104321" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-facebook"
            >
              {t('cta.followFB')}
            </a>
            <p className="facebook-subtext">{t('cta.facebookSubtext')}</p>
          </div>
        </section>

        <section className="cta-section">
          <h2>{t('cta.carrier')}</h2>
          <p>{t('cta.carrierDesc')}</p>
          <Link to="/register" className="btn-join">
            {t('cta.joinFree')}
          </Link>
        </section>
      </div>

      {/* Sticky CTA Bar */}
      <div className={`cta-sticky-bar ${showCTABar ? 'visible' : ''}`}>
        <div className="cta-sticky-content">
          <div className="cta-sticky-text">
            {t('ctaBar.text', 'Gotowy na podróż?')}
            <span>{t('ctaBar.subtext', 'Znajdź najlepszych przewoźników w Europie')}</span>
          </div>
          <Link to="/search" className="cta-sticky-button">
            {t('ctaBar.button', 'Szukaj Przewoźnika →')}
          </Link>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <FloatingActionButtons />
    </div>
  )
}
