import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { paymentService, authService } from '../services/services'
import './PaymentSuccessPage.css'

function PaymentSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const paymentId = searchParams.get('paymentId')
    
    if (!paymentId) {
      setError('Brak ID płatności')
      setLoading(false)
      return
    }

    // Sprawdź status płatności
    const checkPaymentStatus = async () => {
      try {
        const response = await paymentService.getPaymentStatus(paymentId)
        const paymentData = response.data
        setPayment(paymentData)
        
        // Jeśli płatność została opłacona, AUTOMATYCZNIE aktywuj Premium
        if (paymentData.status === 'paid' && !sessionStorage.getItem('premiumActivated')) {
          try {
            console.log('💰 Płatność opłacona - aktywuję Premium automatycznie...')
            
            // Wywołaj endpoint activate-premium (backup gdy webhook nie działa)
            const token = localStorage.getItem('token')
            const activateResponse = await fetch('https://mybus-backend-aygc.onrender.com/payments/activate-premium', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                planType: paymentData.planType,
                duration: 30 
              })
            })
            
            if (activateResponse.ok) {
              const activateData = await activateResponse.json()
              console.log(`✅ Premium aktywowane! Zaktualizowano ${activateData.carriersUpdated} firm(y)`)
              
              // Pobierz świeże dane użytkownika
              const profileResponse = await authService.getProfile()
              localStorage.setItem('user', JSON.stringify(profileResponse.data))
              sessionStorage.setItem('premiumActivated', 'true')
            }
          } catch (err) {
            console.error('⚠️ Błąd automatycznej aktywacji:', err)
          }
        }
        
        setLoading(false)
      } catch (err) {
        setError(err.response?.data?.error || 'Nie udało się pobrać statusu płatności')
        setLoading(false)
      }
    }

    checkPaymentStatus()

    // Opcjonalnie: sprawdzaj status co 3 sekundy przez 30 sekund
    // (Mollie webhook może przyjść z opóźnieniem)
    const interval = setInterval(checkPaymentStatus, 3000)
    const timeout = setTimeout(() => clearInterval(interval), 30000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="payment-success-page">
        <div className="container">
          <div className="payment-card">
            <div className="loading-spinner"></div>
            <h2>Sprawdzam status płatności...</h2>
            <p>Proszę czekać, może to potrwać kilka sekund.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="payment-success-page">
        <div className="container">
          <div className="payment-card error">
            <div className="icon">❌</div>
            <h1>Wystąpił błąd</h1>
            <p>{error}</p>
            <button onClick={() => navigate('/pricing')} className="btn-primary">
              Powrót do cennika
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (payment?.status === 'paid') {
    return (
      <div className="payment-success-page">
        <div className="container">
          <div className="payment-card success">
            <div className="icon">✅</div>
            <h1>Płatność zakończona sukcesem!</h1>
            <p>Dziękujemy za zakup planu <strong>{payment.planType.toUpperCase()}</strong></p>
            
            <div className="payment-details">
              <div className="detail-row">
                <span>Kwota:</span>
                <strong>{payment.amount} {payment.currency}</strong>
              </div>
              <div className="detail-row">
                <span>Data:</span>
                <strong>{new Date(payment.paidAt).toLocaleString('pl-PL')}</strong>
              </div>
              <div className="detail-row">
                <span>ID płatności:</span>
                <strong>{payment.paymentId}</strong>
              </div>
            </div>

            <div className="next-steps">
              <h3>Co dalej?</h3>
              <ul>
                <li>Twój plan został aktywowany</li>
                <li>Możesz teraz cieszyć się wszystkimi funkcjami</li>
                <li>Otrzymasz potwierdzenie na e-mail</li>
              </ul>
            </div>

            <div className="actions">
              <button onClick={async () => {
                // Odśwież dane użytkownika przed przekierowaniem
                try {
                  const profileResponse = await authService.getProfile()
                  localStorage.setItem('user', JSON.stringify(profileResponse.data))
                  console.log('✅ Dane odświeżone przed przejściem do dashboard')
                } catch (err) {
                  console.error('Błąd odświeżania:', err)
                }
                // Wyczyść flagę
                sessionStorage.removeItem('premiumActivated')
                // Przekieruj do dashboard (full reload)
                window.location.href = '/dashboard'
              }} className="btn-primary">
                Przejdź do panelu
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Status pending, failed, canceled, expired
  return (
    <div className="payment-success-page">
      <div className="container">
        <div className="payment-card pending">
          <div className="icon">⏳</div>
          <h1>
            {payment?.status === 'pending' && 'Płatność w trakcie przetwarzania'}
            {payment?.status === 'failed' && 'Płatność nieudana'}
            {payment?.status === 'canceled' && 'Płatność anulowana'}
            {payment?.status === 'expired' && 'Płatność wygasła'}
          </h1>
          <p>
            {payment?.status === 'pending' && 'Twoja płatność jest przetwarzana. Otrzymasz powiadomienie gdy zostanie zakończona.'}
            {payment?.status === 'failed' && 'Płatność nie powiodła się. Spróbuj ponownie lub skontaktuj się z nami.'}
            {payment?.status === 'canceled' && 'Płatność została anulowana. Możesz spróbować ponownie.'}
            {payment?.status === 'expired' && 'Link do płatności wygasł. Utwórz nową płatność.'}
          </p>

          <div className="actions">
            {payment?.status !== 'pending' && (
              <button onClick={() => navigate('/pricing')} className="btn-primary">
                Spróbuj ponownie
              </button>
            )}
            <button onClick={() => navigate('/')} className="btn-secondary">
              Powrót do strony głównej
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccessPage
