import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCarrierStore } from '../stores/carrierStore'
import './SearchBar.css'

export default function SearchBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { getCarriers, setFilters } = useCarrierStore()
  const [routeFrom, setRouteFrom] = useState('')
  const [routeTo, setRouteTo] = useState('')
  const [service, setService] = useState('')
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const params = {}
    if (routeFrom) params.routeFrom = routeFrom
    if (routeTo) params.routeTo = routeTo
    if (service) params.service = service
    if (search) params.search = search

    setFilters({ routeFrom, routeTo, service, search })
    getCarriers(params)
    
    // Przekieruj na stronę wyników wyszukiwania (tylko jeśli nie jesteśmy już tam)
    if (location.pathname !== '/search') {
      navigate('/search')
    }
  }

  return (
    <form className="search-bar" onSubmit={handleSearch}>
      <div className="search-group">
        <input
          type="text"
          placeholder={t('search.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="search-group">
        <span className="search-label">Skąd?</span>
        <select value={routeFrom} onChange={(e) => setRouteFrom(e.target.value)}>
          <option value="">{t('search.fromCountry')}</option>
          <option value="PL">Polska</option>
          <option value="DE">Niemcy</option>
          <option value="NL">Holandia</option>
          <option value="BE">Belgia</option>
          <option value="FR">Francja</option>
          <option value="AT">Austria</option>
          <option value="GB">Wielka Brytania</option>
          <option value="SE">Szwecja</option>
          <option value="NO">Norwegia</option>
          <option value="DK">Dania</option>
        </select>
      </div>

      <div className="search-group">
        <span className="search-label">Dokąd?</span>
        <select value={routeTo} onChange={(e) => setRouteTo(e.target.value)}>
          <option value="">{t('search.toCountry')}</option>
          <option value="PL">Polska</option>
          <option value="DE">Niemcy</option>
          <option value="NL">Holandia</option>
          <option value="BE">Belgia</option>
          <option value="FR">Francja</option>
          <option value="AT">Austria</option>
          <option value="GB">Wielka Brytania</option>
          <option value="SE">Szwecja</option>
          <option value="NO">Norwegia</option>
          <option value="DK">Dania</option>
        </select>
      </div>

      <div className="search-group">
        <span className="search-label">Typ transportu</span>
        <select value={service} onChange={(e) => setService(e.target.value)}>
          <option value="">{t('search.allServices')}</option>
          <optgroup label={t('search.passengerTransport')}>
            <option value="transport">{t('services.transport')}</option>
            <option value="autokary">{t('services.coaches')}</option>
            <option value="transfery-lotniskowe">{t('services.transfers')}</option>
            <option value="przejazdy-sluzbowe">{t('services.business')}</option>
          </optgroup>
          <optgroup label={t('search.transportLogistics')}>
            <option value="paczki">{t('services.packages')}</option>
            <option value="zwierzeta">{t('services.pets')}</option>
            <option value="laweta">{t('services.vehicles')}</option>
            <option value="przeprowadzki">{t('services.moving')}</option>
            <option value="transport-rzeczy">Transport towarów</option>
            <option value="dokumenty">Dokumenty</option>
            <option value="inne">Inne</option>
          </optgroup>
        </select>
      </div>

      <button type="submit" className="btn-search">
        {t('search.searchBtn')}
      </button>
    </form>
  )
}
