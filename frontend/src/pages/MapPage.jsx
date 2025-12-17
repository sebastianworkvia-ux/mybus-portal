import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useCarrierStore } from '../stores/carrierStore'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapPage.css'

// Fix dla defaultowych ikonekrender.com używa innej ścieżki
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

// Komponent do centrowania mapy na lokalizacji użytkownika
function LocationMarker({ position, onLocationFound }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 10)
    }
  }, [position, map])

  const handleLocateClick = () => {
    map.locate({ setView: true, maxZoom: 10 })
  }

  useEffect(() => {
    map.on('locationfound', (e) => {
      onLocationFound(e.latlng)
    })
    
    return () => {
      map.off('locationfound')
    }
  }, [map, onLocationFound])

  return position ? (
    <Marker position={[position.lat, position.lng]}>
      <Popup>
        <strong>📍 Twoja lokalizacja</strong>
      </Popup>
    </Marker>
  ) : null
}

export default function MapPage() {
  const { carriers, loading, error, getCarriers } = useCarrierStore()
  const [userLocation, setUserLocation] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    getCarriers({ country: selectedCountry })
  }, [selectedCountry])

  // Filtruj tylko firmy z współrzędnymi
  const carriersWithLocation = carriers.filter(
    (c) => c.location?.coordinates?.lat && c.location?.coordinates?.lng
  )

  const handleFindNearby = () => {
    if ('geolocation' in navigator) {
      setLocationError('')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLocationError('Nie udało się pobrać Twojej lokalizacji. Sprawdź uprawnienia przeglądarki.')
        }
      )
    } else {
      setLocationError('Twoja przeglądarka nie obsługuje geolokalizacji')
    }
  }

  // Domyślny środek Europy (okolice Niemiec/Polski)
  const defaultCenter = [51.1657, 10.4515]

  return (
    <div className="map-page">
      <div className="container">
        <div className="map-header">
          <h1>🗺️ Mapa przewoźników</h1>
          <p>Znajdź firmę transportową w Twojej okolicy</p>
        </div>

        <div className="map-controls">
          <div className="filter-group">
            <label>Filtruj po kraju:</label>
            <select 
              value={selectedCountry} 
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="country-select"
            >
              <option value="">🌍 Wszystkie kraje</option>
              <option value="DE">🇩🇪 Niemcy</option>
              <option value="NL">🇳🇱 Holandia</option>
              <option value="BE">🇧🇪 Belgia</option>
              <option value="FR">🇫🇷 Francja</option>
              <option value="AT">🇦🇹 Austria</option>
              <option value="PL">🇵🇱 Polska</option>
            </select>
          </div>

          <button onClick={handleFindNearby} className="btn-locate">
            📍 Znajdź najbliższe
          </button>
        </div>

        {locationError && (
          <div className="location-error">
            ⚠️ {locationError}
          </div>
        )}

        <div className="map-stats">
          <span>Na mapie: <strong>{carriersWithLocation.length}</strong> firm</span>
          {carriers.length > carriersWithLocation.length && (
            <span className="text-muted">
              ({carriers.length - carriersWithLocation.length} bez lokalizacji)
            </span>
          )}
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Ładowanie mapy...</p>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {!loading && (
          <div className="map-container-wrapper">
            <MapContainer
              center={defaultCenter}
              zoom={6}
              style={{ height: '600px', width: '100%', borderRadius: '8px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <LocationMarker 
                position={userLocation} 
                onLocationFound={setUserLocation}
              />

              {carriersWithLocation.map((carrier) => (
                <Marker
                  key={carrier._id}
                  position={[
                    carrier.location.coordinates.lat,
                    carrier.location.coordinates.lng
                  ]}
                >
                  <Popup maxWidth={300}>
                    <div className="map-popup">
                      {carrier.logo && (
                        <img 
                          src={carrier.logo} 
                          alt={carrier.companyName}
                          className="popup-logo"
                        />
                      )}
                      <h3>{carrier.companyName}</h3>
                      {carrier.isPremium && <span className="badge-premium">⭐ Premium</span>}
                      
                      <p className="popup-address">
                        📍 {carrier.location.postalCode ? `${carrier.location.postalCode} ` : ''}{carrier.location.city}
                      </p>
                      
                      {carrier.phone && (
                        <p className="popup-phone">
                          📞 {carrier.phone}
                        </p>
                      )}
                      
                      <div className="popup-services">
                        {carrier.services?.slice(0, 3).map((service, idx) => (
                          <span key={idx} className="service-tag">
                            {service}
                          </span>
                        ))}
                      </div>
                      
                      {carrier.rating > 0 && (
                        <p className="popup-rating">
                          ⭐ {carrier.rating.toFixed(1)} ({carrier.reviewCount} opinii)
                        </p>
                      )}
                      
                      <Link 
                        to={`/carrier/${carrier._id}`}
                        className="btn-popup"
                      >
                        Zobacz szczegóły →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {!loading && carriersWithLocation.length === 0 && (
          <div className="no-results">
            <p>Brak firm z lokalizacją na mapie</p>
            <p className="text-small">
              Firmy mogą dodać swoją lokalizację w ustawieniach profilu
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
