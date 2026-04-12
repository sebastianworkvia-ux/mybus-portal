import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { carrierService } from '../services/services'
import { checkProfanityInObject, getFieldLabel } from '../utils/profanityFilter'
import CarrierMapEditor from '../components/CarrierMapEditor'
import './AddCarrierPage.css'

const COUNTRIES = [
  { code: 'PL', name: 'Polska' },
  { code: 'DE', name: 'Niemcy' },
  { code: 'NL', name: 'Holandia' },
  { code: 'BE', name: 'Belgia' },
  { code: 'FR', name: 'Francja' },
  { code: 'AT', name: 'Austria' },
  { code: 'GB', name: 'Wielka Brytania' },
  { code: 'SE', name: 'Szwecja' },
  { code: 'NO', name: 'Norwegia' },
  { code: 'DK', name: 'Dania' },
  { code: 'EU', name: 'Cała Europa' }
]

const VOIVODESHIPS = [
  'Dolnośląskie',
  'Kujawsko-pomorskie',
  'Lubelskie',
  'Lubuskie',
  'Łódzkie',
  'Małopolskie',
  'Mazowieckie',
  'Opolskie',
  'Podkarpackie',
  'Podlaskie',
  'Pomorskie',
  'Śląskie',
  'Świętokrzyskie',
  'Warmińsko-mazurskie',
  'Wielkopolskie',
  'Zachodniopomorskie'
]

const SERVICE_CATEGORIES = {
  passenger: [
    { value: 'transport', label: 'Busy międzynarodowe' },
    { value: 'autokary', label: 'Wycieczki i autokary' },
    { value: 'transfery-lotniskowe', label: 'Transfery lotniskowe' },
    { value: 'przejazdy-sluzbowe', label: 'Przejazdy służbowe' }
  ],
  logistics: [
    { value: 'paczki', label: 'Paczki' },
    { value: 'zwierzeta', label: 'Transport zwierząt' },
    { value: 'laweta', label: 'Lawety / Autotransport' },
    { value: 'przeprowadzki', label: 'Przeprowadzki' },
    { value: 'transport-rzeczy', label: 'Transport towarów' },
    { value: 'dokumenty', label: 'Dokumenty' },
    { value: 'inne', label: 'Inne' }
  ]
}

const DAYS = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela']

