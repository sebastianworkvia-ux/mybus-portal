import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { paymentService } from '../services/services'
import { useAuthStore } from '../stores/authStore'
import './PricingPage.css'

const PRICING_PLANS = {
  premium: {
    name: 'ProBus',
    price: 29.99,
    period: '30 dni',
    yearlyPrice: 299.99,
    yearlySavings: '17%',
    features: [
      '✅ Własne logo firmy',
      '✅ Wyższe pozycje w wyszukiwaniu',
      '✅ Badge "Premium" przy profilu',
      '✅ Priorytetowy support',
      '✅ Nielimitowane zdjęcia',
      '✅ Statystyki wyświetleń'
    ],
    popular: true,
    color: 'gold'
  },
  business: {
    name: 'BizBus',
    price: 49.99,
    period: '30 dni',
    yearlyPrice: 499.99,
    yearlySavings: '17%',
    features: [
      '✨ Wszystko z ProBus +',
      '✅ NAJWYŻSZA pozycja w wynikach',
      '✅ Wyróżnienie kolorowe na liście',
      '✅ Badge "Business Premium"',
      '✅ Dedykowany opiekun klienta',
      '✅ Promowanie w social media',
      '✅ Dodatkowa reklama w newsletterze'
    ],
    popular: false,
    color: 'purple'
  }
}

function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [billingPeriod, setBillingPeriod] = useState('monthly') // 'monthly' or 'yearly'

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/pricing')
    }
  }, [user, navigate])

  const handleSelectPlan = async (planType) => {
    if (!user) {
      navigate('/login')
      return
    }

    setLoading(true)
    setError(null)
    setSelectedPlan(planType)

    try {
      console.log('🚀 Tworzenie płatności dla planu:', planType)

      const response = await paymentService.createPayment({
        planType,
        billingPeriod
      })

      console.log('✅ Odpowiedź z serwera:', response.data)

      if (!response.data.checkoutUrl) {
        throw new Error('Brak URL do płatności')
      }

      console.log('🔄 Przekierowanie do Mollie:', response.data.checkoutUrl)
      window.location.href = response.data.checkoutUrl

    } catch (err) {
      console.error('❌ Błąd płatności:', err)
      setError(err.response?.data?.error || 'Błąd podczas tworzenia płatności')
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  return (
    <div className="pricing-page">
      <div className="container">
        <div className="pricing-header">
          <h1>Wybierz swój plan abonamentowy</h1>
          <p>Wyróżnij swoją firmę i zdobądź więcej klientów</p>
          
          <div className="billing-toggle">
            <button 
              className={billingPeriod === 'monthly' ? 'active' : ''}
              onClick={() => setBillingPeriod('monthly')}
            >
              Miesięcznie
            </button>
            <button 
              className={billingPeriod === 'yearly' ? 'active' : ''}
              onClick={() => setBillingPeriod('yearly')}
            >
              Rocznie <span className="savings-badge">-17%</span>
            </button>
          </div>
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
                    {billingPeriod === 'monthly' ? `${plan.price}€` : `${plan.yearlyPrice}€`}
                  </span>
                  <span className="period">/{billingPeriod === 'monthly' ? plan.period : 'rok'}</span>
                  {billingPeriod === 'yearly' && (
                    <div className="yearly-savings">Oszczędzasz {plan.yearlySavings}!</div>
                  )}
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
                className={`btn-pricing ${plan.color} ${plan.popular ? 'primary' : ''}`}
                onClick={() => handleSelectPlan(key)}
                disabled={loading && selectedPlan === key}
              >
                {loading && selectedPlan === key ? (
                  <>
                    <span className="spinner-small"></span>
                    Przetwarzanie...
                  </>
                ) : (
                  `Wybierz ${plan.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-info">
          <h3>💳 Bezpieczne płatności</h3>
          <p>Wszystkie płatności są przetwarzane przez Mollie - zaufanego operatora płatności w Europie.</p>
          <p>Akceptujemy: karty kredytowe/debetowe, PayPal, BLIK, przelewy bankowe i więcej.</p>
          
          <h3>📋 Ważne informacje</h3>
          <ul>
            <li>Abonament jest ważny przez 30 dni od momentu aktywacji</li>
            <li>Możesz anulować w dowolnym momencie</li>
            <li>Po wygaśnięciu abonamentu konto wraca do wersji darmowej</li>
            <li>Wszystkie dane pozostają zachowane</li>
          </ul>

          {!user && (
            <div className="login-notice">
              <p>
                💡 Nie masz jeszcze konta? <a href="/register">Zarejestruj się</a> lub <a href="/login">zaloguj</a> aby kontynuować
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PricingPage
