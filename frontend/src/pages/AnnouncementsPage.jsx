import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import apiClient from '../services/apiClient'
import './AnnouncementsPage.css'

export default function AnnouncementsPage() {
  const { user } = useAuthStore()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    country: 'PL',
    phone: ''
  })

  const countries = [
    { code: 'all', name: 'Wszystkie kraje' },
    { code: 'DE', name: 'Niemcy' },
    { code: 'NL', name: 'Holandia' },
    { code: 'BE', name: 'Belgia' },
    { code: 'FR', name: 'Francja' },
    { code: 'AT', name: 'Austria' },
    { code: 'PL', name: 'Polska' }
  ]

  useEffect(() => {
    fetchAnnouncements()
  }, [selectedCountry])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const params = selectedCountry !== 'all' ? { country: selectedCountry } : {}
      const response = await apiClient.get('/announcements', { params })
      setAnnouncements(response.data)
      setError('')
    } catch (err) {
      setError('Nie udało się pobrać ogłoszeń')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      setError('Musisz być zalogowany, aby dodać ogłoszenie')
      return
    }

    try {
      await apiClient.post('/announcements', formData)
      setFormData({ title: '', description: '', country: 'PL', phone: '' })
      setShowForm(false)
      fetchAnnouncements()
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Nie udało się dodać ogłoszenia')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to ogłoszenie?')) return

    try {
      await apiClient.delete(`/announcements/${id}`)
      fetchAnnouncements()
    } catch (err) {
      setError('Nie udało się usunąć ogłoszenia')
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="announcements-page">
      <div className="container">
        <div className="announcements-header">
          <div>
            <h1>📢 Tablica Ogłoszeń</h1>
            <p>Szukasz przejazdu? Dodaj ogłoszenie, a przewoźnicy się z Tobą skontaktują!</p>
          </div>
          {user && (
            <button 
              className="btn-add-announcement"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '❌ Anuluj' : '➕ Dodaj ogłoszenie'}
            </button>
          )}
        </div>

        {!user && (
          <div className="login-prompt">
            <p>
              💡 <Link to="/login">Zaloguj się</Link>, aby dodać ogłoszenie
            </p>
          </div>
        )}

        {showForm && (
          <div className="announcement-form-card">
            <h2>Nowe ogłoszenie</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tytuł ogłoszenia *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="np. Szukam przejazdu z Berlina do Warszawy"
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label>Opis *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Opisz szczegóły przejazdu: data, godzina, ilość osób, bagaż..."
                  rows={5}
                  maxLength={1000}
                  required
                />
                <small>{formData.description.length}/1000 znaków</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Kraj *</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  >
                    <option value="DE">Niemcy</option>
                    <option value="NL">Holandia</option>
                    <option value="BE">Belgia</option>
                    <option value="FR">Francja</option>
                    <option value="AT">Austria</option>
                    <option value="PL">Polska</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Telefon kontaktowy (opcjonalnie)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+48 123 456 789"
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit">
                Opublikuj ogłoszenie
              </button>
            </form>
          </div>
        )}

        <div className="announcements-filters">
          <label>Filtruj po kraju:</label>
          <select 
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="country-filter"
          >
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          <span className="count">
            ({announcements.length} {announcements.length === 1 ? 'ogłoszenie' : 'ogłoszeń'})
          </span>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Ładowanie ogłoszeń...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="no-announcements">
            <p>📭 Brak ogłoszeń w tej kategorii</p>
            <p className="text-muted">Bądź pierwszą osobą, która doda ogłoszenie!</p>
          </div>
        ) : (
          <div className="announcements-list">
            {announcements.map((announcement) => (
              <div key={announcement._id} className="announcement-card">
                <div className="announcement-header-card">
                  <div className="announcement-author">
                    <span className="author-name">👤 {announcement.firstName}</span>
                    <span className="announcement-country">
                      {countries.find(c => c.code === announcement.country)?.name}
                    </span>
                  </div>
                  <span className="announcement-date">
                    {formatDate(announcement.createdAt)}
                  </span>
                </div>

                <h3>{announcement.title}</h3>
                <p className="announcement-description">{announcement.description}</p>

                <div className="announcement-contact">
                  <div className="contact-info">
                    <span>📧 {announcement.email}</span>
                    {announcement.phone && (
                      <span>📞 {announcement.phone}</span>
                    )}
                  </div>
                  
                  {user && user.id === announcement.userId && (
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(announcement._id)}
                    >
                      🗑️ Usuń
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