export default function AddCarrierPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const isPremium = user?.isPremium || false
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyRegistration: '',
    country: '',
    description: '',
    detailedDescription: '',
    phone: '',
    email: user?.email || '',
    website: '',
    services: [],
    operatingCountries: [],
    servedVoivodeships: [],
    departureDays: [],
    returnDays: [],
    isFlexible: false,
    routes: [{ from: '', to: '', days: [], time: '' }],
    operatingRegion: [],
    luggageMaxPieces: 2,
    luggageMaxWeight: 25,
    luggageAdditionalInfo: '',
    locationPostalCode: '',
    locationCity: ''
  })

  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

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

  const handleCountryToggle = (countryCode) => {
    setFormData(prev => {
      const currentCountries = prev.operatingCountries
      if (currentCountries.includes(countryCode)) {
        // Usuń kraj
        return {
          ...prev,
          operatingCountries: currentCountries.filter(c => c !== countryCode)
        }
      } else {
        // Dodaj kraj (max 8)
        if (currentCountries.length >= 8) {
          alert('Możesz wybrać maksymalnie 8 krajów')
          return prev
        }
        return {
          ...prev,
          operatingCountries: [...currentCountries, countryCode]
        }
      }
    })
  }
  const handleVoivodeshipToggle = (voivodeship) => {
    setFormData(prev => ({
      ...prev,
      servedVoivodeships: prev.servedVoivodeships.includes(voivodeship)
        ? prev.servedVoivodeships.filter(v => v !== voivodeship)
        : [...prev.servedVoivodeships, voivodeship]
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRouteChange = (index, field, value) => {
    const newRoutes = [...formData.routes]
    newRoutes[index] = { ...newRoutes[index], [field]: value }
    setFormData(prev => ({ ...prev, routes: newRoutes }))
  }

  const addRoute = () => {
    setFormData(prev => ({
      ...prev,
      routes: [...prev.routes, { from: '', to: '', days: [], time: '' }]
    }))
  }

  const removeRoute = (index) => {
    setFormData(prev => ({
      ...prev,
      routes: prev.routes.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Walidacja wulgaryzmów - sprawdź przed wysłaniem
      const profanityCheck = checkProfanityInObject(formData)
      if (profanityCheck) {
        const fieldLabel = getFieldLabel(profanityCheck.field)
        setError(`⚠️ Pole "${fieldLabel}" zawiera niedozwolone treści. Prosimy o wprowadzenie profesjonalnych informacji.`)
        setLoading(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      // Geocoding - zamień kod pocztowy + miasto na współrzędne
      let locationData = undefined
      if (formData.locationPostalCode && formData.locationCity) {
        try {
          const query = `${formData.locationPostalCode} ${formData.locationCity}, ${formData.country}`
          const geocodeResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
          )
          const geocodeData = await geocodeResponse.json()
          
          if (geocodeData && geocodeData.length > 0) {
            locationData = {
              postalCode: formData.locationPostalCode,
              city: formData.locationCity,
              coordinates: {
                lat: parseFloat(geocodeData[0].lat),
                lng: parseFloat(geocodeData[0].lon)
              }
            }
          }
        } catch (geocodeError) {
          console.warn('Geocoding failed:', geocodeError)
          // Kontynuuj bez lokalizacji jeśli geocoding się nie powiedzie
        }
      }

      const carrierData = {
        ...formData,
        luggageInfo: {
          maxPieces: formData.luggageMaxPieces,
          maxWeight: formData.luggageMaxWeight,
          additionalInfo: formData.luggageAdditionalInfo
        },
        location: locationData
      }

      // TODO: Dodać upload logo przez FormData gdy backend będzie obsługiwał
      await carrierService.createCarrier(carrierData)
      
      alert('Zgłoszenie wysłane! Twoja firma zostanie dodana do listy po weryfikacji przez administratora.')
      navigate('/dashboard')
    } catch (err) {
      // Obsługa błędów walidacji z backendu
      if (err.response?.data?.error === 'LIMIT_REACHED') {
        setError(`⭐ ${err.response.data.message} Przejdź do /pricing, aby ulepszyć plan.`)
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError(err.response?.data?.error || 'Błąd podczas dodawania firmy')
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-carrier-page">
      <div className="form-container">
        <h1>Dodaj swoją firmę do wyszukiwarki</h1>
        <p className="subtitle">Wypełnij poniższe informacje, aby klienci mogli Cię znaleźć</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="carrier-form">
          {/* Podstawowe dane */}
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
                placeholder="np. DE-1234567"
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
                {COUNTRIES.filter(c => c.code !== 'EU').map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Krótki opis (max 2 zdania) *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                maxLength="200"
                placeholder="Krótki opis widoczny w wyszukiwarce (np. 'Profesjonalne przewozy do Niemiec. Szybko i bezpiecznie.')" 
                required
              />
              <small>{formData.description.length}/200 znaków</small>
            </div>

            <div className="form-group">
              <label>Opis szczegółowy (opcjonalnie)</label>
              <textarea
                name="detailedDescription"
                value={formData.detailedDescription}
                onChange={handleChange}
                rows="8"
                placeholder="Szczegółowy opis firmy, usług, doświadczenia... Widoczny tylko na stronie szczegółów firmy."
              />
              <small>Pełny opis będzie widoczny dopiero po kliknięciu w Twoją firmę</small>
            </div>
          </section>

          {/* Kontakt */}
          <section className="form-section">
            <h2>📞 Dane kontaktowe</h2>
            
            <div className="form-group">
              <label>Numer telefonu *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+48 123 456 789"
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
                placeholder="https://..."
              />
            </div>
          </section>

          {/* Lokalizacja */}
          <section className="form-section">
            <h2>📍 Lokalizacja na mapie (opcjonalnie)</h2>
            <p className="section-note">
              Podaj kod pocztowy i miasto aby Twoja firma była widoczna na mapie
            </p>
            
            <div className="form-row">
              <div className="form-group">
                <label>Kod pocztowy</label>
                <input
                  type="text"
                  name="locationPostalCode"
                  value={formData.locationPostalCode || ''}
                  onChange={handleChange}
                  placeholder="np. 10115, 1012 AB"
                />
              </div>

              <div className="form-group">
                <label>Miasto</label>
                <input
                  type="text"
                  name="locationCity"
                  value={formData.locationCity || ''}
                  onChange={handleChange}
                  placeholder="np. Berlin, Amsterdam"
                />
              </div>
            </div>

            <div className="location-help">
              💡 Podaj kod pocztowy i miasto, a Twoja firma automatycznie pojawi się na mapie
            </div>
          </section>

          {/* Logo - tylko Premium */}
          {isPremium ? (
            <section className="form-section">
              <h2>⭐ Logo firmy (Premium)</h2>
              
              <div className="form-group">
                <label>Dodaj logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="file-input"
                />
                {logoPreview && (
                  <div className="logo-preview">
                    <img src={logoPreview} alt="Logo preview" />
                  </div>
                )}
                <p className="help-text">Logo będzie wyświetlane w wynikach wyszukiwania</p>
              </div>
            </section>
          ) : (
            <section className="form-section premium-locked">
              <h2>⭐ Logo firmy (Premium)</h2>
              <div className="premium-notice">
                <div className="premium-icon">🔒</div>
                <h3>Wyróżnij się na tle konkurencji!</h3>
                <p>Konta Premium mogą dodawać własne logo oraz są wyświetlane na wyższych pozycjach w wynikach wyszukiwania.</p>
                <Link 
                  to="/pricing"
                  className="btn-upgrade"
                >
                  ⭐ Wybierz plan abonamentowy
                </Link>
              </div>
            </section>
          )}

          {/* Kraje obsługi */}
          <section className="form-section">
            <h2>🌍 Kraje obsługi * (max 8)</h2>
            <p className="form-hint">Wybierz kraje, w których świadczysz usługi transportowe</p>
            
            <div className="checkbox-group">
              {COUNTRIES.map(country => (
                <label key={country.code} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.operatingCountries.includes(country.code)}
                    onChange={() => handleCountryToggle(country.code)}
                  />
                  <span>{country.name}</span>
                </label>
              ))}
            </div>
            <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                Wybrano: {formData.operatingCountries.length} / 8
            </small>
          </section>

          {/* Województwa (tylko w PL) */}
          <section className="form-section">
            <h2>🇵🇱 Obsługiwane województwa</h2>
            <p className="form-hint">Zaznacz województwa w Polsce, do których jeździsz</p>
            
            <div className="checkbox-group">
              {VOIVODESHIPS.map(voivodeship => (
                <label key={voivodeship} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.servedVoivodeships.includes(voivodeship)}
                    onChange={() => handleVoivodeshipToggle(voivodeship)}
                  />
                  <span>{voivodeship}</span>
                </label>
              ))}
            </div>
            {formData.servedVoivodeships.length === 0 && (
              <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                Jeśli nie zaznaczysz żadnego, założymy że obsługujesz całą Polskę.
              </small>
            )}
          </section>

          {/* Usługi */}
          <section className="form-section">
            <h2>🚐 Oferowane usługi *</h2>
            
            <h3 style={{fontSize: '1rem', marginTop: '1rem', marginBottom: '0.5rem', color: '#666'}}>Przewóz Osób</h3>
            <div className="checkbox-group">
              {SERVICE_CATEGORIES.passenger.map(service => (
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

            <h3 style={{fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#666'}}>Transport i Logistyka</h3>
            <div className="checkbox-group">
              {SERVICE_CATEGORIES.logistics.map(service => (
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

          {/* Obszar działania na mapie */}
          <section className="form-section">
            <h2>🗺️ Obszar działania (Mapa)</h2>
            <p style={{fontSize: '0.9rem', marginBottom: '1rem', color: '#666'}}>
              Zaznacz na mapie obszar, w którym świadczysz usługi (klikaj, aby dodać punkty wielokąta).
            </p>
            <CarrierMapEditor 
              region={formData.operatingRegion} 
              setRegion={(region) => setFormData(prev => ({ ...prev, operatingRegion: region }))} 
            />
          </section> 
          {/* Dni wyjazdów */}
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

          {/* Bagaż */}
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
                placeholder="np. Dodatkowy bagaż 10€/szt., Transport zwierząt w transporterach..."
              />
            </div>
          </section>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Dodawanie...' : '✅ Dodaj firmę do wyszukiwarki'}
          </button>
        </form>
      </div>
    </div>
  )
}
