import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/SearchBar'
import CarrierCard from '../components/CarrierCard'
import PromoSidebar from '../components/PromoSidebar'
import FloatingActionButtons from '../components/FloatingActionButtons'
import FacebookFeed from '../components/FacebookFeed'
import { SearchIllustration, TravelIllustration, CommunityIllustration, VerifiedIllustration } from '../components/Illustrations'
import { useCarrierStore } from '../stores/carrierStore'
import './HomePage.css'

export default function HomePage() {
  const { t } = useTranslation()
  const { carriers, loading, error, getCarriers } = useCarrierStore()
  const observerRef = useRef(null)

  // Initialize Intersection Observer for scroll animations
  useEffect(() => {
    const elements = document.querySelectorAll('.scroll-fade-in, .services-categories, .featured-carriers')
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          // Stop observing once element is visible
          observer.unobserve(entry.target)
        }
      })
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    })

    elements.forEach((el) => observer.observe(el))
    observerRef.current = observer

    return () => {
      elements.forEach((el) => observer.unobserve(el))
    }
  }, [carriers])

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

  // Wyodrębnij firmy Business (wyróżnione) i pozostałe (premium + free)
  const businessCarriers = useMemo(() => {
    if (!carriers || carriers.length === 0) return []
    return carriers.filter(c => c.subscriptionPlan === 'business')
  }, [carriers])

  // Losuj przewoźników do wyświetlenia: wszystkie premium + losowe free do 6
  const featuredCarriers = useMemo(() => {
    if (!carriers || carriers.length === 0) return []
    
    // Rozdziel na premium (bez business) i free
    const premiumCarriers = carriers.filter(c => c.subscriptionPlan === 'premium')
    const freeCarriers = carriers.filter(c => c.subscriptionPlan === 'free' || !c.subscriptionPlan)
    
    // Shuffle free carriers (Fisher-Yates shuffle)
    const shuffledFree = [...freeCarriers]
    for (let i = shuffledFree.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledFree[i], shuffledFree[j]] = [shuffledFree[j], shuffledFree[i]]
    }
    
    // Połącz: wszystkie premium + losowe free (do 6 total)
    const featured = [...premiumCarriers]
    const remainingSlots = 6 - featured.length
    if (remainingSlots > 0) {
      featured.push(...shuffledFree.slice(0, remainingSlots))
    }
    
    return featured.slice(0, 6)
  }, [carriers])

  return (
    <div className="home-page">
      <PromoSidebar />
      
      {/* HERO SEKCJA - 1:1 z mockupem */}
      <section className="hero-new">
        <div className="hero-inner">

          {/* LEWA część ~70%: wyszukiwarka */}
          <div className="hero-content">
            <div className="hero-eyebrow">
              🚐 {carriers.length > 50 ? `${carriers.length}+` : '1074+'} firm transportowych w jednym miejscu
            </div>
            <h1 className="hero-title">
              Nie czekaj na oferty —<br />znajdź przewoźnika od razu
            </h1>
            <p className="hero-subtitle">
              Busy, lawety, transfery lotniskowe, transport zwierząt i paczek — cała Europa w jednym miejscu.
            </p>

            <div className="hero-search-wrapper">
              <SearchBar />
            </div>

            {/* Proof cards — glass morphism */}
            <div className="hero-proof">
              <div className="hero-proof-card">
                <strong>{carriers.length > 50 ? `${carriers.length}+` : '1074+'}</strong>
                <span>firm transportowych</span>
              </div>
              <div className="hero-proof-card">
                <strong>Europa</strong>
                <span>trasy międzynarodowe</span>
              </div>
              <div className="hero-proof-card">
                <strong>4.8/5</strong>
                <span>średnia ocena</span>
              </div>
            </div>
          </div>

          {/* PRAWA część ~30%: box dla przewoźnika */}
          <aside className="hero-carrier-box">
            <div className="carrier-box-tag">Dla przewoźników</div>
            <h2 className="carrier-box-h2">Jesteś przewoźnikiem?</h2>
            <p className="carrier-box-desc">
              Pokaż swoją firmę osobom, które właśnie szukają busa, lawety, transferu lub transportu rzeczy.
            </p>
            <ul className="carrier-benefits">
              <li>Profil firmy w wyszukiwarce</li>
              <li>Lepsza widoczność dla klientów</li>
              <li>Bezpośredni kontakt bez pośredników</li>
            </ul>
            <div className="carrier-cta">
              <Link to="/register" className="btn-carrier-register" onClick={() => window.scrollTo(0, 0)}>
                Załóż konto przewoźnika
              </Link>
              <Link to="/for-carriers" className="btn-carrier-learn" onClick={() => window.scrollTo(0, 0)}>
                Dowiedz się więcej
              </Link>
            </div>
          </aside>

        </div>
      </section>

      <div className="container" style={{marginTop: '0rem'}}>
        {/* Usługi - Kategorie */}
        <section className="services-categories scroll-fade-in">
          <h2>{t('services.title', 'Wybierz kategorię transportu')}</h2>
          <p className="section-subtitle">Znajdź firmę według usługi, której potrzebujesz.</p>
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
              <div className="trust-badge-number">{carriers.length || '190'}+</div>
              <p className="trust-badge-label">{t('trust.carriers', 'Zweryfikowanych Przewoźników')}</p>
            </div>
            <div className="trust-badge">
              <div className="trust-badge-icon">🌍</div>
              <div className="trust-badge-number">30+</div>
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
        <section className="features-section scroll-fade-in" style={{marginTop: '4rem'}}>
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

        <section className="featured-carriers scroll-fade-in">
          {/* Sekcja wyróżnionych firm Business */}
          {!loading && !error && businessCarriers.length > 0 && (
            <div className="business-featured-section">
              <div className="business-featured-header">
                <span className="business-featured-badge">💎 BUSINESS</span>
                <h3>Wyróżnieni Przewoźnicy</h3>
                <p>Firmy z planem Business — najwyższa jakość usług</p>
              </div>
              <div className="carriers-list">
                {businessCarriers.map((carrier) => (
                  <CarrierCard key={carrier._id} carrier={carrier} compact />
                ))}
              </div>
            </div>
          )}

          <h2>{t('featuredCarriers.title')}</h2>
          <p className="section-subtitle">{t('featuredCarriers.subtitle', 'Polecani przewoźnicy z całej Europy')}</p>
          
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

        {/* Facebook Feed - Ostatnie posty */}
        <FacebookFeed />

        {/* DUALNA CTA SEKCJA - Dla klientów i przewoźników */}
        <section className="footer-cta-dual">
          <div className="cta-dual-panel cta-panel-customers">
            <div className="cta-panel-content">
              <h3>{t('cta.followUs', 'Bądź na bieżąco')}</h3>
              <p>{t('cta.facebookDesc')}</p>
              <a 
                href="https://www.facebook.com/profile.php?id=61584903104321" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-cta-fb"
              >
                👍 {t('cta.followFB')}
              </a>
            </div>
          </div>

          <div className="cta-dual-panel cta-panel-carriers">
            <div className="cta-panel-content">
              <h3>{t('cta.joinNow', 'Dołącz jako transportowiec')}</h3>
              <p>{t('cta.carrierDesc')}</p>
              <Link to="/register" className="btn-cta-join" onClick={() => window.scrollTo(0, 0)}>
                🚀 {t('cta.joinFree')}
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Action Buttons */}
      <FloatingActionButtons />
    </div>
  )
}
