import { MapContainer, TileLayer, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix generic marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function CarrierMapViewer({ region }) {
  if (!region || region.length < 3) return null

  // Ensure lat/lng are numbers
  const positions = region.map(p => {
    const lat = parseFloat(p.lat)
    const lng = parseFloat(p.lng)
    return [lat, lng]
  }).filter(p => !isNaN(p[0]) && !isNaN(p[1]))

  if (positions.length < 3) return null
  
  // Calculate center nicely or just use first point
  const center = positions[0]

  return (
    <div className="carrier-map-viewer" style={{ marginTop: '2rem', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
      <h3 style={{ padding: '1rem', margin: 0, background: '#f7fafc', borderBottom: '1px solid #eee' }}>📍 Obszar działania</h3>
      <MapContainer center={center} zoom={6} style={{ height: '400px', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Polygon positions={positions} color="#4a5568" weight={2} fillOpacity={0.2} />
      </MapContainer>
    </div>
  )
}
