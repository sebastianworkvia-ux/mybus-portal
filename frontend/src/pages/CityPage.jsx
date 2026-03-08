import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/SearchBar'
import CarrierCard from '../components/CarrierCard'
import apiClient from '../services/apiClient'
import './CityPage.css'

export default function CityPage() {
  const { cityName } = useParams()
  const { t, i18n } = useTranslation()
  const [carriers, setCarriers] = useState([])
  const [cityData, setCityData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const currentLang = i18n.language

  useEffect(() => {
    const fetchCarriersByCity = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Use new backend endpoint for city filtering
        const response = await apiClient.get(`/carriers/city/${cityName}`)
        
        setCarriers(response.data.carriers || [])
        setCityData(response.data.city)
      } catch (err) {
        console.error('Failed to load carriers:', err)
        if (err.response?.status === 404) {
          setError(t('errors.cityNotFound', 'Nie znaleziono miasta'))
        } else {
          setError(t('errors.loadFailed', 'Nie udało się załadować przewoźników'))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCarriersByCity()
  }, [cityName, t])
  
  const city = cityData?.name || cityName

  // SEO metadata
  const pageTitle = currentLang === 'pl' 
    ? `Busy z ${city} do Niemiec i Europy | My-Bus.eu`
    : currentLang === 'de'
    ? `Busse von ${city} nach Deutschland und Europa | My-Bus.eu`
    : `Buses from ${city} to Germany and Europe | My-Bus.eu`

  const metaDescription = currentLang === 'pl'
    ? `Znajdź przewoźników busowych z ${city}. Transport osób i paczek Polska Niemcy Holandia.`
    : currentLang === 'de'
    ? `Finden Sie Busunternehmen von ${city}. Personen- und Pakettransport Polen Deutschland Niederlande.`
    : `Find bus carriers from ${city}. Transport of people and packages Poland Germany Netherlands.`

  // Schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Bus carriers from ${city}`,
    "description": metaDescription,
    "numberOfItems": carriers.length,
    "itemListElement": carriers.map((carrier, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "TransportService",
        "name": carrier.companyName,
        "description": carrier.description,
        "provider": {
          "@type": "Organization",
          "name": carrier.companyName,
          "telephone": carrier.phone,
          "email": carrier.email
        },
        "areaServed": carrier.operatingCountries?.map(c => ({
          "@type": "Country",
          "name": c
        })),
        "url": `${window.location.origin}/carriers/${carrier._id}`
      }
    }))
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <link rel="canonical" href={window.location.href} />
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

      <div className="city-page">
        <section className="city-hero">
          <div className="container">
            <div className="breadcrumbs">
              <Link to="/">{t('nav.home', 'Strona główna')}</Link>
              <span className="separator">›</span>
              <Link to="/search">{t('nav.search', 'Szukaj')}</Link>
              <span className="separator">›</span>
              <span className="current">{city}</span>
            </div>
            
            <h1>
              {currentLang === 'pl' && `Busy z ${city} - Transport do Europy`}
              {currentLang === 'de' && `Busse von ${city} - Transport nach Europa`}
              {currentLang === 'en' && `Buses from ${city} - Transport to Europe`}
            </h1>
            
            <p className="city-subtitle">
              {currentLang === 'pl' && `Sprawdzeni przewoźnicy busowi z ${city}. Transport osób i paczek do Niemiec, Holandii, Belgii i innych krajów UE.`}
              {currentLang === 'de' && `Verifizierte Busunternehmen von ${city}. Transport von Personen und Paketen nach Deutschland, Niederlande, Belgien.`}
              {currentLang === 'en' && `Verified bus carriers from ${city}. Transport of people and packages to Germany, Netherlands, Belgium and other EU countries.`}
            </p>
            
            {/* Search Bar for filtering */}
            <div className="city-search-bar">
              <SearchBar />
            </div>
          </div>
        </section>

        <section className="city-carriers">
          <div className="container">
            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>{t('common.loading', 'Ładowanie...')}</p>
              </div>
            )}

            {error && (
              <div className="error-state">
                <p className="error-message">{error}</p>
                <Link to="/search" className="btn-secondary">
                  {t('common.backToSearch', 'Powrót do wyszukiwarki')}
                </Link>
              </div>
            )}

            {!loading && !error && carriers.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🚌</div>
                <h3>{t('city.noCarriers', 'Brak przewoźników')}</h3>
                <p>
                  {currentLang === 'pl' && `Nie znaleźliśmy przewoźników z miasta ${city}.`}
                  {currentLang === 'de' && `Wir haben keine Transportunternehmen aus ${city} gefunden.`}
                  {currentLang === 'en' && `We didn't find any carriers from ${city}.`}
                </p>
                <Link to="/search" className="btn-primary">
                  {t('common.searchOther', 'Szukaj w innych miastach')}
                </Link>
              </div>
            )}

            {!loading && !error && carriers.length > 0 && (
              <>
                <div className="results-header">
                  <h2>
                    {t('city.foundCarriers', 'Znaleziono {{count}} przewoźników', { count: carriers.length })}
                  </h2>
                  <p className="results-info">
                    {currentLang === 'pl' && 'Wybierz przewoźnika i sprawdź szczegóły oferty'}
                    {currentLang === 'de' && 'Wählen Sie einen Transportunternehmen und prüfen Sie die Details'}
                    {currentLang === 'en' && 'Choose a carrier and check the offer details'}
                  </p>
                </div>

                <div className="carriers-grid">
                  {carriers.map((carrier) => (
                    <CarrierCard key={carrier._id} carrier={carrier} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* SEO internal linking section */}
        {!loading && carriers.length > 0 && (
          <section className="city-info">
            <div className="container">
              <div className="info-card">
                <h3>
                  {currentLang === 'pl' && `Dlaczego warto wybrać przewoźnika z ${city}?`}
                  {currentLang === 'de' && `Warum lohnt es sich, ein Transportunternehmen aus ${city} zu wählen?`}
                  {currentLang === 'en' && `Why choose a carrier from ${city}?`}
                </h3>
                <ul>
                  <li>
                    {currentLang === 'pl' && '✅ Lokalni przewoźnicy znają najlepsze trasy'}
                    {currentLang === 'de' && '✅ Lokale Transportunternehmen kennen die besten Routen'}
                    {currentLang === 'en' && '✅ Local carriers know the best routes'}
                  </li>
                  <li>
                    {currentLang === 'pl' && '✅ Wygodny punkt wyjazdu w Twojej okolicy'}
                    {currentLang === 'de' && '✅ Bequemer Abfahrtsort in Ihrer Nähe'}
                    {currentLang === 'en' && '✅ Convenient departure point in your area'}
                  </li>
                  <li>
                    {currentLang === 'pl' && '✅ Sprawdzone firmy z opiniami klientów'}
                    {currentLang === 'de' && '✅ Bewährte Unternehmen mit Kundenbewertungen'}
                    {currentLang === 'en' && '✅ Verified companies with customer reviews'}
                  </li>
                  <li>
                    {currentLang === 'pl' && '✅ Bezpośrednie połączenia do popularnych destynacji w UE'}
                    {currentLang === 'de' && '✅ Direkte Verbindungen zu beliebten Zielen in der EU'}
                    {currentLang === 'en' && '✅ Direct connections to popular EU destinations'}
                  </li>
                </ul>
                
                <div className="cta-box">
                  <p>
                    {currentLang === 'pl' && `Szukasz przewoźnika z innego miasta?`}
                    {currentLang === 'de' && `Suchen Sie ein Transportunternehmen aus einer anderen Stadt?`}
                    {currentLang === 'en' && `Looking for a carrier from another city?`}
                  </p>
                  <Link to="/search" className="btn-cta">
                    {t('common.searchAll', 'Przeszukaj wszystkich przewoźników')}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
