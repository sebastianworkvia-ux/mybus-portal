import './LegalPages.css'

export default function CookiesPage() {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Polityka Cookies</h1>
        <p className="last-updated">Ostatnia aktualizacja: 14 grudnia 2025</p>

        <section>
          <h2>1. Czym są pliki cookies?</h2>
          <p>
            Pliki cookies to małe pliki tekstowe zapisywane na Twoim urządzeniu 
            podczas przeglądania stron internetowych. Umożliwiają one zapamiętanie 
            Twoich preferencji i poprawiają komfort korzystania z serwisu.
          </p>
        </section>

        <section>
          <h2>2. Jakie cookies stosujemy?</h2>
          
          <h3>Niezbędne cookies</h3>
          <p>
            Te pliki są konieczne do prawidłowego działania strony. Umożliwiają 
            logowanie, nawigację i korzystanie z podstawowych funkcji.
          </p>
          <ul>
            <li><strong>token</strong> - token autoryzacyjny JWT (7 dni)</li>
            <li><strong>session</strong> - identyfikator sesji (do zamknięcia przeglądarki)</li>
          </ul>

          <h3>Funkcjonalne cookies</h3>
          <p>
            Pozwalają zapamiętać Twoje wybory (język, preferencje wyszukiwania).
          </p>
          <ul>
            <li><strong>search_filters</strong> - ostatnie filtry wyszukiwania (30 dni)</li>
            <li><strong>user_preferences</strong> - ustawienia użytkownika (90 dni)</li>
          </ul>

          <h3>Analityczne cookies</h3>
          <p>
            Pomagają nam zrozumieć, jak użytkownicy korzystają ze strony, 
            aby móc ją ulepszać.
          </p>
          <ul>
            <li><strong>_ga</strong> - Google Analytics (2 lata)</li>
            <li><strong>_gid</strong> - Google Analytics (24 godziny)</li>
          </ul>

          <h3>Marketingowe cookies</h3>
          <p>
            Używane do wyświetlania spersonalizowanych reklam.
          </p>
          <ul>
            <li><strong>_fbp</strong> - Facebook Pixel (90 dni)</li>
          </ul>
        </section>

        <section>
          <h2>3. Zarządzanie cookies</h2>
          <p>
            Możesz zarządzać cookies poprzez ustawienia swojej przeglądarki. 
            Pamiętaj, że zablokowanie niektórych cookies może wpłynąć na 
            funkcjonalność strony.
          </p>
          
          <h3>Jak wyłączyć cookies w przeglądarkach?</h3>
          <ul>
            <li><strong>Chrome:</strong> Ustawienia → Prywatność i bezpieczeństwo → Pliki cookie</li>
            <li><strong>Firefox:</strong> Opcje → Prywatność i bezpieczeństwo → Ciasteczka</li>
            <li><strong>Safari:</strong> Preferencje → Prywatność → Cookies</li>
            <li><strong>Edge:</strong> Ustawienia → Prywatność → Pliki cookie</li>
          </ul>
        </section>

        <section>
          <h2>4. Twoje prawa</h2>
          <p>
            Masz prawo do zarządzania swoimi preferencjami dotyczącymi cookies. 
            Możesz je zmienić w każdej chwili poprzez panel ustawień cookies 
            dostępny w stopce strony.
          </p>
        </section>

        <section>
          <h2>5. Kontakt</h2>
          <p>
            Pytania dotyczące cookies: 
            <a href="mailto:cookies@mybus.pl"> cookies@mybus.pl</a>
          </p>
        </section>
      </div>
    </div>
  )
}
