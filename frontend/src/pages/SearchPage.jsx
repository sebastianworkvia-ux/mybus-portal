import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import SearchBar from '../components/SearchBar'
import CarrierCard from '../components/CarrierCard'
import PromoSidebar from '../components/PromoSidebar'
import { useCarrierStore } from '../stores/carrierStore'
import './SearchPage.css'

const COUNTRY_LABELS = {
  DE: '🇩🇪 Niemcy', NL: '🇳🇱 Holandia', BE: '🇧🇪 Belgia',
  FR: '🇫🇷 Francja', AT: '🇦🇹 Austria', GB: '🇬🇧 UK', PL: '🇵🇱 Polska'
}
const SVC_LABELS = {
  transport: 'Busy', autokary: 'Autokary', 'transfery-lotniskowe': 'Lotnisko',
  'przejazdy-sluzbowe': 'Służbowe', 'transport-rzeczy': 'Rzeczy',
  przeprowadzki: 'Przeprowadzki', paczki: 'Paczki', laweta: 'Laweta', inne: 'Inne'
}

export default function SearchPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { carriers, loading, error, getCarriers, filters, setFilters } = useCarrierStore()
  const [sortBy, setSortBy] = useState('premium')

  // Initialize filters from URL params on mount
  useEffect(() => {
    const serviceFromUrl = searchParams.get('service')
    const countryFromUrl = searchParams.get('country')
    
    // Build initial filters from URL
    const initialFilters = {
      service: serviceFromUrl || '',
      country: countryFromUrl || '',
      search: ''
    }
    
    // Set filters in store
    setFilters(initialFilters)
    
    // Fetch carriers with URL filters
    getCarriers(initialFilters)
  }, [searchParams.get('service'), searchParams.get('country')])

  const seoData = useMemo(() => {
    const parts = []
    if (filters.country) parts.push(COUNTRY_LABELS[filters.country] || filters.country)
    if (filters.service) parts.push(SVC_LABELS[filters.service] || filters.service)
    const title = parts.length > 0
      ? `${parts.join(' - ')} - Przewoźnicy Busowi | My-Bus.eu`
      : t('searchPage.seoTitle', 'Szukaj Przewoźników Busowych | My-Bus.eu')
    const description = parts.length > 0
      ? `Znajdź najlepszych przewoźników busowych: ${parts.join(', ')}. Zweryfikowane firmy transportowe w Europie.`
      : t('searchPage.seoDescription', 'Przeglądaj bazę przewoźników busowych w Europie. Transport osób, paczek, przeprowadzki. Sprawdzone firmy z opiniami.')
    return { title, description }
  }, [filters, t])

  const sortedCarriers = useMemo(() => {
    const list = [...carriers]
    const tier = { business: 3, premium: 2 }
    switch (sortBy) {
      case 'rating':
        return list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      case 'reviews':
        return list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
      case 'newest':
        return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      default:
        return list.sort((a, b) => (tier[b.subscriptionPlan] || 1) - (tier[a.subscriptionPlan] || 1))
    }
  }, [carriers, sortBy])

  const activeFilterChips = useMemo(() => {
    const chips = []
    if (filters.routeFrom) chips.push(COUNTRY_LABELS[filters.routeFrom] || filters.routeFrom)
    if (filters.routeTo) chips.push(`→ ${COUNTRY_LABELS[filters.routeTo] || filters.routeTo}`)
    if (filters.country && !filters.routeFrom) chips.push(COUNTRY_LABELS[filters.country] || filters.country)
    if (filters.service) chips.push(SVC_LABELS[filters.service] || filters.service)
    return chips
  }, [filters])

  return (
    <>
      <Helmet>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://my-bus.eu/search" />
      </Helmet>

      <div className="search-page">
        <PromoSidebar />
        <div className="search-page-header">
          <div className="container">
            <SearchBar />
          </div>
        </div>

        <div className="container">
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

          <div className="results-toolbar">
            <div className="results-info">
              <p className="results-count">
                Znaleziono <strong>{carriers.length}</strong> przewoźników
              </p>
              {activeFilterChips.length > 0 && (
                <div className="active-filters">
                  {activeFilterChips.map(chip => (
                    <span key={chip} className="filter-chip">{chip}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="sort-control">
              <label htmlFor="sort-select" className="sort-label">Sortuj:</label>
              <select
                id="sort-select"
                className="sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="premium">⭐ Premium</option>
                <option value="rating">★ Najlepiej oceniane</option>
                <option value="newest">🕐 Najnowsze</option>
                <option value="reviews">💬 Najwięcej opinii</option>
              </select>
            </div>
          </div>

          <div className="search-results">
            {sortedCarriers.length > 0 ? (
              <div className="carriers-grid">
                {sortedCarriers.map((carrier) => (
                  <CarrierCard key={carrier._id} carrier={carrier} />
                ))}
              </div>
            ) : (
              !loading && (
                <div className="no-results">
                  <span className="no-results-icon">🔍</span>
                  <h3>Brak wyników</h3>
                  <p>{t('searchPage.noResults')}</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}
