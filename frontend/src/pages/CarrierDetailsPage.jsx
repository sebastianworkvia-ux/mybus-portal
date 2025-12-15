import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { carrierService } from '../services/services'
import './CarrierDetailsPage.css'

export default function CarrierDetailsPage() {
  const { id } = useParams()
  const [carrier, setCarrier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCarrier = async () => {
      try {
        setLoading(true)
        const response = await carrierService.getCarrierById(id)
        setCarrier(response.data)
      } catch (err) {
        setError('Nie udało się załadować danych przewoźnika')
        console.error('Error fetching carrier:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCarrier()
  }, [id])

  if (loading) {
    return (
      <div className="carrier-details-page">
        <div className="loading">Ładowanie...</div>
      </div>
    )
  }

  if (error || !carrier) {
    return (
      <div className="carrier-details-page">
        <div className="error">{error || 'Przewoźnik nie znaleziony'}</div>
        <Link to="/search" className="btn-back">Powrót do wyszukiwania</Link>
      </div>
    )
  }

  const stars = '⭐'.repeat(Math.floor(carrier.rating || 0))

  return (
    <div className="carrier-details-page">
      <div className="details-container">
        <div className="details-header">
          <div>
            <h1>{carrier.companyName}</h1>
            <p className="company-reg">{carrier.companyRegistration}</p>
            <span className="country-badge">{carrier.country}</span>
          </div>
          {carrier.isVerified && (
            <span className="verified-badge">✓ Zweryfikowany</span>
          )}
        </div>

        <div className="rating-section">
          {stars && <span className="stars">{stars}</span>}
          <span className="rating-text">
            {carrier.rating?.toFixed(1)} ({carrier.reviewCount} ocen)
          </span>
        </div>

        <section className="info-section">
          <h2>Opis</h2>
          <p>{carrier.description}</p>
        </section>

        <section className="info-section">
          <h2>Kontakt</h2>
          <div className="contact-grid">
            <div className="contact-item">
              <strong>📞 Telefon:</strong>
              <a href={`tel:${carrier.phone}`}>{carrier.phone}</a>
            </div>
            <div className="contact-item">
              <strong>📧 Email:</strong>
              <a href={`mailto:${carrier.email}`}>{carrier.email}</a>
            </div>
            {carrier.website && (
              <div className="contact-item">
                <strong>🌐 Strona WWW:</strong>
                <a href={carrier.website} target="_blank" rel="noopener noreferrer">
                  {carrier.website}
                </a>
              </div>
            )}
          </div>
        </section>

        <section className="info-section">
          <h2>Oferowane usługi</h2>
          <div className="services-list">
            {carrier.services?.map((service) => (
              <span key={service} className="service-badge">
                {service}
              </span>
            ))}
          </div>
        </section>

        {carrier.routes && carrier.routes.length > 0 && (
          <section className="info-section">
            <h2>Rozkład jazdy i trasy</h2>
            <div className="routes-grid">
              {carrier.routes.map((route, index) => (
                <div key={index} className="route-card">
                  <div className="route-path">
                    <span className="route-from">{route.from}</span>
                    <span className="route-arrow">→</span>
                    <span className="route-to">{route.to}</span>
                  </div>
                  <div className="route-schedule">
                    <div>
                      <strong>📅 Dni:</strong> {route.days?.join(', ')}
                    </div>
                    <div>
                      <strong>🕐 Godzina odjazdu:</strong> {route.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {carrier.luggageInfo && (
          <section className="info-section luggage-section">
            <h2>Informacje o bagażu</h2>
            <div className="luggage-info">
              <div className="luggage-limits">
                <div className="luggage-item">
                  <strong>🧳 Maksymalna liczba sztuk:</strong>
                  <span>{carrier.luggageInfo.maxPieces} szt.</span>
                </div>
                <div className="luggage-item">
                  <strong>⚖️ Maksymalna waga jednej sztuki:</strong>
                  <span>{carrier.luggageInfo.maxWeight} kg</span>
                </div>
              </div>
              {carrier.luggageInfo.additionalInfo && (
                <div className="luggage-additional">
                  <strong>ℹ️ Uwagi dodatkowe:</strong>
                  <p>{carrier.luggageInfo.additionalInfo}</p>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="actions">
          <Link to="/search" className="btn-back">
            ← Powrót do wyszukiwania
          </Link>
          <a href={`tel:${carrier.phone}`} className="btn-contact">
            📞 Zadzwoń teraz
          </a>
          <a href={`mailto:${carrier.email}`} className="btn-contact">
            ✉️ Wyślij email
          </a>
        </div>
      </div>
    </div>
  )
}
