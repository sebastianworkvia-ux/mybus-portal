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

export default function CarrierCard({ carrier }) {
  const stars = '⭐'.repeat(Math.floor(carrier.rating || 0))

  const isBusinessPremium = carrier.subscriptionPlan === 'business'
  const isPremium = carrier.subscriptionPlan === 'premium'

  return (
    <div className={`carrier-card ${isBusinessPremium ? 'business-premium-card' : isPremium ? 'premium-card' : 'free-card'}`}>
      {carrier.logo && (
        <div className="carrier-logo">
          <img src={carrier.logo} alt={`${carrier.companyName} logo`} />
        </div>
      )}
      
      <div className="card-header">
        <h3>{carrier.companyName}</h3>
        <div className="header-badges">
          {isBusinessPremium && (
            <div className="business-badge">💎 BUSINESS</div>
          )}
          {!isBusinessPremium && isPremium && (
            <div className="premium-badge">⭐ PREMIUM</div>
          )}
          <span className="country-badge">{carrier.country}</span>
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

      {carrier.operatingCountries && carrier.operatingCountries.length > 0 && (
        <div className="operating-countries">
          <strong>🌍 Obsługiwane kraje:</strong>
          <div className="countries-list">
            {carrier.operatingCountries.map(country => (
              <span key={country} className="country-tag">{country}</span>
            ))}
          </div>
        </div>
      )}

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

      {(carrier.departureDays?.length > 0 || carrier.returnDays?.length > 0 || carrier.isFlexible) && (
        <div className="schedule-info" style={{marginTop: '0.75rem', fontSize: '0.9rem', color: '#4a5568'}}>
          {carrier.isFlexible ? (
            <p><strong>📅</strong> Elastyczne terminy</p>
          ) : (
            <>
              {carrier.departureDays?.length > 0 && (
                <p><strong>→ Do Polski:</strong> {carrier.departureDays.join(', ')}</p>
              )}
              {carrier.returnDays?.length > 0 && (
                <p><strong>← Z Polski:</strong> {carrier.returnDays.join(', ')}</p>
              )}
            </>
          )}
        </div>
      )}

      {carrier.phone && (
        <p className="contact">
          <strong>Tel:</strong> {carrier.phone}
        </p>
      )}

      <Link to={`/carrier/${carrier.slug || carrier._id}`} className="btn-details">
        Więcej szczegółów
      </Link>
    </div>
  )
}
