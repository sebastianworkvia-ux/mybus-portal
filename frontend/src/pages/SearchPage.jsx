import { useEffect } from 'react'
import SearchBar from '../components/SearchBar'
import CarrierCard from '../components/CarrierCard'
import { useCarrierStore } from '../stores/carrierStore'
import './SearchPage.css'

export default function SearchPage() {
  const { carriers, loading, error, getCarriers, filters } = useCarrierStore()

  useEffect(() => {
    getCarriers(filters)
  }, [])

  return (
    <div className="search-page">
      <div className="container">
        <h1>Wyszukiwanie przewoźników</h1>

        <SearchBar />

        {loading && <div className="loading">Ładowanie...</div>}

        {error && <div className="error">{error}</div>}

        <div className="search-results">
          <div className="results-count">
            Znaleziono: <strong>{carriers.length}</strong> przewoźników
          </div>

          {carriers.length > 0 ? (
            <div className="carriers-grid">
              {carriers.map((carrier) => (
                <CarrierCard key={carrier._id} carrier={carrier} />
              ))}
            </div>
          ) : (
            !loading && (
              <div className="no-results">
                <p>Nie znaleziono przewoźników spełniających Twoje kryteria</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
