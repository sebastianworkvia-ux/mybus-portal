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
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
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

  const handleSyncAirtable = async () => {
    if (!confirm('Czy na pewno chcesz zsynchronizować wszystkie dane do Google Sheets? To może potrwać kilka minut.')) {
      return
    }

    try {
      setSyncing(true)
      setSyncMessage('Synchronizacja w toku...')
      
      const response = await apiClient.post('/airtable/sync/all')
      
      setSyncMessage(`✅ Sukces! Przewoźnicy: ${response.data.carriers.success}/${response.data.carriers.success + response.data.carriers.failed}, Użytkownicy: ${response.data.users.success}/${response.data.users.success + response.data.users.failed}`)
      
      setTimeout(() => setSyncMessage(''), 5000)
    } catch (err) {
      setSyncMessage('❌ Błąd synchronizacji: ' + (err.response?.data?.error || err.message))
    } finally {
      setSyncing(false)
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
    }label className="btn-quick-action import" style={{cursor: 'pointer', margin: 0}}>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCarriers}
                disabled={importing}
                style={{display: 'none'}}
              />
              📤 {importing ? 'Importowanie...' : 'Importuj CSV'}
            </label>
            <button 
              onClick={handleSyncAirtable} 
              className="btn-quick-action airtable"
              disabled={syncing}
            >
              🔄 {syncing ? 'Synchronizacja...' : 'Sync Google Sheets'}
            </button>
            <Link to="/admin/verify" className="btn-quick-action">
              ⚡ Weryfikacja firm ({stats?.unverifiedCarriers || 0})
            </Link>
          </div>
          {importMessage && (
            <div className={`sync-message ${importMessage.includes('✅') ? 'success' : 'error'}`}>
              {importMessage}
            </div>
          )}
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
            <Link to="/admin/stats" className="btn-quick-action secondary">
              📊 Statystyki systemu
            </Link>
            <button 
              onClick={handleSyncAirtable} 
              className="btn-quick-action airtable"
              disabled={syncing}
            >
              🔄 {syncing ? 'Synchronizacja...' : 'Sync Google Sheets'}
            </button>
            <Link to="/admin/verify" className="btn-quick-action">
              ⚡ Weryfikacja firm ({stats?.unverifiedCarriers || 0})
            </Link>
          </div>
          {syncMessage && (
            <div className={`sync-message ${syncMessage.includes('✅') ? 'success' : 'error'}`}>
              {syncMessage}
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card users">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats?.totalUsers || 0}</h3>
              <p>Wszystkich użytkowników</p>
              <div className="stat-breakdown">
                <span>🚚 {stats?.totalCarriers || 0} przewoźników</span>
                <span>👤 {stats?.totalCustomers || 0} klientów</span>
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

          <div className="stat-card pending">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{stats?.unverifiedCarriers || 0}</h3>
              <p>Czeka na weryfikację</p>
              <Link to="/admin/verify" className="stat-link">Zobacz →</Link>
            </div>
          </div>
        </div>



        {/* Recent Activity */}
        <div className="recent-activity">
          <div className="activity-section">
            <h2>📝 Ostatnie rejestracje</h2>
            <div className="activity-list">
              {recent?.users?.length > 0 ? (
                recent.users.map(u => (
                  <div key={u._id} className="activity-item">
                    <div className="activity-icon">{u.userType === 'carrier' ? '🚚' : '👤'}</div>
                    <div className="activity-content">
                      <strong>{u.firstName} {u.lastName}</strong>
                      <span className="activity-meta">{u.email} • {u.userType}</span>
                    </div>
                    <div className="activity-date">
                      {new Date(u.createdAt).toLocaleDateString('pl-PL')}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">Brak danych</p>
              )}
            </div>
          </div>

          <div className="activity-section">
            <h2>🚐 Ostatnio dodane firmy</h2>
            <div className="activity-list">
              {recent?.carriers?.length > 0 ? (
                recent.carriers.map(c => (
                  <div key={c._id} className="activity-item">
                    <div className="activity-icon">
                      {c.isVerified ? '✅' : '⏳'}
                    </div>
                    <div className="activity-content">
                      <strong>{c.companyName}</strong>
                      <span className="activity-meta">
                        {c.country} • {c.userId?.email}
                        {c.isPremium && ' • ⭐ Premium'}
                      </span>
                    </div>
                    <div className="activity-date">
                      {new Date(c.createdAt).toLocaleDateString('pl-PL')}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">Brak danych</p>
              )}
            </div>
          </div>

          <div className="activity-section">
            <h2>💬 Ostatnie recenzje</h2>
            <div className="activity-list">
              {recent?.reviews?.length > 0 ? (
                recent.reviews.map(r => (
                  <div key={r._id} className="activity-item">
                    <div className="activity-icon">⭐</div>
                    <div className="activity-content">
                      <strong>{r.userId?.firstName} {r.userId?.lastName}</strong>
                      <span className="activity-meta">
                        {r.carrierId?.companyName} • {'⭐'.repeat(r.rating)} ({r.rating}/5)
                      </span>
                      <p className="review-comment">{r.comment?.substring(0, 80)}...</p>
                    </div>
                    <div className="activity-date">
                      {new Date(r.createdAt).toLocaleDateString('pl-PL')}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">Brak danych</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
