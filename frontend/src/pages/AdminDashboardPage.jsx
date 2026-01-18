import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useAuthStore } from '../stores/authStore'
import './AdminDashboardPage.css'

export default function AdminDashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!user.isAdmin) {
      navigate('/')
      return
    }

    fetchStats()
  }, [user, navigate])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/admin/stats')
      setStats(response.data.stats)
      setRecent(response.data.recent)
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas pobierania statystyk')
    } finally {
      setLoading(false)
    }
  }

  const handleImportCarriers = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setImportMessage('❌ Tylko pliki CSV są obsługiwane')
      setTimeout(() => setImportMessage(''), 3000)
      return
    }

    try {
      setImporting(true)
      setImportMessage('📤 Przesyłanie i importowanie...')

      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post('/import/carriers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setImportMessage(`✅ Zaimportowano: ${response.data.imported}, Pominięto: ${response.data.skipped}, Błędy: ${response.data.errors}`)
      
      // Odśwież statystyki
      fetchStats()
      
      setTimeout(() => setImportMessage(''), 8000)
    } catch (err) {
      setImportMessage('❌ Błąd importu: ' + (err.response?.data?.error || err.message))
    } finally {
      setImporting(false)
      e.target.value = '' // Reset input
    }
  }

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="container">
          <p>Ładowanie...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="container">
          <div className="error-message">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>🎛️ Panel Administracyjny</h1>
          <div className="quick-actions">
            <Link to="/admin/users" className="btn-quick-action secondary">
              👥 Wszyscy użytkownicy
            </Link>
            <Link to="/admin/carriers" className="btn-quick-action secondary">
              🏢 Wszystkie firmy
            </Link>
            <Link to="/admin/stats" className="btn-quick-action secondary">
              📊 Statystyki systemu
            </Link>
            <Link to="/admin/verify" className="btn-quick-action">
              ⚡ Weryfikacja firm ({stats?.unverifiedCarriers || 0})
            </Link>
          </div>
          
          {/* Import CSV Section */}
          <div className="import-section" style={{marginTop: '1.5rem'}}>
            <h3>📤 Import przewoźników z CSV</h3>
            <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
              <label htmlFor="csv-upload" className="btn-quick-action secondary" style={{cursor: 'pointer', margin: 0}}>
                {importing ? '⏳ Importowanie...' : '📁 Wybierz plik CSV'}
              </label>
              <input 
                id="csv-upload" 
                type="file" 
                accept=".csv" 
                onChange={handleImportCarriers}
                disabled={importing}
                style={{display: 'none'}}
              />
              {importMessage && (
                <div className={`sync-message ${importMessage.includes('✅') ? 'success' : 'error'}`}>
                  {importMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card users">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats?.customersWithAccount || 0}</h3>
              <p>Klientów (szukających przewozu)</p>
              <div className="stat-breakdown">
                <span>Konta typu: customer</span>
              </div>
            </div>
          </div>

          <div className="stat-card views" style={{borderLeftColor: '#10b981'}}>
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats?.pageViews?.today || 0}</h3>
              <p>Wejść dzisiaj</p>
              <div className="stat-breakdown">
                <span>👤 {stats?.pageViews?.todayUnique || 0} unikalnych</span>
                <span>📈 {stats?.pageViews?.total || 0} wszystkich</span>
              </div>
            </div>
          </div>

          <div className="stat-card carriers" style={{borderLeftColor: '#8b5cf6'}}>
            <div className="stat-icon">🚚</div>
            <div className="stat-content">
              <h3>{stats?.carriersWithAccount || 0}</h3>
              <p>Przewoźników z kontem</p>
              <div className="stat-breakdown">
                <span>🏢 {stats?.totalCarrierCompanies || 0} zgłoszonych firm</span>
                <span>⏳ {stats?.carriersWithoutCompany || 0} bez firmy</span>
              </div>
              <Link to="/admin/users" className="stat-link">Zobacz listę →</Link>
            </div>
          </div>

          <div className="stat-card carriers">
            <div className="stat-icon">🚐</div>
            <div className="stat-content">
              <h3>{stats?.verifiedCarriers || 0}</h3>
              <p>Zweryfikowane firmy</p>
              <div className="stat-breakdown">
                <span>⭐ {stats?.premiumCarriers || 0} Premium</span>
                <span>⏳ {stats?.unverifiedCarriers || 0} czeka</span>
              </div>
              <Link to="/admin/verify" className="stat-link">Weryfikuj →</Link>
            </div>
          </div>

          <div className="stat-card reviews">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>{stats?.totalReviews || 0}</h3>
              <p>Wszystkich recenzji</p>
              <div className="stat-breakdown">
                <span>📊 {stats?.verifiedCarriers > 0 ? (stats.totalReviews / stats.verifiedCarriers).toFixed(1) : 0} śr./firmę</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-grid">
          <div className="activity-section">
            <h2>📋 Ostatnie rejestracje użytkowników</h2>
            <div className="activity-list">
              {recent?.users && recent.users.length > 0 ? (
                recent.users.map(u => (
                  <div key={u._id} className="activity-item">
                    <div className="activity-icon">{u.userType === 'carrier' ? '🚚' : '👤'}</div>
                    <div className="activity-details">
                      <strong>{u.firstName} {u.lastName}</strong>
                      <span>{u.email}</span>
                      <span className="activity-meta">
                        {u.userType === 'carrier' ? 'Przewoźnik' : 'Klient'} • {new Date(u.createdAt).toLocaleDateString('pl-PL')}
                        {u.isPremium && ' • ⭐ Premium'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p>Brak danych</p>
              )}
            </div>
          </div>

          <div className="activity-section">
            <h2>🚐 Ostatnio dodane firmy</h2>
            <div className="activity-list">
              {recent?.carriers && recent.carriers.length > 0 ? (
                recent.carriers.map(c => (
                  <div key={c._id} className="activity-item">
                    <div className="activity-icon">
                      {c.isVerified ? '✅' : '⏳'}
                    </div>
                    <div className="activity-details">
                      <strong>{c.companyName}</strong>
                      <span>{c.userId?.email || 'Brak email'}</span>
                      <span className="activity-meta">
                        {c.isVerified ? 'Zweryfikowana' : 'Oczekuje'} • {new Date(c.createdAt).toLocaleDateString('pl-PL')}
                        {c.isPremium && ' • ⭐ Premium'}
                      </span>
                    </div>
                    <Link to={`/admin/verify`} className="activity-action">
                      {c.isVerified ? '👁️' : '⚡'}
                    </Link>
                  </div>
                ))
              ) : (
                <p>Brak danych</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Reviews Section */}
        <div className="activity-section" style={{marginTop: '2rem'}}>
          <h2>💬 Ostatnie recenzje</h2>
          <div className="activity-list">
            {recent?.reviews && recent.reviews.length > 0 ? (
              recent.reviews.map(r => (
                <div key={r._id} className="activity-item">
                  <div className="activity-icon">⭐</div>
                  <div className="activity-details">
                    <strong>{r.userId?.firstName} {r.userId?.lastName}</strong>
                    <span>{r.carrierId?.companyName} • {'⭐'.repeat(r.rating)} ({r.rating}/5)</span>
                    <span className="activity-meta">{r.comment?.substring(0, 80)}...</span>
                  </div>
                  <span className="activity-date">{new Date(r.createdAt).toLocaleDateString('pl-PL')}</span>
                </div>
              ))
            ) : (
              <p>Brak danych</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
