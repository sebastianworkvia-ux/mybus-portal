import { useState } from 'react'
import { Link } from 'react-router-dom'
import './FloatingActionButtons.css'

export default function FloatingActionButtons() {
  const [showChatTooltip, setShowChatTooltip] = useState(true)

  // Ukryj tooltip po 5 sekundach
  setTimeout(() => setShowChatTooltip(false), 5000)

  return (
    <div className="floating-actions">
      {/* Chat Bot Button */}
      <Link to="/search" className="fab-button fab-chat">
        <div className="fab-icon">💬</div>
        {showChatTooltip && (
          <div className="fab-tooltip">
            <span className="tooltip-close" onClick={(e) => {
              e.preventDefault()
              setShowChatTooltip(false)
            }}>×</span>
            <strong>Potrzebujesz pomocy?</strong>
            <p>Zadaj pytanie BusBot! 🤖</p>
          </div>
        )}
      </Link>

      {/* Map Quick Access */}
      <Link to="/map" className="fab-button fab-map">
        <div className="fab-icon">🗺️</div>
        <span className="fab-label">Zobacz mapę</span>
      </Link>
    </div>
  )
}
