import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useAuthStore } from '../stores/authStore'
import './AdminCarriersPage.css'

export default function AdminCarriersPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [carriers, setCarriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Modal do przypisywania użytkownika
  const [assignModal, setAssignModal] = useState({ show: false, carrierId: null, companyName: '' })
  const [assignEmail, setAssignEmail] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!user.isAdmin) {
      navigate('/')
      return
    }
    fetchCarriers()
  }, [user, navigate, currentPage, statusFilter])

  const fetchCarriers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/admin/carriers', {
        params: { page: currentPage, limit: 20, search, status: statusFilter }
      })
      setCarriers(response.data.carriers)
      setTotalPages(response.data.totalPages)
      setTotal(response.data.total)
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas pobierania firm')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchCarriers()
  }

  const handleToggleActive = async (carrierId) => {
    if (!confirm('Zmienić widoczność tej firmy w wyszukiwarce?')) return
    
    try {
      await apiClient.post(`/admin/carriers/${carrierId}/toggle-active`)
      fetchCarriers()
    } catch (err) {
      alert('Błąd: ' + (err.response?.data?.error || 'Spróbuj ponownie'))
    }
  }

  const handleDelete = async (carrierId, companyName) => {
    if (!confirm(`Czy na pewno usunąć firmę "${companyName}"? Tej operacji nie można cofnąć!`)) return
    
    try {
      await apiClient.delete(`/admin/carriers/${carrierId}`)
      alert('Firma usunięta')
      fetchCarriers()
    } catch (err) {
      alert('Błąd: ' + (err.response?.data?.error || 'Spróbuj ponownie'))
    }
  }

  const openAssignModal = (carrierId, companyName) => {
    setAssignModal({ show: true, carrierId, companyName })
    setAssignEmail('')
  }

  const handleAssignUser = async (e) => {
    e.preventDefault()
    if (!assignEmail.trim()) return
    
    try {
      setAssigning(true)
      await apiClient.post(`/admin/carriers/${assignModal.carrierId}/assign-user`, {
        email: assignEmail.trim()
      })
      alert(`Firma przypisana do użytkownika ${assignEmail}`)
      setAssignModal({ show: false, carrierId: null, companyName: '' })
      fetchCarriers()
    } catch (err) {
      alert('Błąd: ' + (err.response?.data?.error || 'Użytkownik nie istnieje'))
    } finally {
      setAssigning(false)
    }
  }

  if (loading && carriers.length === 0) {
    return (
      <div className="admin-carriers-page">
        <div className="container">
          <p>Ładowanie...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-carriers-page">
      <div className="container">
        <div className="page-header">
          <h1>🏢 Zarządzanie firmami transportowymi</h1>
          <Link to="/admin" className="btn-back">← Panel admina</Link>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Filtry */}
        <div className="filters-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Szukaj po nazwie, email, telefonie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn-search">🔍 Szukaj</button>
          </form>

          <div className="filter-buttons">
            <button 
              onClick={() => { setStatusFilter(''); setCurrentPage(1); }}
              className={statusFilter === '' ? 'active' : ''}
            >
              Wszystkie ({total})
            </button>
            <button 
              onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
              className={statusFilter === 'active' ? 'active' : ''}
            >
              Widoczne
            </button>
            <button 
              onClick={() => { setStatusFilter('hidden'); setCurrentPage(1); }}
              className={statusFilter === 'hidden' ? 'active' : ''}
            >
              Ukryte
            </button>
            <button 
              onClick={() => { setStatusFilter('verified'); setCurrentPage(1); }}
              className={statusFilter === 'verified' ? 'active' : ''}
            >
              Zweryfikowane
            </button>
            <button 
              onClick={() => { setStatusFilter('unverified'); setCurrentPage(1); }}
              className={statusFilter === 'unverified' ? 'active' : ''}
            >
              Niezweryfikowane
            </button>
          </div>
        </div>

        {/* Tabela firm */}
        <div className="carriers-table-container">
          <table className="carriers-table">
            <thead>
              <tr>
                <th>Nazwa firmy</th>
                <th>Kraj</th>
                <th>Właściciel (email)</th>
                <th>Status</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {carriers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>
                    Brak firm spełniających kryteria
                  </td>
                </tr>
              ) : (
                carriers.map((carrier) => (
                  <tr key={carrier._id}>
                    <td>
                      <strong>{carrier.companyName}</strong>
                      <br />
                      <small>{carrier.phone}</small>
                    </td>
                    <td>
                      <span className="country-badge">{carrier.country}</span>
                    </td>
                    <td>
                      {carrier.userId ? (
                        <>
                          {carrier.userId.email}
                          <br />
                          <small>{carrier.userId.firstName} {carrier.userId.lastName}</small>
                        </>
                      ) : (
                        <span className="no-owner">Brak właściciela</span>
                      )}
                    </td>
                    <td>
                      <div className="status-badges">
                        {carrier.isActive ? (
                          <span className="badge active">✅ Widoczna</span>
                        ) : (
                          <span className="badge hidden">❌ Ukryta</span>
                        )}
                        {carrier.isVerified && <span className="badge verified">✓ Zweryfikowana</span>}
                        {carrier.isPremium && <span className="badge premium">⭐ Premium</span>}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/carriers/${carrier._id}`}
                          className="btn-action view"
                          title="Otwórz kartę firmy"
                        >
                          📄 Karta firmy
                        </Link>
                        <button 
                          onClick={() => handleToggleActive(carrier._id)}
                          className="btn-action toggle"
                          title={carrier.isActive ? 'Ukryj w wyszukiwarce' : 'Pokaż w wyszukiwarce'}
                        >
                          {carrier.isActive ? '👁️‍🗨️ Ukryj' : '👁️ Widoczna'}
                        </button>
                        <button 
                          onClick={() => openAssignModal(carrier._id, carrier.companyName)}
                          className="btn-action assign"
                          title="Przypisz do użytkownika"
                        >
                          👤 Przypisz
                        </button>
                        <button 
                          onClick={() => handleDelete(carrier._id, carrier.companyName)}
                          className="btn-action delete"
                          title="Usuń firmę"
                        >
                          🗑️ Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacja */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Poprzednia
            </button>
            <span>Strona {currentPage} z {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Następna →
            </button>
          </div>
        )}

        {/* Modal przypisywania użytkownika */}
        {assignModal.show && (
          <div className="modal-overlay" onClick={() => setAssignModal({ show: false, carrierId: null, companyName: '' })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Przypisz firmę do użytkownika</h2>
              <p>Firma: <strong>{assignModal.companyName}</strong></p>
              <form onSubmit={handleAssignUser}>
                <div className="form-group">
                  <label>Email użytkownika:</label>
                  <input
                    type="email"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    placeholder="np. jan.kowalski@gmail.com"
                    required
                    autoFocus
                  />
                  <small>Użytkownik musi mieć już konto w serwisie</small>
                </div>
                <div className="modal-buttons">
                  <button type="submit" disabled={assigning} className="btn-submit">
                    {assigning ? 'Przypisywanie...' : '✓ Przypisz'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAssignModal({ show: false, carrierId: null, companyName: '' })}
                    className="btn-cancel"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
