import { Link } from 'react-router-dom'
import { useChatStore } from '../stores/chatStore'
import './FloatingActionButtons.css'

export default function FloatingActionButtons() {
  const { openChat } = useChatStore()

  return (
    <div className="floating-actions">
      {/* Chat Bot Button */}
      <button className="fab-button fab-chat" onClick={openChat}>
        <div className="fab-icon">💬</div>
        <span className="fab-label">Napisz do BusBot</span>
      </button>

      {/* Map Quick Access */}
      <Link to="/map" className="fab-button fab-map">
        <div className="fab-icon">🗺️</div>
        <span className="fab-label">Zobacz mapę</span>
      </Link>
    </div>
  )
}
