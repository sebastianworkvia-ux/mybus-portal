import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import CarrierCard from '../components/CarrierCard'
import apiClient from '../services/apiClient'
import './CountryTransportPage.css'

// Mapowanie nazw krajów (URL → nazwa dla wyświetlania)
const countryNames = {
  // English URLs
  'germany': { pl: 'Niemcy', de: 'Deutschland', en: 'Germany', code: 'DE' },
  'netherlands': { pl: 'Holandia', de: 'Niederlande', en: 'Netherlands', code: 'NL' },
  'belgium': { pl: 'Belgia', de: 'Belgien', en: 'Belgium', code: 'BE' },
  'france': { pl: 'Francja', de: 'Frankreich', en: 'France', code: 'FR' },
  'austria': { pl: 'Austria', de: 'Österreich', en: 'Austria', code: 'AT' },
  'denmark': { pl: 'Dania', de: 'Dänemark', en: 'Denmark', code: 'DK' },
  'norway': { pl: 'Norwegia', de: 'Norwegen', en: 'Norway', code: 'NO' },
  'sweden': { pl: 'Szwecja', de: 'Schweden', en: 'Sweden', code: 'SE' },
  'switzerland': { pl: 'Szwajcaria', de: 'Schweiz', en: 'Switzerland', code: 'CH' },
  'luxembourg': { pl: 'Luksemburg', de: 'Luxemburg', en: 'Luxembourg', code: 'LU' },
  'england': { pl: 'Anglia', de: 'England', en: 'England', code: 'GB' },
  'uk': { pl: 'Wielka Brytania', de: 'Großbritannien', en: 'United Kingdom', code: 'GB' },
  
  // Polish URLs (aliases)
  'niemcy': { pl: 'Niemcy', de: 'Deutschland', en: 'Germany', code: 'DE' },
  'holandia': { pl: 'Holandia', de: 'Niederlande', en: 'Netherlands', code: 'NL' },
  'belgia': { pl: 'Belgia', de: 'Belgien', en: 'Belgium', code: 'BE' },
  'francja': { pl: 'Francja', de: 'Frankreich', en: 'France', code: 'FR' },
  'austria': { pl: 'Austria', de: 'Österreich', en: 'Austria', code: 'AT' },
  'dania': { pl: 'Dania', de: 'Dänemark', en: 'Denmark', code: 'DK' },
  'norwegia': { pl: 'Norwegia', de: 'Norwegen', en: 'Norway', code: 'NO' },
  'szwecja': { pl: 'Szwecja', de: 'Schweden', en: 'Sweden', code: 'SE' },
  'szwajcaria': { pl: 'Szwajcaria', de: 'Schweiz', en: 'Switzerland', code: 'CH' },
  'luksemburg': { pl: 'Luksemburg', de: 'Luxemburg', en: 'Luxembourg', code: 'LU' },
  'anglia': { pl: 'Anglia', de: 'England', en: 'England', code: 'GB' }
}

