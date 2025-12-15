import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import CarrierCard from '../components/CarrierCard'
import { SearchIllustration, TravelIllustration, CommunityIllustration } from '../components/Illustrations'
import { useCarrierStore } from '../stores/carrierStore'
import './HomePage.css'

export default function HomePage() {
  const { carriers, getCarriers } = useCarrierStore()

  useEffect(() => {
    getCarriers()
  }, [])

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
            <h1>MyBus - Portal Transportowy</h1>
            <p>
              Znajdź zaufanego przewoźnika w Niemczech, Holandii i krajach
              Europy Zachodniej
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
            <p>Filtruj po kraju, typie usługi i znajdź idealnego przewoźnika</p>
          </div>
          <div className="feature-card">
            <TravelIllustration />
            <h3>Sprawdzone firmy</h3>
            <p>Wszystkie firmy z rejestracją i opiniami klientów</p>
          </div>
          <div className="feature-card">
            <CommunityIllustration />
            <h3>Oceny i recenzje</h3>
            <p>Zobacz co mówią inni klienci przed podjęciem decyzji</p>
          </div>
        </section>

        <section className="search-section">
          <h2>Szukaj przewoźnika</h2>
          <SearchBar />
        </section>

        <section className="featured-carriers">
          <h2>Polecani przewoźnicy</h2>
          <div className="carriers-grid">
            {carriers.slice(0, 6).map((carrier) => (
              <CarrierCard key={carrier._id} carrier={carrier} />
            ))}
          </div>

          {carriers.length === 0 && (
            <div className="no-carriers">
              <p>Brak dostępnych przewoźników</p>
              <p className="text-small">Bądź pierwszy - załóż konto!</p>
            </div>
          )}
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
