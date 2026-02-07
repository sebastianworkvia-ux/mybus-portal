import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/SearchBar'
import CarrierCard from '../components/CarrierCard'
import PromoSidebar from '../components/PromoSidebar'
import { useCarrierStore } from '../stores/carrierStore'
import './SearchPage.css'

export default function SearchPage() {
  const { t } = useTranslation()
  const { carriers, loading, error, getCarriers, filters } = useCarrierStore()

  useEffect(() => {
    getCarriers(filters)
  }, [])

  return (
    <div className="search-page">
      <PromoSidebar />
      <div className="container">
        <h1>{t('searchPage.title')}</h1>

        <SearchBar />

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>{t('searchPage.loading')}</p>
            <small style={{ opacity: 0.7, marginTop: '8px' }}>
              {t('searchPage.loadingNote')}
            </small>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <div className="search-results">
          <div className="results-count">
            {t('searchPage.resultsCount')} <strong>{carriers.length}</strong> {t('searchPage.carriers')}
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
                <p>{t('searchPage.noResults')}</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