export default function CountryTransportPage() {
  const { country } = useParams()
  const { t, i18n } = useTranslation()
  const [carriers, setCarriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const countryData = countryNames[country?.toLowerCase()] || null
  const currentLang = i18n.language

  // Get localized country name
  const getCountryName = (lang) => {
    if (!countryData) return country
    return countryData[lang] || countryData.pl
  }

  const countryName = getCountryName(currentLang)

  useEffect(() => {
    const fetchCarriersByDestination = async () => {
      if (!countryData) {
        setError('Nieznany kraj')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Fetch carriers for this destination country
        const response = await apiClient.get(`/api/carriers/by-destination/${country}`)
        
        setCarriers(response.data.carriers || [])
      } catch (err) {
        console.error('Failed to load carriers:', err)
        setError(t('errors.loadFailed', 'Nie udało się załadować przewoźników'))
      } finally {
        setLoading(false)
      }
    }

    fetchCarriersByDestination()
  }, [country, countryData, t])

  // SEO metadata
  const pageTitle = currentLang === 'pl' 
    ? `Busy do ${countryName} – Przewoźnicy Polska ${countryName} | My-Bus.eu`
    : currentLang === 'de'
    ? `Busse nach ${countryName} – Transportunternehmen | My-Bus.eu`
    : `Buses to ${countryName} – Polish Carriers | My-Bus.eu`

  const metaDescription = currentLang === 'pl'
    ? `Znajdź sprawdzonych przewoźników do ${countryName}. Transport osób i paczek Polska-${countryName}. Zweryfikowane firmy transportowe.`
    : currentLang === 'de'
    ? `Finden Sie zuverlässige Transportunternehmen nach ${countryName}. Personen- und Pakettransport Polen-${countryName}.`
    : `Find verified carriers to ${countryName}. Transport of people and packages Poland-${countryName}. Verified transport companies.`

  // Schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Bus carriers to ${countryName}`,
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
        "areaServed": {
          "@type": "Country",
          "name": countryName
        },
        "url": `${window.location.origin}/carrier/${carrier._id}`
      }
    }))
  }

  // Error state - unknown country
  if (!countryData) {
    return (
      <>
        <Helmet>
          <title>Nieznany kraj | My-Bus.eu</title>
        </Helmet>
        <div className="country-transport-page">
          <section className="country-hero">
            <div className="container">
              <h1>Nieznany kraj</h1>
              <p>Nie obsługujemy jeszcze tego kierunku.</p>
              <Link to="/search" className="btn-primary">
                Powrót do wyszukiwarki
              </Link>
            </div>
          </section>
        </div>
      </>
    )
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

      <div className="country-transport-page">
        <section className="country-hero">
          <div className="container">
            <div className="breadcrumbs">
              <Link to="/">{t('nav.home', 'Strona główna')}</Link>
              <span className="separator">›</span>
              <Link to="/search">{t('nav.search', 'Szukaj')}</Link>
              <span className="separator">›</span>
              <span className="current">{countryName}</span>
            </div>
            
            <h1>
              {currentLang === 'pl' && `Transport do ${countryName} – Polscy przewoźnicy`}
              {currentLang === 'de' && `Transport nach ${countryName} – Polnische Transportunternehmen`}
              {currentLang === 'en' && `Transport to ${countryName} – Polish Carriers`}
            </h1>
            
            <p className="country-subtitle">
              {currentLang === 'pl' && `Sprawdzeni przewoźnicy busowi jeżdżący do ${countryName}. Transport osób i paczek Polska-${countryName}.`}
              {currentLang === 'de' && `Verifizierte Busunternehmen nach ${countryName}. Personen- und Pakettransport Polen-${countryName}.`}
              {currentLang === 'en' && `Verified bus carriers to ${countryName}. Transport of people and packages Poland-${countryName}.`}
            </p>
          </div>
        </section>

        <section className="country-carriers">
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
                <h3>{t('country.noCarriers', 'Brak przewoźników')}</h3>
                <p>
                  {currentLang === 'pl' && `Nie znaleźliśmy przewoźników jeżdżących do ${countryName}.`}
                  {currentLang === 'de' && `Wir haben keine Transportunternehmen nach ${countryName} gefunden.`}
                  {currentLang === 'en' && `We didn't find any carriers to ${countryName}.`}
                </p>
                <Link to="/search" className="btn-primary">
                  {t('common.searchOther', 'Szukaj innych kierunków')}
                </Link>
              </div>
            )}

            {!loading && !error && carriers.length > 0 && (
              <>
                <div className="results-header">
                  <h2>
                    {currentLang === 'pl' && `Znaleziono ${carriers.length} przewoźników do ${countryName}`}
                    {currentLang === 'de' && `${carriers.length} Transportunternehmen nach ${countryName} gefunden`}
                    {currentLang === 'en' && `Found ${carriers.length} carriers to ${countryName}`}
                  </h2>
                  <p className="results-info">
                    {currentLang === 'pl' && 'Firmy posortowane według planu: biznes → premium → bezpłatne'}
                    {currentLang === 'de' && 'Unternehmen sortiert nach Plan: Business → Premium → Kostenlos'}
                    {currentLang === 'en' && 'Companies sorted by plan: business → premium → free'}
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
          <section className="country-info">
            <div className="container">
              <div className="info-card">
                <h3>
                  {currentLang === 'pl' && `Dlaczego warto wybrać przewoźnika do ${countryName}?`}
                  {currentLang === 'de' && `Warum lohnt es sich, ein Transportunternehmen nach ${countryName} zu wählen?`}
                  {currentLang === 'en' && `Why choose a carrier to ${countryName}?`}
                </h3>
                <ul>
                  <li>
                    {currentLang === 'pl' && '✅ Przewoźnicy specjalizujący się w tej trasie'}
                    {currentLang === 'de' && '✅ Transportunternehmen mit Spezialisierung auf diese Route'}
                    {currentLang === 'en' && '✅ Carriers specializing in this route'}
                  </li>
                  <li>
                    {currentLang === 'pl' && '✅ Zweryfikowane firmy z opiniami klientów'}
                    {currentLang === 'de' && '✅ Verifizierte Unternehmen mit Kundenbewertungen'}
                    {currentLang === 'en' && '✅ Verified companies with customer reviews'}
                  </li>
                  <li>
                    {currentLang === 'pl' && '✅ Konkurencyjne ceny i elastyczne terminy'}
                    {currentLang === 'de' && '✅ Wettbewerbsfähige Preise und flexible Termine'}
                    {currentLang === 'en' && '✅ Competitive prices and flexible schedules'}
                  </li>
                  <li>
                    {currentLang === 'pl' && '✅ Śledzenie przesyłek i pomoc techniczna'}
                    {currentLang === 'de' && '✅ Sendungsverfolgung und technische Unterstützung'}
                    {currentLang === 'en' && '✅ Shipment tracking and technical support'}
                  </li>
                </ul>
              </div>

              <div className="info-card">
                <h3>
                  {currentLang === 'pl' && 'Popularne kierunki'}
                  {currentLang === 'de' && 'Beliebte Reiseziele'}
                  {currentLang === 'en' && 'Popular destinations'}
                </h3>
                <div className="destinations-grid">
                  {country !== 'germany' && country !== 'niemcy' && (
                    <Link to="/transport-to/germany" className="destination-link">
                      🇩🇪 {currentLang === 'pl' ? 'Transport do Niemiec' : currentLang === 'de' ? 'Transport nach Deutschland' : 'Transport to Germany'}
                    </Link>
                  )}
                  {country !== 'netherlands' && country !== 'holandia' && (
                    <Link to="/transport-to/netherlands" className="destination-link">
                      🇳🇱 {currentLang === 'pl' ? 'Transport do Holandii' : currentLang === 'de' ? 'Transport in die Niederlande' : 'Transport to Netherlands'}
                    </Link>
                  )}
                  {country !== 'belgium' && country !== 'belgia' && (
                    <Link to="/transport-to/belgium" className="destination-link">
                      🇧🇪 {currentLang === 'pl' ? 'Transport do Belgii' : currentLang === 'de' ? 'Transport nach Belgien' : 'Transport to Belgium'}
                    </Link>
                  )}
                  {country !== 'france' && country !== 'francja' && (
                    <Link to="/transport-to/france" className="destination-link">
                      🇫🇷 {currentLang === 'pl' ? 'Transport do Francji' : currentLang === 'de' ? 'Transport nach Frankreich' : 'Transport to France'}
                    </Link>
                  )}
                  {country !== 'austria' && (
                    <Link to="/transport-to/austria" className="destination-link">
                      🇦🇹 {currentLang === 'pl' ? 'Transport do Austrii' : currentLang === 'de' ? 'Transport nach Österreich' : 'Transport to Austria'}
                    </Link>
                  )}
                  {country !== 'uk' && country !== 'england' && country !== 'anglia' && (
                    <Link to="/transport-to/uk" className="destination-link">
                      🇬🇧 {currentLang === 'pl' ? 'Transport do Wielkiej Brytanii' : currentLang === 'de' ? 'Transport nach Großbritannien' : 'Transport to UK'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
