import { Link } from 'react-router-dom'
import './ForCarriersPage.css'

export default function ForCarriersPage() {
  return (
    <div className="for-carriers-page">
      {/* Hero Section */}
      <section className="carriers-hero">
        <div className="container">
          <div className="carriers-hero-content">
            <div className="carriers-hero-text">
              <h1>🚀 Zwiększ Bazę Klientów o 300% - Bezpłatna Rejestracja!</h1>
              <p className="hero-subtitle">
                My-Bus.eu – Większa Widoczność, Więcej Zapytań, Większe Zyski. 
                Dołącz do 190+ przewoźników obsługujących Polskę, Niemcy, Hollandię, Belgię.
              </p>
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">190+</span>
                  <span className="stat-label">Przewoźników</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">15,000+</span>
                  <span className="stat-label">Odwiedzin/mies</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">Widoczność</span>
                </div>
              </div>
              <div className="hero-cta">
                <Link to="/register" className="btn-primary-large">
                  Załóż profil firmy za 0 zł →
                </Link>
                <p className="cta-note">✔️ Bez opłat ukrytych • ✔️ Gotowe w 3 minuty • ✔️ Plan darmowy dostępny zawsze</p>
              </div>
            </div>
            <div className="carriers-hero-image">
              <div className="hero-card">
                <div className="card-icon">📈</div>
                <h3>+300%</h3>
                <p>Wzrost zapytań</p>
              </div>
              <div className="hero-card">
                <div className="card-icon">💰</div>
                <h3>0 €</h3>
                <p>Koszt marketingu</p>
              </div>
              <div className="hero-card">
                <div className="card-icon">⏱️</div>
                <h3>2 min</h3>
                <p>Rejestracja</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <h2 className="section-title">🎯 Dlaczego Przewoźnicy Wybierają My-Bus.eu?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">🌍</div>
              <h3>Zasięg w Całej Europie</h3>
              <p>
                Dotrzyjmy do dziesiątków tysięcy Polaków w całej Europie. 
                Twój profil widoczny 24/7 dla potencjalnych klientów.
              </p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📱</div>
              <h3>Panel Zarządzania Online</h3>
              <p>
                Edytuj ofertę, dodaj ogłoszenia, aktualizuj ceny w czasie rzeczywistym. 
                Wszystko z telefonu lub komputera - prosto i szybko.
              </p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">⭐</div>
              <h3>Buduj reputację</h3>
              <p>
                System recenzji pomaga zbudować zaufanie i przyciągnąć 
                więcej klientów
              </p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <h3>Docieraj do właściwych osób</h3>
              <p>
                Klienci szukają konkretnie przewoźników w swoim regionie - 
                zero marnowanych kontaktów
              </p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">💎</div>
              <h3>Wyróżnij się</h3>
              <p>
                Plan Premium daje Ci pierwszeństwo w wynikach wyszukiwania 
                i więcej widoczności
              </p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📊</div>
              <h3>Analityka i statystyki</h3>
              <p>
                Zobacz ile osób przegląda Twój profil, z jakich krajów 
                i jakie usługi ich interesują
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">Jak to działa?</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Załóż konto</h3>
                <p>Rejestracja zajmuje 2 minuty. Podaj podstawowe dane firmy.</p>
              </div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Uzupełnij profil</h3>
                <p>Dodaj usługi, zdjęcia, ceny i trasy które obsługujesz.</p>
              </div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Przyjmuj klientów!</h3>
                <p>Klienci Cię znajdą i skontaktują się bezpośrednio.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title">Co mówią przewoźnicy?</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "W pierwszym miesiącu dostałem 12 zapytań! Wcześniej musiałem 
                płacić za reklamy na Facebooku. Teraz klienci sami mnie znajdują."
              </p>
              <div className="testimonial-author">
                <strong>Jan Kowalski</strong>
                <span>ABC Transport, Düsseldorf</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Świetna platforma! Łatwa w obsłudze, a efekty przeszły moje 
                oczekiwania. Polecam każdemu przewoźnikowi!"
              </p>
              <div className="testimonial-author">
                <strong>Maria Nowak</strong>
                <span>Express Shuttle, Amsterdam</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Najlepsza inwestycja jaką zrobiłem. Plan Premium zwrócił się 
                po pierwszym kliencie. Mam już stałych klientów dzięki My-Bus.eu."
              </p>
              <div className="testimonial-author">
                <strong>Piotr Wiśniewski</strong>
                <span>Poland-Berlin Transport</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section">
        <div className="container">
          <h2 className="section-title">Wybierz plan dla siebie</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Free</h3>
                <div className="price">
                  <span className="price-amount">0 €</span>
                  <span className="price-period">/miesiąc</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li>✅ Profil firmy</li>
                <li>✅ 3 usługi</li>
                <li>✅ Podstawowe statystyki</li>
                <li>✅ Opinie klientów</li>
                <li>❌ Wyróżnienie w wynikach</li>
                <li>❌ Zdjęcia i galeria</li>
                <li>❌ Szczegółowa analityka</li>
              </ul>
              <Link to="/register" className="btn-pricing">
                Zacznij za darmo
              </Link>
            </div>

            <div className="pricing-card featured">
              <div className="featured-badge">Polecane</div>
              <div className="pricing-header">
                <h3>Premium</h3>
                <div className="price">
                  <span className="price-amount">29.99 €</span>
                  <span className="price-period">/miesiąc</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li>✅ Wszystko z FREE +</li>
                <li>✅ Nieograniczone usługi</li>
                <li>✅ Wyróżnienie w TOP 3</li>
                <li>✅ Galeria 20 zdjęć</li>
                <li>✅ Szczegółowa analityka</li>
                <li>✅ Odznaka "Zweryfikowany"</li>
                <li>✅ Priorytetowe wsparcie</li>
              </ul>
              <Link to="/register" className="btn-pricing primary">
                Wypróbuj 14 dni za darmo
              </Link>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Business</h3>
                <div className="price">
                  <span className="price-amount">49.99 €</span>
                  <span className="price-period">/miesiąc</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li>✅ Wszystko z PREMIUM +</li>
                <li>✅ Wiele lokalizacji</li>
                <li>✅ API dostęp</li>
                <li>✅ Dedykowany manager</li>
                <li>✅ Custom branding</li>
                <li>✅ Integracja z systemem</li>
                <li>✅ Faktura VAT</li>
              </ul>
              <Link to="/register" className="btn-pricing">
                Skontaktuj się
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="container">
          <h2 className="section-title">Często zadawane pytania</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Czy rejestracja jest naprawdę darmowa?</h3>
              <p>
                Tak! Plan FREE jest bezpłatny na zawsze. Nie potrzebujesz karty 
                kredytowej do rejestracji. Możesz później przejść na Premium.
              </p>
            </div>
            <div className="faq-item">
              <h3>Jak długo trwa weryfikacja firmy?</h3>
              <p>
                Zwykle 24-48 godzin. Potrzebujemy sprawdzić numer licencji 
                transportowej i NIP. Po weryfikacji otrzymasz odznakę zaufania.
              </p>
            </div>
            <div className="faq-item">
              <h3>Czy mogę anulować w każdej chwili?</h3>
              <p>
                Oczywiście! Nie ma żadnych zobowiązań. Możesz anulować plan 
                Premium w każdej chwili bez podawania przyczyny.
              </p>
            </div>
            <div className="faq-item">
              <h3>Jak klienci się ze mną kontaktują?</h3>
              <p>
                Twój numer telefonu i email są widoczne w profilu. Klienci 
                kontaktują się bezpośrednio z Tobą - nie pobieramy prowizji!
              </p>
            </div>
            <div className="faq-item">
              <h3>Czy My-Bus.eu bierze prowizję od zleceń?</h3>
              <p>
                Nie! Zarabiamy tylko na planach Premium/Business. Nie pobieramy 
                prowizji od Twoich zleceń. 100% zysku zostaje u Ciebie.
              </p>
            </div>
            <div className="faq-item">
              <h3>Jakie dokumenty potrzebuję?</h3>
              <p>
                Licencję transportową, NIP firmy i podstawowe dane. Wszystko 
                można dodać podczas rejestracji lub później w panelu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Gotowy na więcej klientów?</h2>
            <p>Dołącz do 500+ przewoźników, którzy już rozwijają biznes z MyBus</p>
            <Link to="/register" className="btn-cta-large">
              Załóż darmowe konto teraz →
            </Link>
            <p className="cta-subtext">
              Pytania? Napisz do nas: <a href="mailto:kontakt.mybus@gmail.com">kontakt.mybus@gmail.com</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
