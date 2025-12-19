import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useAuthStore } from '../stores/authStore'
import './AdminStatsPage.css'

export default function AdminStatsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      setStats(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas pobierania statystyk')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-stats-page">
        <div className="container">
          <div className="loading">⏳ Ładowanie statystyk...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-stats-page">
        <div className="container">
          <div className="error-message">❌ {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-stats-page">
      <div className="container">
        <div className="page-header">
          <div>
            <Link to="/admin" className="back-link">← Powrót do panelu admina</Link>
            <h1>📊 Statystyki Systemu</h1>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card users">
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <div className="metric-value">{stats.users.total}</div>
              <div className="metric-label">Użytkowników</div>
              <div className="metric-details">
                🚚 {stats.users.carriers} przewoźników | 👤 {stats.users.customers} klientów
              </div>
            </div>
          </div>

          <div className="metric-card premium">
            <div className="metric-icon">⭐</div>
            <div className="metric-content">
              <div className="metric-value">{stats.users.premium}</div>
              <div className="metric-label">Premium</div>
              <div className="metric-details">
                {((stats.users.premium / stats.users.total) * 100).toFixed(1)}% użytkowników
              </div>
            </div>
          </div>

          <div className="metric-card active">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <div className="metric-value">{stats.users.active}</div>
              <div className="metric-label">Aktywnych kont</div>
              <div className="metric-details">
                📈 {stats.users.activeLastWeek} aktywnych w ostatnim tygodniu
              </div>
            </div>
          </div>

          <div className="metric-card revenue">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <div className="metric-value">€{stats.payments.totalRevenue}</div>
              <div className="metric-label">Przychód</div>
              <div className="metric-details">
                {stats.payments.total} płatności | śr. €{stats.payments.avgRevenuePerUser} na użytkownika
              </div>
            </div>
          </div>

          <div className="metric-card carriers">
            <div className="metric-icon">🚛</div>
            <div className="metric-content">
              <div className="metric-value">{stats.carriers.total}</div>
              <div className="metric-label">Przewoźników</div>
              <div className="metric-details">
                ✔️ {stats.carriers.verified} zweryfikowanych | ⏳ {stats.carriers.unverified} oczekujących
              </div>
            </div>
          </div>

          <div className="metric-card views">
            <div className="metric-icon">👁️</div>
            <div className="metric-content">
              <div className="metric-value">{stats.pageViews.total}</div>
              <div className="metric-label">Wyświetleń</div>
              <div className="metric-details">
                🔢 {stats.pageViews.uniqueSessionsLast30Days} unikalnych sesji (30 dni)
              </div>
            </div>
          </div>
        </div>

        {/* Page Views Chart */}
        <div className="stats-section">
          <h2>📈 Wyświetlenia stron (ostatnie 7 dni)</h2>
          <div className="chart-container">
            {stats.pageViews.viewsPerDay.length > 0 ? (
              <div className="bar-chart">
                {stats.pageViews.viewsPerDay.map(day => (
                  <div key={day.date} className="bar-item">
                    <div className="bar-column">
                      <div 
                        className="bar-fill"
                        style={{ 
                          height: `${(day.views / Math.max(...stats.pageViews.viewsPerDay.map(d => d.views))) * 100}%` 
                        }}
                      >
                        <span className="bar-value">{day.views}</span>
                      </div>
                    </div>
                    <div className="bar-label">
                      {new Date(day.date).toLocaleDateString('pl-PL', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="bar-sublabel">
                      👤 {day.uniqueVisitors} unikalnych
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">Brak danych o wyświetleniach</div>
            )}
          </div>
        </div>

        {/* Popular Pages */}
        <div className="stats-section">
          <h2>🔥 Najpopularniejsze strony (ostatnie 30 dni)</h2>
          <div className="popular-pages">
            {stats.pageViews.popularPages.length > 0 ? (
              <table className="popular-pages-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>URL</th>
                    <th>Wyświetlenia</th>
                    <th>Unikalni odwiedzający</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.pageViews.popularPages.map((page, index) => (
                    <tr key={page.url}>
                      <td className="rank">{index + 1}</td>
                      <td className="url">{page.url}</td>
                      <td className="views">👁️ {page.views}</td>
                      <td className="unique">👤 {page.uniqueVisitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">Brak danych o popularnych stronach</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>⚡ Szybkie akcje</h2>
          <div className="action-grid">
            <Link to="/admin/users" className="action-card">
              <span className="action-icon">👥</span>
              <span className="action-label">Zarządzaj użytkownikami</span>
            </Link>
            <Link to="/admin" className="action-card">
              <span className="action-icon">🚚</span>
              <span className="action-label">Weryfikuj przewoźników</span>
            </Link>
            <button onClick={fetchStats} className="action-card">
              <span className="action-icon">🔄</span>
              <span className="action-label">Odśwież statystyki</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
