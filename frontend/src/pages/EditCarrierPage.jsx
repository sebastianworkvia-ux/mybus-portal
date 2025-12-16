import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { carrierService } from '../services/services'
import './AddCarrierPage.css'

const COUNTRIES = [
  { code: 'DE', name: 'Niemcy' },
  { code: 'NL', name: 'Holandia' },
  { code: 'BE', name: 'Belgia' },
  { code: 'FR', name: 'Francja' },
  { code: 'AT', name: 'Austria' },
  { code: 'PL', name: 'Polska' }
]

const SERVICES = [
  { value: 'transport', label: 'Transport osób' },
  { value: 'transport-rzeczy', label: 'Transport rzeczy' },
  { value: 'przeprowadzki', label: 'Przeprowadzki' },
  { value: 'zwierzeta', label: 'Transport zwierząt' },
  { value: 'dokumenty', label: 'Dokumenty' },
  { value: 'paczki', label: 'Paczki' },
  { value: 'inne', label: 'Inne' }
]

const DAYS = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela']

export default function EditCarrierPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyRegistration: '',
    country: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    services: [],
    departureDays: [],
    returnDays: [],
    isFlexible: false,
    luggageMaxPieces: 2,
    luggageMaxWeight: 25,
    luggageAdditionalInfo: ''
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchCarrier = async () => {
      try {
        const response = await carrierService.getCarrierById(id)
        const carrier = response.data
        
        setFormData({
          companyName: carrier.companyName || '',
          companyRegistration: carrier.companyRegistration || '',
          country: carrier.country || '',
          description: carrier.description || '',
          phone: carrier.phone || '',
          email: carrier.email || '',
          website: carrier.website || '',
          services: carrier.services || [],
          departureDays: carrier.departureDays || [],
          returnDays: carrier.returnDays || [],
          isFlexible: carrier.isFlexible || false,
          luggageMaxPieces: carrier.luggageInfo?.maxPieces || 2,
          luggageMaxWeight: carrier.luggageInfo?.maxWeight || 25,
          luggageAdditionalInfo: carrier.luggageInfo?.additionalInfo || ''
        })
      } catch (err) {
        setError('Nie udało się załadować danych firmy')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCarrier()
  }, [id, user, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }))
  }

  const handleDayToggle = (day, type) => {
    const field = type === 'departure' ? 'departureDays' : 'returnDays'
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(day)
        ? prev[field].filter(d => d !== day)
        : [...prev[field], day]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const updateData = {
        ...formData,
        luggageInfo: {
          maxPieces: formData.luggageMaxPieces,
          maxWeight: formData.luggageMaxWeight,
          additionalInfo: formData.luggageAdditionalInfo
        }
      }

      await carrierService.updateCarrier(updateData)
      
      alert('Dane zaktualizowane pomyślnie!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd podczas aktualizacji danych')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="add-carrier-page"><div className="form-container">Ładowanie...</div></div>
  }

  return (
    <div className="add-carrier-page">
      <div className="form-container">
        <h1>Edytuj dane firmy</h1>
        <p className="subtitle">Zaktualizuj informacje o swojej firmie</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="carrier-form">
          <section className="form-section">
            <h2>📋 Podstawowe informacje</h2>
            
            <div className="form-group">
              <label>Nazwa firmy *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Numer rejestracyjny firmy *</label>
              <input
                type="text"
                name="companyRegistration"
                value={formData.companyRegistration}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Kraj działalności *</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              >
                <option value="">Wybierz kraj</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Opis firmy</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
              />
            </div>
          </section>

          <section className="form-section">
            <h2>📞 Dane kontaktowe</h2>
            
            <div className="form-group">
              <label>Numer telefonu *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Strona WWW</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className="form-section">
            <h2>🚐 Oferowane usługi *</h2>
            
            <div className="checkbox-group">
              {SERVICES.map(service => (
                <label key={service.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.services.includes(service.value)}
                    onChange={() => handleServiceToggle(service.value)}
                  />
                  <span>{service.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="form-section">
            <h2>📅 Dni wyjazdów do Polski</h2>
            
            <div className="checkbox-group">
              {DAYS.map(day => (
                <label key={day} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.departureDays.includes(day)}
                    onChange={() => handleDayToggle(day, 'departure')}
                    disabled={formData.isFlexible}
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>

            <h3 style={{marginTop: '1.5rem'}}>📅 Dni powrotów z Polski</h3>
            
            <div className="checkbox-group">
              {DAYS.map(day => (
                <label key={day} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.returnDays.includes(day)}
                    onChange={() => handleDayToggle(day, 'return')}
                    disabled={formData.isFlexible}
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>

            <label className="checkbox-label flexible-checkbox">
              <input
                type="checkbox"
                name="isFlexible"
                checked={formData.isFlexible}
                onChange={handleChange}
              />
              <span><strong>Elastyczne terminy</strong> (dojazdy ustalane indywidualnie)</span>
            </label>
          </section>

          <section className="form-section">
            <h2>🧳 Informacje o bagażu</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Maksymalna liczba sztuk bagażu</label>
                <input
                  type="number"
                  name="luggageMaxPieces"
                  value={formData.luggageMaxPieces}
                  onChange={handleChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Maksymalna waga (kg)</label>
                <input
                  type="number"
                  name="luggageMaxWeight"
                  value={formData.luggageMaxWeight}
                  onChange={handleChange}
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Uwagi dodatkowe dotyczące bagażu</label>
              <textarea
                name="luggageAdditionalInfo"
                value={formData.luggageAdditionalInfo}
                onChange={handleChange}
                rows="3"
              />
            </div>
          </section>

          <div style={{display: 'flex', gap: '1rem'}}>
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')} 
              className="btn-cancel"
              style={{flex: 1, background: '#e2e8f0', color: '#2d3748'}}
            >
              ← Anuluj
            </button>
            <button type="submit" disabled={saving} className="btn-submit" style={{flex: 2}}>
              {saving ? 'Zapisywanie...' : '✅ Zapisz zmiany'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
