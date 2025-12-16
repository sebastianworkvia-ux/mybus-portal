import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { carrierService, reviewService } from '../services/services'
import { useAuthStore } from '../stores/authStore'
import './CarrierDetailsPage.css'

export default function CarrierDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [carrier, setCarrier] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [carrierRes, reviewsRes] = await Promise.all([
          carrierService.getCarrierById(id),
          reviewService.getReviewsByCarrier(id)
        ])
        setCarrier(carrierRes.data)
        setReviews(reviewsRes.data)
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

  return (
    <div className="carrier-detail-page">
      <div className="container">
        <Link to="/search" className="btn-back-link">← Powrót do wyszukiwania</Link>

        <div className="carrier-header">
          {carrier.logo && (
            <div className="carrier-logo-large">
              <img src={carrier.logo} alt={`${carrier.companyName} logo`} />
            </div>
          )}
          
          <div className="carrier-title">
            <h1>{carrier.companyName}</h1>
            {carrier.isPremium && <span className="premium-badge">⭐ PREMIUM</span>}
            <span className="country-badge-large">{carrier.country}</span>
          </div>

          <div className="carrier-rating">
            <div className="rating-stars">{stars}</div>
            <div className="rating-info">
              <span className="rating-number">{carrier.rating || 0}/5</span>
              <span className="review-count">({carrier.reviewCount || 0} opinii)</span>
            </div>
          </div>
        </div>

        <div className="carrier-content">
          <section className="carrier-info-section">
            <h2>📋 Informacje</h2>
            <p><strong>Numer rejestracyjny:</strong> {carrier.companyRegistration}</p>
            <p><strong>Opis:</strong> {carrier.description}</p>
            
            <h3>🚐 Oferowane usługi</h3>
            <div className="services-list">
              {carrier.services?.map((service) => (
                <span key={service} className="service-badge">{service}</span>
              ))}
            </div>

            <h3>📞 Kontakt</h3>
            <p><strong>Telefon:</strong> {carrier.phone}</p>
            {carrier.email && <p><strong>Email:</strong> {carrier.email}</p>}
            {carrier.website && (
              <p><strong>Strona:</strong> <a href={carrier.website} target="_blank" rel="noopener noreferrer">{carrier.website}</a></p>
            )}

            {carrier.departureDays && carrier.departureDays.length > 0 && (
              <>
                <h3>📅 Dni wyjazdów</h3>
                <p>{carrier.departureDays.join(', ')}</p>
              </>
            )}
          </section>

          <section className="reviews-section">
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
    </div>
  )
}
