import './LegalPages.css'

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Regulamin Serwisu</h1>
        <p className="last-updated">Ostatnia aktualizacja: 18 stycznia 2026</p>

        <section>
          <h2>§1 Postanowienia ogólne</h2>
          <p>
            1. Niniejszy Regulamin określa zasady korzystania z platformy My-Bus.eu 
            dostępnej pod adresem my-bus.eu.
          </p>
          <p>
            2. Właścicielem i operatorem serwisu jest My-Bus.eu.
          </p>
          <p>
            3. Korzystanie z serwisu oznacza akceptację niniejszego Regulaminu.
          </p>
        </section>

        <section>
          <h2>§2 Definicje</h2>
          <ul>
            <li><strong>Serwis</strong> – platforma My-Bus.eu</li>
            <li><strong>Użytkownik</strong> – osoba korzystająca z serwisu</li>
            <li><strong>Przewoźnik</strong> – użytkownik prowadzący działalność transportową</li>
            <li><strong>Klient</strong> – użytkownik poszukujący usług przewozowych</li>
          </ul>
        </section>

        <section>
          <h2>§3 Rejestracja i konto</h2>
          <p>
            1. Korzystanie z pełnej funkcjonalności serwisu wymaga rejestracji.
          </p>
          <p>
            2. Rejestracja jest dobrowolna i bezpłatna.
          </p>
          <p>
            3. Użytkownik zobowiązany jest do podania prawdziwych danych.
          </p>
          <p>
            4. Hasło do konta powinno być przechowywane w tajemnicy.
          </p>
          <p>
            5. Użytkownik może w każdej chwili usunąć swoje konto.
          </p>
        </section>

        <section>
          <h2>§4 Zasady dla Przewoźników</h2>
          <p>
            1. Serwis może tworzyć profile podstawowe firm transportowych automatycznie 
            na podstawie publicznie dostępnych danych (rejestry publiczne, ogłoszenia, 
            strony internetowe).
          </p>
          <p>
            2. Właściciel firmy może w każdej chwili zgłosić się w celu przejęcia 
            kontroli nad profilem lub zażądać jego usunięcia.
          </p>
          <p>
            3. Przewoźnik zobowiązany jest do podania prawdziwych informacji o firmie.
          </p>
          <p>
            4. Przewoźnik musi posiadać odpowiednie uprawnienia do prowadzenia 
            działalności transportowej.
          </p>
          <p>
            5. Zakazane jest umieszczanie treści niezgodnych z prawem lub 
            wprowadzających w błąd.
          </p>
          <p>
            6. My-Bus.eu nie ponosi odpowiedzialności za jakość usług świadczonych 
            przez Przewoźników.
          </p>
        </section>

        <section>
          <h2>§5 Zasady dla Klientów</h2>
          <p>
            1. Klient zobowiązany jest do rzetelnego wystawiania recenzji.
          </p>
          <p>
            2. Zakazane jest umieszczanie treści obraźliwych lub niezgodnych z prawem.
          </p>
          <p>
            3. Kontakt z Przewoźnikiem odbywa się przez skrzynkę odbiorczą w serwisie 
            bądź bezpośrednio poza serwisem przez dane kontaktowe.
          </p>
        </section>

        <section>
          <h2>§6 Odpowiedzialność</h2>
          <p>
            1. My-Bus.eu działa jako platforma pośrednicząca i nie ponosi odpowiedzialności za:
          </p>
          <ul>
            <li>Jakość usług świadczonych przez Przewoźników</li>
            <li>Prawdziwość informacji podanych przez Użytkowników</li>
            <li>Szkody wynikające z korzystania z serwisu</li>
          </ul>
          <p>
            2. My-Bus.eu zastrzega sobie prawo do usunięcia konta użytkownika 
            naruszającego regulamin.
          </p>
        </section>

        <section>
          <h2>§7 Dane osobowe</h2>
          <p>
            Szczegóły dotyczące przetwarzania danych osobowych znajdują się w 
            <a href="/privacy"> Polityce Prywatności</a>.
          </p>
        </section>

        <section>
          <h2>§8 Zmiany Regulaminu</h2>
          <p>
            1. My-Bus.eu zastrzega sobie prawo do zmiany Regulaminu.
          </p>
          <p>
            2. Użytkownicy zostaną poinformowani o zmianach z 7-dniowym wyprzedzeniem.
          </p>
          <p>
            3. Kontynuacja korzystania z serwisu oznacza akceptację nowego Regulaminu.
          </p>
        </section>

        <section>
          <h2>§9 Postanowienia końcowe</h2>
          <p>
            1. W sprawach nieuregulowanych Regulaminem stosuje się przepisy prawa polskiego.
          </p>
          <p>
            2. Spory będą rozstrzygane przez sąd właściwy dla siedziby My-Bus.eu.
          </p>
          <p>
            3. Kontakt: <a href="mailto:kontakt.mybus@gmail.com">kontakt.mybus@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
