import { useEffect } from 'react'
import './FacebookFeed.css'

export default function FacebookFeed() {
  useEffect(() => {
    // Wczytaj Facebook SDK
    if (!window.FB) {
      window.fbAsyncInit = function() {
        window.FB.init({
          xfbml: true,
          version: 'v19.0'
        })
      }

      // Załaduj SDK asynchronicznie
      const script = document.createElement('script')
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'
      script.src = 'https://connect.facebook.net/pl_PL/sdk.js#xfbml=1&version=v19.0'
      
      script.onload = () => {
        // Po załadowaniu SDK, parsuj elementy XFBML
        if (window.FB) {
          window.FB.XFBML.parse()
        }
      }
      
      document.body.appendChild(script)

      return () => {
        // Cleanup
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      }
    } else {
      // Jeśli SDK już załadowane, parsuj elementy
      window.FB.XFBML.parse()
    }
  }, [])

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
          <div id="fb-root"></div>
          
          {/* Facebook Page Plugin dla Business Page */}
          <div 
            className="fb-page" 
            data-href="https://www.facebook.com/profile.php?id=61584903104321"
            data-tabs="timeline"
            data-width="500"
            data-height="600"
            data-small-header="false"
            data-adapt-container-width="true"
            data-hide-cover="false"
            data-show-facepile="true"
            data-lazy="false"
          >
            <blockquote 
              cite="https://www.facebook.com/profile.php?id=61584903104321" 
              className="fb-xfbml-parse-ignore"
            >
              <a href="https://www.facebook.com/profile.php?id=61584903104321">
                My-Bus.eu na Facebooku
              </a>
            </blockquote>
          </div>

          <div className="facebook-feed-cta">
            <p>💙 Polub naszą stronę i nie przegap żadnych nowości!</p>
            <a 
              href="https://www.facebook.com/profile.php?id=61584903104321" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-visit-facebook"
            >
              👍 Zobacz więcej na Facebook
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
