import { useState } from 'react'
import { useCarrierStore } from '../stores/carrierStore'
import './SearchBar.css'

export default function SearchBar() {
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
  }

  return (
    <form className="search-bar" onSubmit={handleSearch}>
      <div className="search-group">
        <input
          type="text"
          placeholder="Szukaj przewoźnika..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="search-group">
        <select value={routeFrom} onChange={(e) => setRouteFrom(e.target.value)}>
          <option value="">Z kraju / Cała Europa</option>
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
        <select value={routeTo} onChange={(e) => setRouteTo(e.target.value)}>
          <option value="">Do kraju / Cała Europa</option>
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
        <select value={service} onChange={(e) => setService(e.target.value)}>
          <option value="">Typ usługi</option>
          <option value="transport">Transport osób</option>
          <option value="transport-rzeczy">Transport rzeczy</option>
          <option value="przeprowadzki">Przeprowadzki</option>
          <option value="zwierzeta">Transport zwierząt</option>
          <option value="dokumenty">Dokumenty</option>
          <option value="paczki">Paczki</option>
          <option value="inne">Inne</option>
        </select>
      </div>

      <button type="submit" className="btn-search">
        🔍 Szukaj
      </button>
    </form>
  )
}
