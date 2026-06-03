import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { carrierService, reviewService, messageService } from '../services/services'
import { useAuthStore } from '../stores/authStore'
import CarrierMapViewer from '../components/CarrierMapViewer'
import './CarrierDetailsPage.css'

export default function CarrierDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [carrier, setCarrier] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState(null)
  
  const [sendingMessage, setSendingMessage] = useState(false)

  // Przewiń do góry przy wejściu na stronę
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [carrierRes, reviewsRes] = await Promise.all([
          carrierService.getCarrierById(id),
          reviewService.getReviewsByCarrier(id)
        ])
        const carrierData = carrierRes.data
        setCarrier(carrierData)
        setReviews(reviewsRes.data)

        // Przekieruj z MongoDB _id na slug (SEO: unikaj duplikatów URL)
        if (carrierData.slug && id !== carrierData.slug) {
          navigate(`/carrier/${carrierData.slug}`, { replace: true })
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Błąd ładowania danych')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError(null)
    setSubmitting(true)

    try {
      const response = await reviewService.createReview({
        carrierId: id,
        rating,
        comment
      })
      
      setReviews([response.data.review, ...reviews])
      setCarrier(prev => ({
        ...prev,
        rating: response.data.carrierRating,
        reviewCount: response.data.carrierReviewCount
      }))
      
      setShowReviewForm(false)
      setComment('')
      setRating(5)
      alert('Opinia dodana pomyślnie!')
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Błąd dodawania opinii')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendMessage = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!carrier.userId?._id) {
      alert('Ten przewoźnik nie ma jeszcze konta użytkownika - nie można wysłać wiadomości.')
      return
    }

    // Przekieruj do strony wiadomości i rozpocznij konwersację
    try {
      setSendingMessage(true)
      // Wyślij pierwszą wiadomość automatyczną
      await messageService.sendMessage({
        receiverId: carrier.userId._id,
        carrierId: carrier._id,
        content: `Cześć! Jestem zainteresowany Twoimi usługami transportowymi (${carrier.companyName}). Proszę o kontakt.`
      })
      navigate('/messages')
    } catch (err) {
      alert('Błąd wysyłania wiadomości: ' + (err.response?.data?.error || 'Spróbuj ponownie'))
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return <div className="carrier-detail-page"><div className="container">Ładowanie...</div></div>
  }

  if (error || !carrier) {
    return (
      <div className="carrier-detail-page">
        <div className="container">
          <div className="error-box">
            <p>{error || 'Przewoźnik nie został znaleziony'}</p>
            <Link to="/search" className="btn-back">← Powrót do wyszukiwania</Link>
          </div>
        </div>
      </div>
    )
  }

  const stars = '⭐'.repeat(Math.floor(carrier.rating || 0))
  const userReview = reviews.find(r => r.userId?._id === user?.id)

  // BreadcrumbList JSON-LD
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Strona główna", "item": "https://my-bus.eu/" },
      { "@type": "ListItem", "position": 2, "name": "Wyszukiwarka", "item": "https://my-bus.eu/search" },
      { "@type": "ListItem", "position": 3, "name": carrier.companyName, "item": `https://my-bus.eu/carrier/${carrier.slug || carrier._id}` }
    ]
  }

  // Schema.org — mapa kodów krajów na angielskie nazwy (standard schema.org)
  const schemaCountryNames = {
    DE: 'Germany', NL: 'Netherlands', BE: 'Belgium', FR: 'France',
    AT: 'Austria', PL: 'Poland', GB: 'United Kingdom', SE: 'Sweden',
    NO: 'Norway', DK: 'Denmark', CH: 'Switzerland', IT: 'Italy',
    ES: 'Spain', CZ: 'Czech Republic', SK: 'Slovakia'
  }

  // Mapa usług do czytelnych etykiet (reużywa serviceLabels zdefiniowanych niżej)
  const schemaServiceLabels = {
    transport: 'Transport busem', przeprowadzki: 'Przeprowadzki', laweta: 'Laweta / Autotransport',
    'transfery-lotniskowe': 'Transfery lotniskowe', paczki: 'Transport paczek',
    autokary: 'Wycieczki autokarowe', 'przejazdy-sluzbowe': 'Przejazdy służbowe',
    zwierzeta: 'Transport zwierząt', dokumenty: 'Transport dokumentów',
    'transport-rzeczy': 'Transport towarów', inne: 'Inne usługi transportowe'
  }

  const profileUrl = `https://my-bus.eu/carrier/${carrier.slug || carrier._id}`

  // @type: LocalBusiness lub ["LocalBusiness","MovingCompany"] dla firm przeprowadzkowych
  const schemaType = carrier.services?.includes('przeprowadzki')
    ? ['LocalBusiness', 'MovingCompany']
    : 'LocalBusiness'

  // Prepare Schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": profileUrl,
    "name": carrier.companyName,
    "url": profileUrl,
    "description": carrier.description
      || carrier.detailedDescription
      || `${carrier.companyName} — firma transportowa w my-bus.eu`
  }

  // telephone — tylko gdy istnieje
  if (carrier.phone) schemaData.telephone = carrier.phone

  // email — tylko gdy istnieje
  if (carrier.email) schemaData.email = carrier.email

  // sameAs — strona firmy (nie url)
  if (carrier.website) schemaData.sameAs = [carrier.website]

  // image/logo — tylko gdy istnieje
  if (carrier.logo) {
    schemaData.image = carrier.logo
    schemaData.logo = carrier.logo
  }

  // address — tylko gdy mamy choć jedno pole lokalizacji
  if (carrier.location?.city || carrier.location?.postalCode || carrier.country) {
    const address = { "@type": "PostalAddress" }
    if (carrier.location?.city)       address.addressLocality = carrier.location.city
    if (carrier.location?.postalCode) address.postalCode = carrier.location.postalCode
    if (carrier.country)              address.addressCountry = carrier.country
    schemaData.address = address
  }

  // areaServed — kody → pełne nazwy krajów
  if (carrier.operatingCountries?.length > 0) {
    schemaData.areaServed = carrier.operatingCountries.map(code => ({
      "@type": "Country",
      "name": schemaCountryNames[code] || code
    }))
  }

  // serviceType — tablica czytelnych etykiet
  if (carrier.services?.length > 0) {
    schemaData.serviceType = carrier.services.map(s => schemaServiceLabels[s] || s)
  }

  // aggregateRating — tylko gdy istnieją realne opinie
  if (carrier.rating && carrier.reviewCount > 0) {
    schemaData.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": carrier.rating,
      "reviewCount": carrier.reviewCount,
      "bestRating": 5,
      "worstRating": 1
    }
  }

  // SEO meta tags
  const cityPart = carrier.location?.city && carrier.location.city !== 'Polska' ? `, ${carrier.location.city}` : ''
  const countryNames = { DE: 'Niemcy', NL: 'Holandia', BE: 'Belgia', FR: 'Francja', AT: 'Austria', PL: 'Polska', GB: 'Wielka Brytania' }
  const countryLabel = countryNames[carrier.country] || carrier.country
  const serviceLabels = { transport: 'transport busem', przeprowadzki: 'przeprowadzki', laweta: 'laweta', 'transfery-lotniskowe': 'transfery lotniskowe', paczki: 'paczki', autokary: 'autokary' }
  const servicesStr = carrier.services?.map(s => serviceLabels[s] || s).join(', ')

  const countryCodeToSlug = {
    DE: 'germany', NL: 'netherlands', BE: 'belgium', FR: 'france',
    AT: 'austria', GB: 'uk', SE: 'sweden', NO: 'norway', DK: 'denmark'
  }
  const transportSlug = countryCodeToSlug[carrier.country] || null

  const pageTitle = `${carrier.companyName}${cityPart} - Przewoźnik ${countryLabel} | My-Bus.eu`
  const metaDescription = carrier.description
    ? `${carrier.description.slice(0, 120)} ✅ Kontakt, opinie, usługi: ${servicesStr || 'transport'}.`
    : carrier.reviewCount > 0
      ? `${carrier.companyName}${cityPart} — przewoźnik w ${countryLabel}. Usługi: ${servicesStr || 'transport osób i paczek'}. Zweryfikowane opinie klientów.`
      : `${carrier.companyName}${cityPart} — profil firmy transportowej w my-bus.eu. Sprawdź dane kontaktowe, obsługiwane kierunki i dostępne usługi.`

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="business.business" />
        <meta property="og:url" content={`https://my-bus.eu/carrier/${carrier.slug || carrier._id}`} />
        <meta property="og:image" content={carrier.logo || 'https://my-bus.eu/przewoznicy.png'} />
        <link rel="canonical" href={`https://my-bus.eu/carrier/${carrier.slug || carrier._id}`} />
        
        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      </Helmet>

      <div className="carrier-detail-page">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Strona główna</Link>
          <span className="separator">›</span>
          <Link to="/search">Wyszukiwarka</Link>
          <span className="separator">›</span>
          <span className="current">{carrier.companyName}</span>
        </nav>

        <div className="carrier-header">
          {/* Banner dla niezarejestrowanych firm */}
          {!carrier.userId && (
            <div className="unclaimed-banner">
              <div className="unclaimed-content">
                <span className="unclaimed-icon">🏢</span>
                <div className="unclaimed-text">
                  <h3>Czy to Twoja firma?</h3>
                  <p>Jesteś właścicielem tej firmy? Przejmij profil, uzupełnij dane, dodaj opis, logo i zwiększ widoczność swojej firmy w my-bus.eu.</p>
                </div>
              </div>
              <div className="unclaimed-actions">
                <a href={`mailto:kontakt.mybus@gmail.com?subject=Przejęcie profilu - ${carrier.companyName}&body=Witam,%0D%0A%0D%0AChciałbym przejąć profil firmy: ${carrier.companyName}%0D%0ANumer rejestracyjny: ${carrier.companyRegistration}%0D%0A%0D%0APrzykładam dokumenty potwierdzające własność firmy.%0D%0A%0D%0APozdrawiam`} 
                   className="btn-claim">
                  ✅ Przejmij profil
                </a>
                <a href={`mailto:kontakt.mybus@gmail.com?subject=Usunięcie profilu - ${carrier.companyName}&body=Witam,%0D%0A%0D%0AProszę o usunięcie profilu firmy: ${carrier.companyName}%0D%0ANumer rejestracyjny: ${carrier.companyRegistration}%0D%0A%0D%0APrzykładam dokumenty potwierdzające, że jestem właścicielem.%0D%0A%0D%0APozdrawiam`}
                   className="btn-remove-profile">
                  🗑️ Poproś o usunięcie
                </a>
              </div>
            </div>
          )}

          {carrier.logo && (
            <div className="carrier-logo-large">
              <img src={carrier.logo} alt={`${carrier.companyName} logo`} />
            </div>
          )}
          
          <div className="carrier-title-area">
          <div className="carrier-title">
            <h1>{carrier.companyName} — firma transportowa</h1>
            {carrier.isPremium && <span className="premium-badge">⭐ PREMIUM</span>}
            {carrier.isVerified
              ? <span className="verified-badge">✓ Zweryfikowana firma</span>
              : <span className="unverified-badge">Profil niezweryfikowany</span>
            }
            <span className="country-badge-large">{carrier.country}</span>
          </div>

          {/* Ogłoszenie Premium */}
          {carrier.announcement && carrier.isPremium && (
            <div className="premium-announcement">
              <span className="announcement-icon">📢</span>
              <p>{carrier.announcement}</p>
            </div>
          )}

          {carrier.reviewCount > 0 ? (
          <div className="carrier-rating">
            <div className="rating-stars">{stars}</div>
            <div className="rating-info">
              <span className="rating-number">{carrier.rating}/5</span>
              <span className="review-count">({carrier.reviewCount} opinii)</span>
            </div>
          </div>
          ) : (
          <div className="carrier-rating">
            <p className="no-rating-info">Brak opinii — jako pierwszy oceń tę firmę.</p>
          </div>
          )}

          {/* Przycisk kontaktu */}
          {carrier.userId?._id && carrier.userId._id !== user?.id && (
            <button 
              onClick={handleSendMessage} 
              className="btn-contact-carrier"
              disabled={sendingMessage}
            >
              {sendingMessage ? '⏳ Wysyłanie...' : '💬 Wyślij wiadomość'}
            </button>
          )}

          {/* CTA kontaktowe */}
          <div className="contact-cta-section">
            {carrier.phone && (
              <a href={`tel:${carrier.phone}`} className="btn-cta-phone">📞 Zadzwoń</a>
            )}
            {carrier.email && (
              <a href={`mailto:${carrier.email}`} className="btn-cta-email">✉️ Wyślij email</a>
            )}
            {carrier.website && (
              <a href={carrier.website} target="_blank" rel="nofollow noopener noreferrer" className="btn-cta-website">🌐 Zobacz stronę</a>
            )}
            {!carrier.userId && (
              <a href={`mailto:kontakt.mybus@gmail.com?subject=Przejęcie profilu - ${carrier.companyName}`} className="btn-cta-claim">✅ Przejmij profil</a>
            )}
          </div>
          </div>
        </div>

        {/* Główna sekcja informacyjna */}
        <div className="carrier-main-info">
          <section className="carrier-info-section">
            <h2>📋 Informacje</h2>
            <p><strong>Numer rejestracyjny:</strong> {carrier.companyRegistration}</p>
            
            {carrier.description && (
              <div className="short-description">
                <p>{carrier.description}</p>
              </div>
            )}
            
            {carrier.detailedDescription && (
              <div className="detailed-description">
                <h3>📝 Szczegółowy opis</h3>
                <p style={{whiteSpace: 'pre-line'}}>{carrier.detailedDescription}</p>
              </div>
            )}
            
            <h3>🚐 Oferowane usługi</h3>
            <div className="services-badges-list">
              {[
                { value: 'transport', label: '🚐 Busy międzynarodowe' },
                { value: 'autokary', label: '🚌 Wycieczki autokarowe' },
                { value: 'transfery-lotniskowe', label: '✈️ Transfery lotniskowe' },
                { value: 'przejazdy-sluzbowe', label: '💼 Przejazdy służbowe' },
                { value: 'paczki', label: '📦 Paczki' },
                { value: 'zwierzeta', label: '🐾 Transport zwierząt' },
                { value: 'laweta', label: '🚗 Lawety / Autotransport' },
                { value: 'przeprowadzki', label: '📦 Przeprowadzki' },
                { value: 'transport-rzeczy', label: '🚚 Transport towarów' },
                { value: 'dokumenty', label: '📄 Dokumenty' },
                { value: 'inne', label: '➕ Inne' }
              ].filter(service => carrier.services?.includes(service.value)).map((service) => (
                <span key={service.value} className="service-badge-active">
                  {service.label}
                </span>
              ))}
              {(!carrier.services || carrier.services.length === 0) && (
                <p className="no-services-info">Brak informacji o usługach</p>
              )}
            </div>

            <h3>📞 Kontakt</h3>
            {/* Tymczasowo wyłączone - każdy ma dostęp do pełnych danych */}
            {true || user ? (
              <>
                <p><strong>Telefon:</strong> <a href={`tel:${carrier.phone}`}>{carrier.phone}</a></p>
                {carrier.email && <p><strong>Email:</strong> <a href={`mailto:${carrier.email}`}>{carrier.email}</a></p>}
              </>
            ) : (
              <>
                <p><strong>Telefon:</strong> {carrier.phone?.replace(/\d(?=\d{3})/g, '*')}</p>
                {carrier.email && <p><strong>Email:</strong> {carrier.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</p>}
                <div className="login-to-contact">
                  <p>🔒 <Link to="/login">Zaloguj się</Link> lub <Link to="/register">zarejestruj</Link>, aby zobaczyć pełne dane kontaktowe</p>
                </div>
              </>
            )}
            {carrier.website && (
              <p><strong>Strona:</strong> <a href={carrier.website} target="_blank" rel="nofollow noopener noreferrer">{carrier.website}</a></p>
            )}
            {(carrier.location?.city || carrier.location?.postalCode) && (
              <p><strong>Adres:</strong> {carrier.location?.postalCode} {carrier.location?.city}</p>
            )}

            {carrier.servedVoivodeships && carrier.servedVoivodeships.length > 0 && (
              <div className="voivodeships-section">
                <h3>🇵🇱 Obsługiwane województwa</h3>
                <div className="voivodeships-list">
                  {carrier.servedVoivodeships.map(voivodeship => (
                    <span key={voivodeship} className="voivodeship-badge">
                      {voivodeship}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {carrier.isFlexible ? (
              <>
                <h3>📅 Terminy dojazdów</h3>
                <p><strong>Elastyczne terminy</strong> - dojazdy ustalane indywidualnie</p>
              </>
            ) : (
              <>
                {carrier.departureDays && carrier.departureDays.length > 0 && (
                  <>
                    <h3>📅 Dni wyjazdów do Polski</h3>
                    <p>{carrier.departureDays.join(', ')}</p>
                  </>
                )}
                {carrier.returnDays && carrier.returnDays.length > 0 && (
                  <>
                    <h3>📅 Dni powrotów z Polski</h3>
                    <p>{carrier.returnDays.join(', ')}</p>
                  </>
                )}
              </>
            )}

            {carrier.luggageInfo && (carrier.luggageInfo.maxPieces || carrier.luggageInfo.maxWeight || carrier.luggageInfo.additionalInfo) && (
              <>
                <h3>🧳 Informacje o bagażu</h3>
                {carrier.luggageInfo.maxPieces && <p><strong>Maksymalna liczba sztuk:</strong> {carrier.luggageInfo.maxPieces}</p>}
                {carrier.luggageInfo.maxWeight && <p><strong>Maksymalna waga:</strong> {carrier.luggageInfo.maxWeight} kg</p>}
                {carrier.luggageInfo.additionalInfo && <p><strong>Uwagi:</strong> {carrier.luggageInfo.additionalInfo}</p>}
              </>
            )}

            {carrier.amenities && (carrier.amenities.pets || carrier.amenities.toilet || carrier.amenities.wifi || carrier.amenities.premiumClass) && (
              <>
                <h3>✨ Udogodnienia w busie</h3>
                <div className="amenities-list">
                  {carrier.amenities.pets && <span className="amenity-badge">🐕 Zwierzęta dozwolone</span>}
                  {carrier.amenities.toilet && <span className="amenity-badge">🚽 Toaleta</span>}
                  {carrier.amenities.wifi && <span className="amenity-badge">📶 WiFi</span>}
                  {carrier.amenities.premiumClass && <span className="amenity-badge">⭐ Klasa premium</span>}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Trasy */}
        {carrier.routes && carrier.routes.length > 0 && (
          <div className="routes-section">
            <h2>🛣️ Obsługiwane trasy</h2>
            <div className="routes-list">
              {carrier.routes.map((route, idx) => (
                <div key={idx} className="route-item">
                  <span className="route-from-to">{route.from} → {route.to}</span>
                  {route.days && route.days.length > 0 && (
                    <span className="route-days">{route.days.join(', ')}</span>
                  )}
                  {route.time && <span className="route-time">godz. {route.time}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mapa obszaru działania - pełna szerokość */}
        {carrier.operatingRegion && carrier.operatingRegion.length > 2 && (
          <div className="carrier-map-section">
            <h2>📍 Obszar działania</h2>
            <div className="map-container-large">
              <CarrierMapViewer region={carrier.operatingRegion} />
            </div>
          </div>
        )}

        {/* Linki wewnętrzne */}
        {(carrier.location?.city || transportSlug || (carrier.services && carrier.services.length > 0)) && (
          <div className="related-links-section">
            <h3>🔍 Zobacz także</h3>
            <div className="related-links">
              {carrier.location?.city && (
                <Link to={`/city/${encodeURIComponent(carrier.location.city)}`} className="related-link">
                  Przewoźnicy — {carrier.location.city}
                </Link>
              )}
              {transportSlug && (
                <Link to={`/transport/${transportSlug}`} className="related-link">
                  Transport do {countryLabel}
                </Link>
              )}
              {carrier.services?.slice(0, 2).map(service => (
                <Link key={service} to={`/search?service=${service}`} className="related-link">
                  {serviceLabels[service] || service}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sekcja opinii - na dole, pełna szerokość */}
        <section className="reviews-section-bottom">
            <div className="reviews-header">
              <h2>💬 Opinie klientów ({reviews.length})</h2>
              {user && !userReview && (
                <button 
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="btn-add-review"
                >
                  {showReviewForm ? '✕ Anuluj' : '+ Dodaj opinię'}
                </button>
              )}
            </div>

            {!user && (
              <div className="login-prompt">
                <p>Zaloguj się, aby dodać opinię</p>
                <Link to="/login" className="btn-login-prompt">Zaloguj się</Link>
              </div>
            )}

            {userReview && (
              <div className="user-review-notice">
                <p>✓ Dodałeś już opinię o tym przewoźniku</p>
              </div>
            )}

            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="review-form">
                <h3>Dodaj swoją opinię</h3>
                
                {reviewError && <div className="error-message">{reviewError}</div>}

                <div className="form-group">
                  <label>Ocena *</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`star-btn ${star <= rating ? 'active' : ''}`}
                      >
                        ⭐
                      </button>
                    ))}
                    <span className="rating-text">{rating}/5</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Komentarz * (10-500 znaków)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="4"
                    minLength="10"
                    maxLength="500"
                    required
                    placeholder="Opisz swoje doświadczenie z tym przewoźnikiem..."
                  />
                  <div className="char-count">{comment.length}/500</div>
                </div>

                <button type="submit" disabled={submitting} className="btn-submit-review">
                  {submitting ? 'Wysyłanie...' : 'Dodaj opinię'}
                </button>
              </form>
            )}

            <div className="reviews-list">
              {reviews.length === 0 && (
                <div className="no-reviews">
                  <p>Brak opinii. Bądź pierwszy!</p>
                </div>
              )}

              {reviews.map((review) => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div className="review-author">
                      <strong>{review.userId?.firstName || 'Anonimowy'}</strong>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                    <div className="review-rating">
                      {'⭐'.repeat(review.rating)}
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
      </div>
    </div>
    </>
  )
}
