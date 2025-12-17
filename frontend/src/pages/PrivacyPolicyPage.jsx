import './LegalPages.css'

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Polityka Prywatności</h1>
        <p className="last-updated">Ostatnia aktualizacja: 14 grudnia 2025</p>

        <section>
          <h2>1. Administrator Danych</h2>
          <p>
            Administratorem danych osobowych jest MyBus. Kontakt: kontakt.mybus@gmail.com
          </p>
        </section>

        <section>
          <h2>2. Jakie dane zbieramy</h2>
          <p>Zbieramy następujące dane osobowe:</p>
          <ul>
            <li><strong>Dane rejestracyjne:</strong> imię, nazwisko, adres e-mail</li>
            <li><strong>Dane przewoźników:</strong> nazwa firmy, numer rejestracyjny, dane kontaktowe</li>
            <li><strong>Dane techniczne:</strong> adres IP, typ przeglądarki, cookies</li>
            <li><strong>Dane dotyczące korzystania z serwisu:</strong> historia wyszukiwań, recenzje</li>
          </ul>
        </section>

        <section>
          <h2>3. Cel przetwarzania danych</h2>
          <p>Przetwarzamy Twoje dane w celu:</p>
          <ul>
            <li>Umożliwienia rejestracji i logowania do serwisu</li>
            <li>Świadczenia usług platformy (wyszukiwanie przewoźników, dodawanie ofert)</li>
            <li>Komunikacji między użytkownikami a przewoźnikami</li>
            <li>Poprawy jakości usług i analizy statystyk</li>
            <li>Zapewnienia bezpieczeństwa i wykrywania nadużyć</li>
          </ul>
        </section>

        <section>
          <h2>4. Podstawa prawna przetwarzania</h2>
          <p>Twoje dane przetwarzamy na podstawie:</p>
          <ul>
            <li><strong>Zgody</strong> (art. 6 ust. 1 lit. a RODO)</li>
            <li><strong>Wykonania umowy</strong> (art. 6 ust. 1 lit. b RODO)</li>
            <li><strong>Prawnie uzasadnionego interesu</strong> (art. 6 ust. 1 lit. f RODO)</li>
          </ul>
        </section>

        <section>
          <h2>5. Udostępnianie danych</h2>
          <p>
            Twoje dane mogą być udostępniane wyłącznie przewoźnikom w ramach platformy 
            (dane kontaktowe) oraz podmiotom przetwarzającym dane w naszym imieniu 
            (hosting, systemy mailingowe).
          </p>
          <p>Nie sprzedajemy Twoich danych osobowych osobom trzecim.</p>
        </section>

        <section>
          <h2>6. Okres przechowywania danych</h2>
          <p>
            Dane przechowujemy przez okres niezbędny do realizacji celów, dla których 
            zostały zebrane, a następnie przez okres wymagany przez przepisy prawa 
            (zazwyczaj do 6 lat).
          </p>
        </section>

        <section>
          <h2>7. Twoje prawa</h2>
          <p>Masz prawo do:</p>
          <ul>
            <li>Dostępu do swoich danych osobowych</li>
            <li>Sprostowania danych</li>
            <li>Usunięcia danych ("prawo do bycia zapomnianym")</li>
            <li>Ograniczenia przetwarzania</li>
            <li>Przenoszenia danych</li>
            <li>Wniesienia sprzeciwu wobec przetwarzania</li>
            <li>Cofnięcia zgody w dowolnym momencie</li>
            <li>Złożenia skargi do organu nadzorczego (UODO)</li>
          </ul>
        </section>

        <section>
          <h2>8. Cookies</h2>
          <p>
            Nasza strona wykorzystuje pliki cookies w celu zapewnienia prawidłowego 
            funkcjonowania, analizy ruchu i personalizacji treści. Więcej informacji 
            w <a href="/cookies">Polityce Cookies</a>.
          </p>
        </section>

        <section>
          <h2>9. Bezpieczeństwo</h2>
          <p>
            Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony 
            Twoich danych osobowych (szyfrowanie, firewall, regularne audyty bezpieczeństwa).
          </p>
        </section>

        <section>
          <h2>10. Kontakt</h2>
          <p>
            W sprawach dotyczących ochrony danych osobowych skontaktuj się z nami:
            <br />
            E-mail: <a href="mailto:rodo@mybus.pl">rodo@mybus.pl</a>
          </p>
        </section>
      </div>
    </div>
  )
}
