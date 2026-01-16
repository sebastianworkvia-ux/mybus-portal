import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useAuthStore } from '../stores/authStore'
import './AdminVerifyPage.css'

export default function AdminVerifyPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [carriers, setCarriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCarriers, setSelectedCarriers] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!user.isAdmin) {
      setError('Brak uprawnień. Ta strona jest dostępna tylko dla administratorów.')
      setLoading(false)
      return
    }

    fetchUnverifiedCarriers()
  }, [user, navigate])

  const fetchUnverifiedCarriers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/admin/unverified-carriers')
      setCarriers(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas pobierania danych')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (carrierId) => {
    try {
      await apiClient.post(`/admin/verify-carrier/${carrierId}`)
      setCarriers(carriers.filter(c => c._id !== carrierId))
      alert('Firma zweryfikowana!')
    } catch (err) {
      alert(err.response?.data?.error || 'Błąd podczas weryfikacji')
    }
  }

  const handleReject = async (carrierId) => {
    if (!confirm('Czy na pewno chcesz odrzucić tę firmę? Zostanie usunięta.')) {
      return
    }

    try {
      await apiClient.post(`/admin/reject-carrier/${carrierId}`)
      setCarriers(carriers.filter(c => c._id !== carrierId))
      setSelectedCarriers(selectedCarriers.filter(id => id !== carrierId))
      alert('Firma odrzucona i usunięta')
    } catch (err) {
      alert(err.response?.data?.error || 'Błąd podczas odrzucania')
    }
  }

  const handleToggleSelect = (carrierId) => {
    setSelectedCarriers(prev => 
      prev.includes(carrierId)
        ? prev.filter(id => id !== carrierId)
        : [...prev, carrierId]
    )
  }

  const handleSelectAll = () => {
    if (selectedCarriers.length === carriers.length) {
      setSelectedCarriers([])
    } else {
      setSelectedCarriers(carriers.map(c => c._id))
    }
  }

  const handleBulkVerify = async () => {
    if (selectedCarriers.length === 0) {
      alert('Nie zaznaczono żadnych firm')
      return
    }

    if (!confirm(`Czy na pewno chcesz zweryfikować ${selectedCarriers.length} firm?`)) {
      return
    }

    try {
      setBulkLoading(true)
      const response = await apiClient.post('/admin/verify-carriers-bulk', {
        carrierIds: selectedCarriers
      })
      
      // Usuń zweryfikowane firmy z listy
      setCarriers(carriers.filter(c => !selectedCarriers.includes(c._id)))
      setSelectedCarriers([])
      
      alert(response.data.message || `Zweryfikowano ${selectedCarriers.length} firm!`)
    } catch (err) {
      alert(err.response?.data?.error || 'Błąd podczas masowej weryfikacji')
    } finally {
      setBulkLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-verify-page">
        <div className="container">
          <p>Ładowanie...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-verify-page">
      <div className="container">
        <h1>Panel Weryfikacji Firm</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        {carriers.length === 0 ? (
          <div className="no-carriers">
            <p>✅ Brak firm do weryfikacji</p>
          </div>
        ) : (
          <>
            <div className="bulk-actions">
              <div className="bulk-actions-left">
                <label className="select-all-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedCarriers.length === carriers.length && carriers.length > 0}
                    onChange={handleSelectAll}
                  />
                  <span>Zaznacz wszystkie ({carriers.length})</span>
                </label>
                {selectedCarriers.length > 0 && (
                  <span className="selected-count">
                    Zaznaczono: {selectedCarriers.length}
                  </span>
                )}
              </div>
              {selectedCarriers.length > 0 && (
                <button 
                  className="btn-bulk-verify"
                  onClick={handleBulkVerify}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? '⏳ Weryfikowanie...' : `✓ Zatwierdź zaznaczone (${selectedCarriers.length})`}
                </button>
              )}
            </div>

            <div className="carriers-list">
              {carriers.map(carrier => (
                <div 
                  key={carrier._id} 
                  className={`carrier-verify-card ${selectedCarriers.includes(carrier._id) ? 'selected' : ''}`}
                >
                  <div className="carrier-checkbox">
                    <input 
                      type="checkbox"
                      checked={selectedCarriers.includes(carrier._id)}
                      onChange={() => handleToggleSelect(carrier._id)}
                    />
                  </div>
                  
                  <div className="carrier-content">
                    <div className="carrier-header">
                      <h3>{carrier.companyName}</h3>
                      {carrier.isPremium && <span className="premium-badge">PREMIUM</span>}
                    </div>
                
                <div className="carrier-info">
                  <p><strong>Rejestracja:</strong> {carrier.companyRegistration}</p>
                  <p><strong>Kraj:</strong> {carrier.country}</p>
                  <p><strong>Email:</strong> {carrier.email}</p>
                  <p><strong>Telefon:</strong> {carrier.phone || 'Brak'}</p>
                  <p><strong>Strona:</strong> {carrier.website || 'Brak'}</p>
                  <p><strong>Usługi:</strong> {carrier.services?.join(', ') || 'Brak'}</p>
                  {carrier.description && (
                    <p><strong>Opis:</strong> {carrier.description}</p>
                  )}
                  {carrier.userId && (
                    <p><strong>Właściciel:</strong> {carrier.userId.email} ({carrier.userId.firstName} {carrier.userId.lastName})</p>
                  )}
                  {carrier.logo && (
                    <div className="logo-preview">
                      <strong>Logo:</strong>
                      <img src={carrier.logo} alt="Logo" />
                    </div>
                  )}
                  <p><strong>Data zgłoszenia:</strong> {new Date(carrier.createdAt).toLocaleString('pl-PL')}</p>
                </div>
                
                <div className="carrier-actions">
                  <button 
                    className="btn-verify"
                    onClick={() => handleVerify(carrier._id)}
                  >
                    ✓ Zatwierdź
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => handleReject(carrier._id)}
                  >
                    ✗ Odrzuć
                  </button>
                </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
