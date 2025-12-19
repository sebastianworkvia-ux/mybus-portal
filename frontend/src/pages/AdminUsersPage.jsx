import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useAuthStore } from '../stores/authStore'
import './AdminUsersPage.css'

export default function AdminUsersPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, carrier, customer
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!user.isAdmin) {
      navigate('/')
      return
    }

    fetchUsers()
  }, [user, navigate, filter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = filter !== 'all' ? { userType: filter } : {}
      const response = await apiClient.get('/admin/users', { params })
      setUsers(response.data.users)
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas pobierania użytkowników')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (userId, email) => {
    if (!window.confirm(`Czy na pewno chcesz wysłać link do resetu hasła dla użytkownika: ${email}?`)) {
      return
    }

    try {
      const response = await apiClient.post(`/admin/users/${userId}/send-reset-link`)
      alert(`✅ Link do resetu hasła został wygenerowany!\n\nLink (tylko w trybie dev):\n${response.data.resetUrl}`)
      // W produkcji: alert('✅ Link do resetu hasła został wysłany na email użytkownika')
    } catch (err) {
      alert(`❌ Błąd: ${err.response?.data?.error || 'Nie udało się wysłać linku do resetu hasła'}`)
    }
  }

  const handleToggleActive = async (userId, currentStatus, email) => {
    const action = currentStatus === false ? 'aktywować' : 'dezaktywować'
    if (!window.confirm(`Czy na pewno chcesz ${action} konto użytkownika: ${email}?`)) {
      return
    }

    try {
      const response = await apiClient.post(`/admin/users/${userId}/toggle-active`)
      alert(`✅ ${response.data.message}`)
      fetchUsers() // Refresh list
    } catch (err) {
      alert(`❌ Błąd: ${err.response?.data?.error || 'Nie udało się zmienić statusu konta'}`)
    }
  }

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      u.email?.toLowerCase().includes(term) ||
      u.firstName?.toLowerCase().includes(term) ||
      u.lastName?.toLowerCase().includes(term)
    )
  })

  const stats = {
    total: users.length,
    carriers: users.filter(u => u.userType === 'carrier').length,
    customers: users.filter(u => u.userType === 'customer').length,
    premium: users.filter(u => u.isPremium).length,
    admins: users.filter(u => u.isAdmin).length
  }

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="container">
          <p>Ładowanie...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-users-page">
      <div className="container">
        <div className="page-header">
          <div>
            <Link to="/admin" className="back-link">← Dashboard</Link>
            <h1>👥 Wszyscy użytkownicy</h1>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Statistics Bar */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Wszystkich</span>
          </div>
          <div className="stat-item carrier">
            <span className="stat-value">{stats.carriers}</span>
            <span className="stat-label">Przewoźnicy</span>
          </div>
          <div className="stat-item customer">
            <span className="stat-value">{stats.customers}</span>
            <span className="stat-label">Klienci</span>
          </div>
          <div className="stat-item premium">
            <span className="stat-value">{stats.premium}</span>
            <span className="stat-label">Premium</span>
          </div>
          <div className="stat-item admin">
            <span className="stat-value">{stats.admins}</span>
            <span className="stat-label">Admini</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Wszyscy ({stats.total})
            </button>
            <button 
              className={filter === 'carrier' ? 'active carrier-btn' : ''}
              onClick={() => setFilter('carrier')}
            >
              🚚 Przewoźnicy ({stats.carriers})
            </button>
            <button 
              className={filter === 'customer' ? 'active customer-btn' : ''}
              onClick={() => setFilter('customer')}
            >
              👤 Klienci ({stats.customers})
            </button>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Szukaj po email, imieniu lub nazwisku..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Typ</th>
                <th>Email</th>
                <th>Imię i nazwisko</th>
                <th>Status</th>
                <th>Data rejestracji</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                  <tr key={u._id} className={u.isActive === false ? 'inactive-row' : ''}>
                    <td>
                      <span className={`user-type-badge ${u.userType}`}>
                        {u.userType === 'carrier' ? '🚚 Przewoźnik' : '👤 Klient'}
                      </span>
                    </td>
                    <td className="email-cell">{u.email}</td>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>
                      <div className="status-badges">
                        {u.isActive === false && <span className="badge inactive">🚫 Dezaktywowane</span>}
                        {u.isPremium && <span className="badge premium">⭐ Premium</span>}
                        {u.isAdmin && <span className="badge admin">🔑 Admin</span>}
                      </div>
                    </td>
                    <td className="date-cell">
                      {new Date(u.createdAt).toLocaleDateString('pl-PL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn reset-password"
                          onClick={() => handleResetPassword(u._id, u.email)}
                          title="Wyślij link do resetu hasła"
                        >
                          🔄 Reset hasła
                        </button>
                        <button 
                          className={`action-btn toggle-active ${u.isActive === false ? 'activate' : 'deactivate'}`}
                          onClick={() => handleToggleActive(u._id, u.isActive, u.email)}
                          title={u.isActive === false ? 'Aktywuj konto' : 'Dezaktywuj konto'}
                        >
                          {u.isActive === false ? '✅ Aktywuj' : '🚫 Dezaktywuj'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    {searchTerm ? 'Brak użytkowników pasujących do wyszukiwania' : 'Brak użytkowników'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="results-info">
          Wyświetlono {filteredUsers.length} z {users.length} użytkowników
        </div>
      </div>
    </div>
  )
}
