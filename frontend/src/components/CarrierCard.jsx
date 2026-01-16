import { Link } from 'react-router-dom'
import './CarrierCard.css'

export default function CarrierCard({ carrier }) {
  const stars = '⭐'.repeat(Math.floor(carrier.rating || 0))

  return (
    <div className={`carrier-card ${carrier.isPremium ? 'premium-card' : ''}`}>
      {carrier.isPremium && (
        <div className="verified-ribbon">
          <span>✓ Zweryfikowany</span>
        </div>
      )}
      
      {carrier.logo && (
        <div className="carrier-logo">
          <img src={carrier.logo} alt={`${carrier.companyName} logo`} />
        </div>
      )}
      
      <div className="card-header">
        <h3>{carrier.companyName}</h3>
        <div className="header-badges">
          {carrier.isPremium && (
            <div className="premium-badge">⭐ PREMIUM</div>
          )}
          <span className="country-badge">{carrier.country}</span>
        </div>
      </div>

      <p className="company-reg">{carrier.companyRegistration}</p>

      <p className="description">{carrier.description}</p>

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
            {service}
          </span>
        ))}
      </div>

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

      <Link to={`/carrier/${carrier._id}`} className="btn-details">
        Więcej szczegółów
      </Link>
    </div>
  )
}
