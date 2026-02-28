import './FacebookFeed.css'

export default function FacebookFeed() {

  return (
    <section className="facebook-feed-section">
      <div className="container">
        <div className="facebook-feed-header">
          <h2 className="section-title">
            <span className="fb-icon">📘</span> Aktualności z Facebook
          </h2>
          <p className="facebook-feed-subtitle">
            Śledź nasze najnowsze posty i bądź na bieżąco z ofertami przewoźników
          </p>
        </div>

        <div className="facebook-feed-wrapper">
          {/* Bezpośredni link do profilu - Facebook nie pozwala embedować profili osobistych */}
          <div className="facebook-profile-card">
            <div className="fb-profile-header">
              <span className="fb-icon-large">📘</span>
              <div>
                <h3>My-Bus.eu</h3>
                <p>Obserwuj nas na Facebooku!</p>
              </div>
            </div>
            
            <div className="fb-profile-description">
              <p>🚌 Sprawdzone firmy transportowe z całej Europy</p>
              <p>💰 Najlepsze oferty i promocje przewoźników</p>
              <p>📰 Aktualności ze świata transportu</p>
              <p>⭐ Opinie i rekomendacje klientów</p>
            </div>

            <a 
              href="https://www.facebook.com/profile.php?id=61584903104321" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-visit-facebook-primary"
            >
              👍 Odwiedź nasz profil Facebook
            </a>

            <p className="fb-follow-note">
              Polub naszą stronę, aby otrzymywać najnowsze oferty i aktualności!
            </p>
          </div>

          <div className="facebook-feed-cta">
            <p>💙 Dołącz do naszej społeczności na Facebooku!</p>
            <a 
              href="https://www.facebook.com/profile.php?id=61584903104321" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-visit-facebook"
            >
              Zobacz nasze posty →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
