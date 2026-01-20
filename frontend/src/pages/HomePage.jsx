import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import CarrierCard from '../components/CarrierCard'
import { SearchIllustration, TravelIllustration, CommunityIllustration, VerifiedIllustration } from '../components/Illustrations'
import { useCarrierStore } from '../stores/carrierStore'
import './HomePage.css'

export default function HomePage() {
  const { carriers, loading, error, getCarriers } = useCarrierStore()

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
      <section className="hero">
        <div className="video-background">
          <video autoPlay loop muted playsInline>
            <source src="https://cdn.pixabay.com/video/2022/11/07/137685-769925905_large.mp4" type="video/mp4" />
          </video>
          <div className="video-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1>My-Bus.eu - Portal Transportowy</h1>
            <p>
              Znajdź zaufanego przewoźnika do Niemiec, Holandii i innych krajów
              Europy Zachodniej. Przewozy międzynarodowe i transfery wewnętrzne.
            </p>
            <Link to="/search" className="btn-hero">
              Szukaj przewoźnika →
            </Link>
          </div>
          <div className="hero-image">
            <TravelIllustration />
          </div>
        </div>
      </section>

      <div className="container">
        {/* Features section */}
        <section className="features-section">
          <div className="feature-card">
            <SearchIllustration />
            <h3>Łatwe wyszukiwanie</h3>
            <p>Znajdź przewoźników z Polski do Niemiec, Holandii, Belgii i innych krajów UE. Filtruj po trasie, typie usługi i cenie.</p>
          </div>
          <div className="feature-card">
            <VerifiedIllustration />
            <h3>Sprawdzone firmy</h3>
            <p>Zweryfikowane firmy transportowe z numerami rejestracyjnymi. Bezpieczne przewozy osób i paczek.</p>
          </div>
          <div className="feature-card">
            <CommunityIllustration />
            <h3>Oceny i recenzje</h3>
            <p>Prawdziwe opinie klientów o przewoźnikach. Sprawdź reputację przed rezerwacją.</p>
          </div>
        </section>

        {/* CTA Section - Zarejestruj się */}
        <section className="register-benefits-section">
          <div className="benefits-card">
            <h2>🎯 Załóż darmowe konto i zyskaj więcej!</h2>
            <div className="benefits-grid">
              <div className="benefit-item">
                <span className="benefit-icon">💬</span>
                <h4>Bezpośredni kontakt</h4>
                <p>Pisz wiadomości bezpośrednio do przewoźników przez platformę</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">⭐</span>
                <h4>Dodawaj opinie</h4>
                <p>Dziel się doświadczeniami i pomagaj innym w wyborze</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🔔</span>
                <h4>Powiadomienia</h4>
                <p>Otrzymuj alerty o nowych przewoźnikach na Twojej trasie</p>
              </div>
            </div>
            <div className="cta-buttons">
              <Link to="/register" className="btn-cta-primary" onClick={() => window.scrollTo(0, 0)}>
                Załóż konto za darmo
              </Link>
              <Link to="/login" className="btn-cta-secondary" onClick={() => window.scrollTo(0, 0)}>
                Mam już konto
              </Link>
            </div>
          </div>
        </section>

        <section className="search-section">
          <h2>Szukaj przewoźnika</h2>
          <SearchBar />
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/map" className="btn-map">
              🗺️ Zobacz wszystkie firmy na mapie
            </Link>
          </div>
        </section>

        <section className="featured-carriers">
          <h2>Polecani przewoźnicy</h2>
          
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Ładowanie przewoźników...</p>
              <small style={{ opacity: 0.7, marginTop: '8px' }}>
                Pierwsze ładowanie może potrwać do minuty
              </small>
            </div>
          )}

          {error && (
            <div className="error">
              <p>Błąd ładowania: {error}</p>
              <button onClick={() => getCarriers()} className="btn-retry">
                🔄 Spróbuj ponownie
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
              <p>Brak dostępnych przewoźników</p>
              <p className="text-small">Bądź pierwszy - załóż konto!</p>
            </div>
          )}
        </section>

        <section className="facebook-cta-section">
          <div className="facebook-cta-card">
            <div className="facebook-icon">📘</div>
            <h2>Obserwuj nas na Facebooku!</h2>
            <p>Bądź na bieżąco z nowościami, promocjami i ofertami przewoźników</p>
            <a 
              href="https://www.facebook.com/profile.php?id=61584903104321" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-facebook"
            >
              👍 Polub i obserwuj My-Bus.eu
            </a>
            <p className="facebook-subtext">Dołącz do naszej społeczności!</p>
          </div>
        </section>

        <section className="cta-section">
          <h2>Jesteś przewoźnikiem?</h2>
          <p>Dołącz do naszej platformy i znajdź nowych klientów</p>
          <Link to="/register" className="btn-join">
            Załóż konto bezpłatnie
          </Link>
        </section>
      </div>
    </div>
  )
}
