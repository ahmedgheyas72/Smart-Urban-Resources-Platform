import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const SHARJAH = [25.3463, 55.4209];

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ lat, lng, onChange }) {
  const hasPosition = lat !== '' && lat != null && lng !== '' && lng != null;
  const position = hasPosition ? [parseFloat(lat), parseFloat(lng)] : null;
  const initialCenter = position || SHARJAH;

  return (
    <div>
      <MapContainer
        center={initialCenter}
        zoom={12}
        style={{ height: 220, width: '100%', borderRadius: 8, cursor: 'crosshair' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onMapClick={onChange} />
        {position && <Marker position={position} />}
      </MapContainer>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          className="form-input"
          readOnly
          value={position ? parseFloat(lat).toFixed(6) : ''}
          placeholder="Latitude — click map to set"
          style={{ flex: 1, fontSize: '0.82rem', background: 'var(--bg)', color: 'var(--muted)', cursor: 'default' }}
        />
        <input
          className="form-input"
          readOnly
          value={position ? parseFloat(lng).toFixed(6) : ''}
          placeholder="Longitude — click map to set"
          style={{ flex: 1, fontSize: '0.82rem', background: 'var(--bg)', color: 'var(--muted)', cursor: 'default' }}
        />
      </div>

      {position && (
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
          📍 {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
        </div>
      )}
    </div>
  );
}
