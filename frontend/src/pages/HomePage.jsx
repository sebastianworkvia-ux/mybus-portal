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
        <div className="hero-background-image" style={{backgroundImage: "url('/hero-bus.png')"}}>
          {/* Tło ustawi się przez CSS jeśli plik nie istnieje, lub style inline nadpisze jak użytkownik wrzuci plik */}
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <h1>Przewozy busem po całej Europie – Twój niezawodny transport</h1>
            <p>
              🎯 Portal łączący klientów z ponad 190 zweryfikowanymi przewoźnikami | Transport na lotnisko, przewozy firmowe, okolicznościowe | Polska • Niemcy • Holandia • Belgia • Francja • Austria oraz wiele innych.
            </p>
          </div>
          {/* Ilustracja usunięta, bo mamy zdjęcie w tle */}
          <div className="hero-image" style={{opacity: 0}}></div> 
        </div>
      </section>

      <div className="search-section-wrapper">
        <div className="container">
          <SearchBar />
        </div>
      </div>

      <div className="container" style={{marginTop: '3rem'}}>
        {/* Usługi - Kategorie */}
        <section className="services-categories">
          <h2>Wybierz kategorię transportu</h2>
          <div className="categories-grid">
            <Link to="/search?service=transport" className="category-card">
              <span className="cat-icon">🚐</span>
              <h3>Busy międzynarodowe</h3>
            </Link>
            <Link to="/search?service=transfery-lotniskowe" className="category-card">
              <span className="cat-icon">✈️</span>
              <h3>Transfery lotniskowe</h3>
            </Link>
            <Link to="/search?service=paczki" className="category-card">
              <span className="cat-icon">📦</span>
              <h3>Paczki</h3>
            </Link>
            <Link to="/search?service=laweta" className="category-card">
              <span className="cat-icon">🚗</span>
              <h3>Lawety / Auta</h3>
            </Link>
            <Link to="/search?service=autokary" className="category-card">
              <span className="cat-icon">🚌</span>
              <h3>Autokary</h3>
            </Link>
            <Link to="/search?service=zwierzeta" className="category-card">
              <span className="cat-icon">🐕</span>
              <h3>Transport zwierząt</h3>
            </Link>
            <Link to="/search?service=przeprowadzki" className="category-card">
              <span className="cat-icon">🏠</span>
              <h3>Przeprowadzki</h3>
            </Link>
            <Link to="/search?service=przejazdy-sluzbowe" className="category-card">
              <span className="cat-icon">👔</span>
              <h3>Przejazdy służbowe</h3>
            </Link>
          </div>
        </section>

        {/* Features section */}
        <section className="features-section" style={{marginTop: '4rem'}}>
          <div className="feature-card">
            <SearchIllustration />
            <h3>🔍 Wyszukaj Przewoźnika w Całej Europie</h3>
            <p>Ponad 190 firm transportowych na jednej platformie. Filtruj według kraju (DE, NL, BE, FR, AT, PL), typu usługi i trasy. Interaktywna mapa pokazuje przewoźników w Twojej okolicy.</p>
          </div>
          <div className="feature-card">
            <VerifiedIllustration />
            <h3>✔️ Tylko Zweryfikowane Firmy</h3>
            <p>Wszystkie firmy posiadają numery rejestracyjne i licencje transportowe. Bezpieczne przewozy osób i paczek. Pełna przejrzystość i profesjonalizm.</p>
          </div>
          <div className="feature-card">
            <CommunityIllustration />
            <h3>⭐ Opinie Prawdziwych Klientów</h3>
            <p>System ocen i recenzji pomaga wybrać najlepszego przewoźnika. Sprawdzone opinie, realna reputacja. Podejmuj świadome decyzje.</p>
          </div>
        </section>

        {/* CTA Section - Zarejestruj się */}
        <section className="register-benefits-section">
          <div className="benefits-card">
            <h2>🚀 Dołącz do My-Bus.eu - Więcej Klientów, Większy Zasięg!</h2>
            <div className="benefits-grid">
              <div className="benefit-item">
                <span className="benefit-icon">💬</span>
                <h4>Bezpośredni Kontakt z Przewoźnikami</h4>
                <p>System wiadomości wewnętrznych - komunikuj się bezpośrednio, szybko ustalaj szczegóły podroży</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">⭐</span>
                <h4>Buduj Reputację</h4>
                <p>Oceniaj przewoźników i czytaj opinie innych. Pomagaj budować społeczność zaufanych usług</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🔔</span>
                <h4>Personalizowane Powiadomienia</h4>
                <p>Otrzymuj alerty o nowych przewoźnikach na Twojej trasie. Nie przegap najlepszych ofert</p>
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
