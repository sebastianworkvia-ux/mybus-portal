import { useState, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix generic marker icon issues in React Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function MapController({ onMapClick, points }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    },
  })
  return null
}

export default function CarrierMapEditor({ region, setRegion }) {
  // Region is array of {lat, lng}
  // Center map on Poland/Europe default
  const center = { lat: 52.0, lng: 19.0 } 
  const zoom = 5

  const handleMapClick = (latlng) => {
    // Add point to region
    const newRegion = [...(region || []), { lat: latlng.lat, lng: latlng.lng }]
    setRegion(newRegion)
  }

  const handleClear = () => {
    setRegion([])
  }

  const handleUndo = () => {
    if (region && region.length > 0) {
      setRegion(region.slice(0, -1))
    }
  }

  const polygonPositions = useMemo(() => {
    return region?.map(p => [p.lat, p.lng]) || []
  }, [region])

  return (
    <div className="map-editor-container" style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '10px', background: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.9rem', color: '#555' }}>
          kliknij na mapę, aby dodać punkty obszaru (wielokąt).
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button" 
            onClick={handleUndo}
            disabled={!region || region.length === 0}
            style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Cofnij punkt
          </button>
          <button 
            type="button" 
            onClick={handleClear}
            disabled={!region || region.length === 0}
            style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', color: 'red' }}
          >
            Wyczyść
          </button>
        </div>
      </div>
      
      <MapContainer center={center} zoom={zoom} style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapController onMapClick={handleMapClick} points={region} />
        
        {polygonPositions.length > 0 && (
          <>
            <Polygon positions={polygonPositions} color="blue" />
            {polygonPositions.map((pos, idx) => (
              <Marker key={idx} position={pos} />
            ))}
          </>
        )}
      </MapContainer>
    </div>
  )
}
