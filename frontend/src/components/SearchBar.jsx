import { useState } from 'react'
import { useCarrierStore } from '../stores/carrierStore'
import './SearchBar.css'

export default function SearchBar() {
  const { getCarriers, setFilters } = useCarrierStore()
  const [country, setCountry] = useState('')
  const [service, setService] = useState('')
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const params = {}
    if (country) params.country = country
    if (service) params.service = service
    if (search) params.search = search

    setFilters({ country, service, search })
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
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">Kraju</option>
          <option value="DE">Niemcy</option>
          <option value="NL">Holandia</option>
          <option value="BE">Belgia</option>
          <option value="FR">Francja</option>
          <option value="AT">Austria</option>
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
