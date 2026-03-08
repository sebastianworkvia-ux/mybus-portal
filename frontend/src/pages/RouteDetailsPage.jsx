import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import CarrierCard from '../components/CarrierCard'
import apiClient from '../services/apiClient'
import './RouteDetailsPage.css'

export default function RouteDetailsPage() {
  const { fromCity, toCity } = useParams()
  const { t, i18n } = useTranslation()
  const [routeData, setRouteData] = useState(null)
  const [carriers, setCarriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const currentLang = i18n.language

  useEffect(() => {
    const fetchCarriersByRoute = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await apiClient.get(`/api/carriers/route/${fromCity}/${toCity}`)
        
        setRouteData(response.data.route)
        setCarriers(response.data.carriers || [])
      } catch (err) {
        console.error('Failed to load carriers:', err)
        if (err.response?.status === 404) {
          setError('Nie znaleziono takiej trasy. Sprawdź nazwy miast.')
        } else {
          setError(t('errors.loadFailed', 'Nie udało się załadować przewoźników'))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCarriersByRoute()
  }, [fromCity, toCity, t])

  // Error state
  if (error) {
    return (
      <>
        <Helmet>
          <title>Trasa nie znaleziona | My-Bus.eu</title>
        </Helmet>
        <div className="route-details-page">
          <section className="route-hero">
            <div className="container">
              <h1>Trasa nie znaleziona</h1>
              <p>{error}</p>
              <Link to="/search" className="btn-primary">
                Powrót do wyszukiwarki
              </Link>
            </div>
          </section>
        </div>
      </>
    )
  }

  // Loading state
  if (loading || !routeData) {
    return (
      <div className="route-details-page">
        <section className="route-carriers">
          <div className="container">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>{t('common.loading', 'Ładowanie...')}</p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const fromName = routeData.from.name
  const toName = routeData.to.name

  // SEO metadata
  const pageTitle = currentLang === 'pl' 
    ? `Busy ${fromName} ${toName} – przewoźnicy i transport | My-Bus.eu`
    : currentLang === 'de'
    ? `Busse ${fromName} ${toName} – Transportunternehmen | My-Bus.eu`
    : `Buses ${fromName} ${toName} – Carriers & Transport | My-Bus.eu`

  const metaDescription = currentLang === 'pl'
    ? `Znajdź sprawdzonych przewoźników busowych na trasie ${fromName} ${toName}. Transport osób i paczek. Zweryfikowane firmy transportowe.`
    : currentLang === 'de'
    ? `Finden Sie zuverlässige Busunternehmen auf der Strecke ${fromName} ${toName}. Personen- und Pakettransport.`
    : `Find verified bus carriers on the ${fromName} ${toName} route. Transport of people and packages.`

  // Schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Bus carriers ${fromName} - ${toName}`,
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
        "areaServed": [
          { "@type": "Place", "name": fromName },
          { "@type": "Place", "name": toName }
        ],
        "url": `${window.location.origin}/carrier/${carrier._id}`
      }
    }))
  }

  // FAQ data
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Jak długo trwa podróż z ${fromName} do ${toName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Czas podróży autobusem z ${fromName} do ${toName} zależy od przewoźnika i trasy. Zazwyczaj wynosi od kilku do kilkunastu godzin. Dokładny czas podróży sprawdzisz kontaktując się bezpośrednio z wybranym przewoźnikiem.`
        }
      },
      {
        "@type": "Question",
        "name": `Ile kosztuje bilet autobusowy ${fromName} ${toName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Ceny biletów autobusowych na trasie ${fromName} ${toName} różnią się w zależności od przewoźnika, sezonu i dostępności miejsc. Zalecamy kontakt z wybranymi przewoźnikami w celu uzyskania aktualnych cen.`
        }
      },
      {
        "@type": "Question",
        "name": `Czy mogę wysłać paczkę busem ${fromName} ${toName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Tak, wielu przewoźników oferuje usługę transportu paczek na trasie ${fromName} ${toName}. Sprawdź w profilach przewoźników, czy oferują tę usługę, i skontaktuj się z nimi bezpośrednio.`
        }
      },
      {
        "@type": "Question",
        "name": `Jak często kursują busy ${fromName} ${toName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Częstotliwość kursów zależy od przewoźnika. Niektórzy oferują regularne kursy kilka razy w tygodniu, inni jeżdżą na zamówienie. Sprawdź dni wyjazdów i powrotów w profilach przewoźników.`
        }
      }
    ]
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
        
        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqData)}
        </script>
      </Helmet>

      <div className="route-details-page">
        <section className="route-hero">
          <div className="container">
            <div className="breadcrumbs">
              <Link to="/">{t('nav.home', 'Strona główna')}</Link>
              <span className="separator">›</span>
              <Link to="/search">{t('nav.search', 'Szukaj')}</Link>
              <span className="separator">›</span>
              <span className="current">{fromName} → {toName}</span>
            </div>
            
            <h1>
              {currentLang === 'pl' && `Busy ${fromName} ${toName} – Transport osób i paczek`}
              {currentLang === 'de' && `Busse ${fromName} ${toName} – Personen- und Pakettransport`}
              {currentLang === 'en' && `Buses ${fromName} ${toName} – People & Parcel Transport`}
            </h1>
            
            <p className="route-subtitle">
              {currentLang === 'pl' && `Sprawdzeni przewoźnicy busowi na trasie ${fromName} → ${toName}. Znajdź najlepszą ofertę transportu dla siebie.`}
              {currentLang === 'de' && `Verifizierte Busunternehmen auf der Strecke ${fromName} → ${toName}. Finden Sie das beste Transportangebot für sich.`}
              {currentLang === 'en' && `Verified bus carriers on the ${fromName} → ${toName} route. Find the best transport offer for you.`}
            </p>
          </div>
        </section>

        <section className="route-carriers">
          <div className="container">
            {carriers.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🚌</div>
                <h3>{t('route.noCarriers', 'Brak przewoźników')}</h3>
                <p>
                  {currentLang === 'pl' && `Nie znaleźliśmy przewoźników na trasie ${fromName} → ${toName}.`}
                  {currentLang === 'de' && `Wir haben keine Transportunternehmen auf der Strecke ${fromName} → ${toName} gefunden.`}
                  {currentLang === 'en' && `We didn't find any carriers on the ${fromName} → ${toName} route.`}
                </p>
                <Link to="/search" className="btn-primary">
                  {t('common.searchOther', 'Szukaj innych tras')}
                </Link>
              </div>
            )}

            {carriers.length > 0 && (
              <>
                <div className="results-header">
                  <h2>
                    {currentLang === 'pl' && `Znaleziono ${carriers.length} przewoźników`}
                    {currentLang === 'de' && `${carriers.length} Transportunternehmen gefunden`}
                    {currentLang === 'en' && `Found ${carriers.length} carriers`}
                  </h2>
                  <p className="results-info">
                    {currentLang === 'pl' && 'Przewoźnicy posortowani: biznes → premium → bezpłatne'}
                    {currentLang === 'de' && 'Transportunternehmen sortiert: Business → Premium → Kostenlos'}
                    {currentLang === 'en' && 'Carriers sorted: business → premium → free'}
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

        {/* Route Information Section */}
        {carriers.length > 0 && (
          <section className="route-info">
            <div className="container">
              <div className="info-card">
                <h3>📍 Informacje o trasie {fromName} → {toName}</h3>
                <p>
                  {currentLang === 'pl' && `Trasa ${fromName} - ${toName} jest obsługiwana przez sprawdzonych przewoźników busowych. Transport osób i paczek odbywa się regularnie, zgodnie z harmonogramem każdego przewoźnika.`}
                  {currentLang === 'de' && `Die Strecke ${fromName} - ${toName} wird von verifizierten Busunternehmen bedient. Der Personen- und Pakettransport erfolgt regelmäßig nach dem Fahrplan jedes Transportunternehmens.`}
                  {currentLang === 'en' && `The ${fromName} - ${toName} route is served by verified bus carriers. People and parcel transport runs regularly according to each carrier's schedule.`}
                </p>
                <ul>
                  <li>
                    {currentLang === 'pl' && '✅ Zweryfikowani przewoźnicy z licencjami'}
                    {currentLang === 'de' && '✅ Verifizierte Transportunternehmen mit Lizenzen'}
                    {currentLang === 'en' && '✅ Verified carriers with licenses'}
                  </li>
                  <li>
                    {currentLang === 'pl' && '✅ Transport osób, paczek i dokumentów'}
                    {currentLang === 'de' && '✅ Transport von Personen, Paketen und Dokumenten'}
                    {currentLang === 'en' && '✅ Transport of people, parcels and documents'}
                  </li>
                  <li>
                    {currentLang === 'pl' && '✅ Konkurencyjne ceny i elastyczne terminy'}
                    {currentLang === 'de' && '✅ Wettbewerbsfähige Preise und flexible Termine'}
                    {currentLang === 'en' && '✅ Competitive prices and flexible schedules'}
                  </li>
                  <li>
                    {currentLang === 'pl' && '✅ Wygodne rezerwacje przez telefon lub email'}
                    {currentLang === 'de' && '✅ Bequeme Buchung per Telefon oder E-Mail'}
                    {currentLang === 'en' && '✅ Convenient booking by phone or email'}
                  </li>
                </ul>
                
                {/* Internal links to city pages */}
                <div className="city-links">
                  <p className="city-links-title">
                    {currentLang === 'pl' && 'Więcej przewoźników z tych miast:'}
                    {currentLang === 'de' && 'Mehr Transportunternehmen aus diesen Städten:'}
                    {currentLang === 'en' && 'More carriers from these cities:'}
                  </p>
                  <div className="city-links-buttons">
                    <Link to={`/city/${fromCity.toLowerCase()}`} className="btn-city-link">
                      🚌 {currentLang === 'pl' && `Wszystkie busy z ${fromName}`}
                      {currentLang === 'de' && `Alle Busse von ${fromName}`}
                      {currentLang === 'en' && `All buses from ${fromName}`}
                    </Link>
                    <Link to={`/city/${toCity.toLowerCase()}`} className="btn-city-link">
                      🚌 {currentLang === 'pl' && `Wszystkie busy z ${toName}`}
                      {currentLang === 'de' && `Alle Busse von ${toName}`}
                      {currentLang === 'en' && `All buses from ${toName}`}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {carriers.length > 0 && (
          <section className="route-faq">
            <div className="container">
              <h2>❓ Najczęściej zadawane pytania</h2>
              <div className="faq-list">
                <div className="faq-item">
                  <h3>Jak długo trwa podróż z {fromName} do {toName}?</h3>
                  <p>
                    Czas podróży autobusem z {fromName} do {toName} zależy od przewoźnika i trasy. 
                    Zazwyczaj wynosi od kilku do kilkunastu godzin. Dokładny czas podróży sprawdzisz 
                    kontaktując się bezpośrednio z wybranym przewoźnikiem.
                  </p>
                </div>

                <div className="faq-item">
                  <h3>Ile kosztuje bilet autobusowy {fromName} {toName}?</h3>
                  <p>
                    Ceny biletów autobusowych na trasie {fromName} {toName} różnią się w zależności 
                    od przewoźnika, sezonu i dostępności miejsc. Zalecamy kontakt z wybranymi 
                    przewoźnikami w celu uzyskania aktualnych cen.
                  </p>
                </div>

                <div className="faq-item">
                  <h3>Czy mogę wysłać paczkę busem {fromName} {toName}?</h3>
                  <p>
                    Tak, wielu przewoźników oferuje usługę transportu paczek na trasie {fromName} {toName}. 
                    Sprawdź w profilach przewoźników, czy oferują usługę "Paczki", i skontaktuj się 
                    z nimi bezpośrednio w sprawie szczegółów.
                  </p>
                </div>

                <div className="faq-item">
                  <h3>Jak często kursują busy {fromName} {toName}?</h3>
                  <p>
                    Częstotliwość kursów zależy od przewoźnika. Niektórzy oferują regularne kursy 
                    kilka razy w tygodniu, inni jeżdżą na zamówienie. Sprawdź dni wyjazdów i powrotów 
                    w profilach przewoźników lub skontaktuj się bezpośrednio.
                  </p>
                </div>

                <div className="faq-item">
                  <h3>Jak zarezerwować miejsce w busie?</h3>
                  <p>
                    Rezerwacja odbywa się bezpośrednio u przewoźnika. Kliknij w wybranego przewoźnika, 
                    sprawdź jego dane kontaktowe (telefon, email) i skontaktuj się w celu ustalenia 
                    szczegółów rezerwacji.
                  </p>
                </div>

                <div className="faq-item">
                  <h3>Czy przewoźnicy są sprawdzeni?</h3>
                  <p>
                    Tak, wszyscy przewoźnicy w naszej bazie są zweryfikowani. Posiadają niezbędne 
                    licencje i ubezpieczenia. Dodatkowo system opinii pozwala na sprawdzenie 
                    doświadczeń innych klientów.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
