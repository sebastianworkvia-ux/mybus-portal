import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { paymentService } from '../services/services'
import useAuthStore from '../stores/authStore'
import './PricingPage.css'

const PRICING_PLANS = {
  free: {
    name: 'FREE',
    price: 0,
    period: 'na zawsze',
    features: [
      'Profil firmowy z podstawowymi danymi',
      'Wyświetlanie w wynikach wyszukiwania',
      'Możliwość dodania opisu usług',
      'Kontakt przez formularz',
      'Podstawowe statystyki'
    ]
  },
  premium: {
    name: 'PREMIUM',
    price: 29.99,
    period: 'miesięcznie',
    features: [
      'Wszystko z planu FREE',
      'Priorytetowe wyświetlanie w wynikach',
      'Własne logo firmy',
      'Szczegółowe statystyki odwiedzin',
      'Wsparcie e-mail'
    ],
    popular: true
  },
  business: {
    name: 'BUSINESS',
    price: 49.99,
    period: 'miesięcznie',
    features: [
      'Wszystko z planu PREMIUM',
      'Pierwsza pozycja w wynikach',
      'Nieograniczone zdjęcia',
      'Promocja w social media',
      'Dedykowany opiekun klienta',
      'Analiza konkurencji'
    ]
  }
}

function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/pricing')
    }
  }, [user, navigate])

  const handleSelectPlan = async (planType) => {
    if (planType === 'free') {
      // Plan darmowy - przekieruj do rejestracji przewoźnika
      navigate('/add-carrier')
      return
    }

    setLoading(true)
    setError(null)
    setSelectedPlan(planType)

    try {
      // Pobierz ID przewoźnika z użytkownika (jeśli istnieje)
      // W przyszłości można to rozszerzyć o wybór konkretnego przewoźnika
      const response = await paymentService.createPayment({
        planType,
        carrierId: null // Zostanie przypisane po utworzeniu przewoźnika
      })

      // Przekieruj do Mollie checkout
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl
      } else {
        throw new Error('Nie otrzymano URL do płatności')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Wystąpił błąd podczas tworzenia płatności')
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  return (
    <div className="pricing-page">
      <div className="container">
        <div className="pricing-header">
          <h1>Wybierz plan dla siebie</h1>
          <p>Zwiększ widoczność swojej firmy i zdobądź więcej klientów</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="pricing-grid">
          {Object.entries(PRICING_PLANS).map(([key, plan]) => (
            <div 
              key={key}
              className={`pricing-card ${plan.popular ? 'featured' : ''} ${loading && selectedPlan === key ? 'loading' : ''}`}
            >
              {plan.popular && <div className="badge">Popularne</div>}
              
              <div className="pricing-header-card">
                <h3>{plan.name}</h3>
                <div className="price">
                  <span className="amount">
                    {plan.price === 0 ? 'Darmowy' : `${plan.price}€`}
                  </span>
                  {plan.price > 0 && <span className="period">/{plan.period}</span>}
                </div>
              </div>

              <ul className="pricing-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <span className="check-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`btn-pricing ${plan.popular ? 'primary' : ''}`}
                onClick={() => handleSelectPlan(key)}
                disabled={loading}
              >
                {loading && selectedPlan === key ? (
                  'Przetwarzanie...'
                ) : (
                  key === 'free' ? 'Rozpocznij za darmo' : 'Wybierz plan'
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-faq">
          <h2>Najczęściej zadawane pytania</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Czy plan FREE jest naprawdę darmowy?</h3>
              <p>
                Tak! Plan FREE jest bezpłatny na zawsze. Nie potrzebujesz karty 
                kredytowej do rejestracji.
              </p>
            </div>
            <div className="faq-item">
              <h3>Jak długo trwa subskrypcja?</h3>
              <p>
                Plany Premium i Business są odnawiane co 30 dni. Możesz anulować 
                w dowolnym momencie bez żadnych zobowiązań.
              </p>
            </div>
            <div className="faq-item">
              <h3>Czy mogę zmienić plan później?</h3>
              <p>
                Oczywiście! Możesz w każdej chwili przejść na wyższy lub niższy plan. 
                Różnica zostanie proporcjonalnie przeliczona.
              </p>
            </div>
            <div className="faq-item">
              <h3>Jakie metody płatności akceptujecie?</h3>
              <p>
                Akceptujemy wszystkie popularne metody: karty kredytowe/debetowe, 
                PayPal, przelewy bankowe i płatności mobilne poprzez Mollie.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingPage
