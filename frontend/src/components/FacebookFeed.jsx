import { useEffect } from 'react'
import './FacebookFeed.css'

export default function FacebookFeed() {
  useEffect(() => {
    // Wczytaj Facebook SDK
    if (!window.FB) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: '1234567890', // Możesz zostawić lub utworzyć własne App ID na developers.facebook.com
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
          
          {/* Facebook Page Plugin - iframe fallback */}
          <iframe 
            src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D61584903104321&tabs=timeline&width=500&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
            width="500" 
            height="600" 
            style={{ border: 'none', overflow: 'hidden' }}
            scrolling="no" 
            frameBorder="0" 
            allowFullScreen={true}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            title="Facebook Page Feed"
          />

          <div className="facebook-feed-cta">
            <p>💙 Polub naszą stronę i nie przegap żadnych nowości!</p>
            <a 
              href="https://www.facebook.com/profile.php?id=61584903104321" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-visit-facebook"
            >
              👍 Odwiedź nasz Facebook
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
