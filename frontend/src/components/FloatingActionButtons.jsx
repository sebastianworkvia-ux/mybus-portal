import { Link } from 'react-router-dom'
import './FloatingActionButtons.css'

export default function FloatingActionButtons() {
  return (
    <div className="floating-actions">
      {/* Map Quick Access */}
      <Link to="/map" className="fab-button fab-map">
        <div className="fab-icon">🗺️</div>
        <span className="fab-label">Zobacz mapę</span>
      </Link>
    </div>
  )
}
