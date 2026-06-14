import { Link } from 'react-router-dom'
import './CarrierCard.css'

const SERVICE_LABELS = {
  'transport': 'Busy',
  'autokary': 'Autokary',
  'transfery-lotniskowe': 'Lotnisko',
  'przejazdy-sluzbowe': 'Służbowe',
  'transport-rzeczy': 'Rzeczy',
  'przeprowadzki': 'Przeprowadzki',
  'zwierzeta': 'Zwierzęta',
  'dokumenty': 'Dokumenty',
  'paczki': 'Paczki',
  'laweta': 'Laweta',
  'inne': 'Inne'
}

const COUNTRY_LABELS = {
  PL: 'Polska',
  DE: 'Niemcy',
  NL: 'Holandia',
  BE: 'Belgia',
  FR: 'Francja',
  AT: 'Austria',
  GB: 'Wielka Brytania',
  SE: 'Szwecja',
  NO: 'Norwegia',
  DK: 'Dania',
  CH: 'Szwajcaria',
  LU: 'Luksemburg',
  EU: 'Cała Europa'
}

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return (words[0]?.[0] || '?').toUpperCase()
}

export default function CarrierCard({ carrier, compact = false }) {
  const stars = '⭐'.repeat(Math.floor(carrier.rating || 0))

  const isBusinessPremium = carrier.subscriptionPlan === 'business'
  const isPremium = carrier.subscriptionPlan === 'premium'
  const isPaidTier = isBusinessPremium || isPremium
  const isDemo = carrier.isDemo === true
  const tierClass = isBusinessPremium ? 'business-premium-card' : isPremium ? 'premium-card' : 'free-card'
  const cardLink = `/carrier/${carrier.slug || carrier._id}`
  const isPolandExpressShowcase = !compact && (
    carrier.slug === 'poland-express-transport' ||
    carrier.companyName?.toLowerCase().includes('poland express transport')
  )

  // ── COMPACT MODE (homepage featured list) ─────────────────────
  if (compact) {
    return (
      <Link to={cardLink} className={`carrier-card-compact ${tierClass}`}>
        <div className="compact-logo">
          {isPaidTier ? (
            carrier.logo
              ? <img src={carrier.logo} alt={carrier.companyName} />
              : <div className={`compact-avatar compact-avatar--premium${isBusinessPremium ? ' compact-avatar--business' : ''}`}>
                  {getInitials(carrier.companyName)}
                </div>
          ) : (
            <div className="compact-avatar compact-avatar--free">🚐</div>
          )}
        </div>
        <div className="compact-body">
          <div className="compact-top">
            <span className="compact-name">{carrier.companyName}</span>
            <div className="compact-badges">
              {isBusinessPremium && <span className="compact-tier compact-tier-business">💎 BUSINESS</span>}
              {!isBusinessPremium && isPremium && <span className="compact-tier compact-tier-premium">⭐ PREMIUM</span>}
              {isDemo && <span className="compact-tier demo-badge-compact">🧪 PRZYKŁAD</span>}
            </div>
          </div>
          <div className="compact-bottom">
            <div className="compact-services">
              {carrier.services?.slice(0, 3).map(s => (
                <span key={s} className="compact-chip">{SERVICE_LABELS[s] || s}</span>
              ))}
            </div>
            <div className="compact-meta">
              {carrier.rating > 0 && (
                <span className="compact-rating">★ {Number(carrier.rating).toFixed(1)}</span>
              )}
              <span className="compact-cta">Więcej →</span>
            </div>
          </div>
          {isBusinessPremium && carrier.announcement && (
            <div className="compact-announcement">
              <span>📢</span>
              <p>{carrier.announcement}</p>
            </div>
          )}
        </div>
      </Link>
    )
  }

  // ── FULL CARD MODE (search page) ──────────────────────────────
  if (isPolandExpressShowcase) {
    const displayedCountries = [...new Set(carrier.operatingCountries || [])].filter(Boolean)
    const displayedServices = (carrier.services || []).slice(0, 4)

    return (
      <div className={`carrier-card carrier-card-showcase ${tierClass}`}>
        <div className="showcase-topline">
          <span className="showcase-label">Przykład nowej karty</span>
          {carrier.isVerified && <span className="showcase-verified">Zweryfikowana firma</span>}
        </div>

        <div className="showcase-header">
          <div className="showcase-logo">
            {carrier.logo
              ? <img src={carrier.logo} alt={`${carrier.companyName} logo`} />
              : <span>{getInitials(carrier.companyName)}</span>
            }
          </div>
          <div>
            <h3>{carrier.companyName}</h3>
            <p>{carrier.description || 'Firma transportowa dostępna w marketplace My-Bus.eu.'}</p>
          </div>
        </div>

        <div className="showcase-meta-grid">
          <div>
            <span className="showcase-meta-label">Zakres</span>
            <strong>{displayedCountries.length > 0 ? displayedCountries.map(code => COUNTRY_LABELS[code] || code).join(', ') : 'Do ustalenia'}</strong>
          </div>
          <div>
            <span className="showcase-meta-label">Kontakt</span>
            <strong>{carrier.phone ? 'Telefon dostępny' : 'Dane na profilu'}</strong>
          </div>
          <div>
            <span className="showcase-meta-label">Ocena</span>
            <strong>{carrier.rating > 0 ? `${Number(carrier.rating).toFixed(1)}/5` : 'Nowy profil'}</strong>
          </div>
        </div>

        <div className="showcase-services">
          {displayedServices.length > 0
            ? displayedServices.map(service => (
                <span key={service}>{SERVICE_LABELS[service] || service}</span>
              ))
            : <span>Transport busem</span>
          }
        </div>

        <div className="showcase-footer">
          {carrier.phone && <a href={`tel:${carrier.phone}`} className="showcase-phone">Zadzwoń</a>}
          <Link to={cardLink} className="showcase-details">Sprawdź profil →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`carrier-card ${tierClass}`}>
      {/* Logo area — zawsze widoczny, styl zależy od planu */}
      <div className={`carrier-logo-area${isBusinessPremium ? ' logo-area--business' : isPremium ? ' logo-area--premium' : ' logo-area--free'}`}>
        {isPaidTier ? (
          carrier.logo
            ? <img src={carrier.logo} alt={`${carrier.companyName} logo`} />
            : <div className={`logo-placeholder--premium${isBusinessPremium ? ' logo-placeholder--business' : ''}`}>
                <span className="logo-initials">{getInitials(carrier.companyName)}</span>
              </div>
        ) : (
          <div className="logo-placeholder--free">
            <span className="logo-free-icon">🚐</span>
          </div>
        )}
      </div>
      
      <div className="card-header">
        <h3>{carrier.companyName}</h3>
        <div className="header-badges">
          {isBusinessPremium && (
            <div className="business-badge">💎 BUSINESS</div>
          )}
          {!isBusinessPremium && isPremium && (
            <div className="premium-badge">⭐ PREMIUM</div>
          )}
          {isDemo && (
            <div className="demo-badge">🧪 Firma przykładowa</div>
          )}
        </div>
      </div>

      <p className="company-reg">{carrier.companyRegistration}</p>

      {/* Ogłoszenie Premium */}
      {carrier.announcement && carrier.isPremium && (
        <div className="card-announcement">
          <span className="announcement-icon">📢</span>
          <p>{carrier.announcement}</p>
        </div>
      )}

      <p className="description">{carrier.description}</p>

      {/* Wyświetlanie województw na karcie */}
      {carrier.servedVoivodeships && carrier.servedVoivodeships.length > 0 && (
        <div className="operating-voivodeships">
          {/* Wyświetl tylko pierwsze 3, reszta jako "+X" */}
          {carrier.servedVoivodeships.slice(0, 3).map(v => (
            <span key={v} className="voivodeship-tag-small">🇵🇱 {v}</span>
          ))}
          {carrier.servedVoivodeships.length > 3 && (
            <span className="voivodeship-more">+{carrier.servedVoivodeships.length - 3}</span>
          )}
        </div>
      )}

      <div className="operating-countries">
          <strong>🌍 Obsługiwane kraje:</strong>
          <div className="countries-list">
            {carrier.operatingCountries && carrier.operatingCountries.length > 0
              ? carrier.operatingCountries.map(country => (
                  <span key={country} className="country-tag">{country}</span>
                ))
              : <span className="no-data-text">—</span>
            }
          </div>
        </div>

      <div className="services">
        {carrier.services?.map((service) => (
          <span key={service} className="service-tag">
            {SERVICE_LABELS[service] || service}
          </span>
        ))}
      </div>

      {carrier.amenities && (carrier.amenities.pets || carrier.amenities.toilet || carrier.amenities.wifi || carrier.amenities.premiumClass) && (
        <div className="amenities-icons" style={{marginTop: '0.5rem', display: 'flex', gap: '0.5rem', fontSize: '1.2rem'}}>
          {carrier.amenities.pets && <span title="Zwierzęta dozwolone">🐕</span>}
          {carrier.amenities.toilet && <span title="Toaleta">🚽</span>}
          {carrier.amenities.wifi && <span title="WiFi">📶</span>}
          {carrier.amenities.premiumClass && <span title="Klasa premium">⭐</span>}
        </div>
      )}

      <div className="rating">
        {stars && <span>{stars}</span>}
        <span className="review-count">
          ({carrier.reviewCount} ocen)
        </span>
      </div>

      <div className="schedule-info">
        {carrier.isFlexible ? (
          <p>📅 <strong>Elastyczne terminy</strong></p>
        ) : (
          <>
            <p>
              <strong>→ Wyjazdy do Polski:</strong>{' '}
              {carrier.departureDays?.length > 0 ? carrier.departureDays.join(', ') : <span className="no-data-text">brak danych</span>}
            </p>
            <p>
              <strong>← Przyjazdy z Polski:</strong>{' '}
              {carrier.returnDays?.length > 0 ? carrier.returnDays.join(', ') : <span className="no-data-text">brak danych</span>}
            </p>
          </>
        )}
      </div>

      {carrier.phone && (
        <p className="contact">
          <strong>Tel:</strong> {carrier.phone}
        </p>
      )}

      <Link to={`/carrier/${carrier.slug || carrier._id}`} className="btn-details">
        Sprawdź firmę
      </Link>
    </div>
  )
}
