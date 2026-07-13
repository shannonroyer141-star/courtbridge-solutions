import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { supabase } from '../supabase';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const S = {
  page: {
    padding: '32px 36px',
    background: '#FFFFFF',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #E8EDF4',
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1B3A6B',
    margin: '0 0 4px',
    letterSpacing: '-0.3px',
  },
  headerSub: {
    fontSize: '13px',
    color: '#8A9BB0',
    margin: 0,
    fontWeight: '400',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
  },
  mapCard: {
    background: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E8EDF4',
    boxShadow: '0 1px 4px rgba(27,58,107,0.06)',
    overflow: 'hidden',
    height: '560px',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E8EDF4',
    boxShadow: '0 1px 4px rgba(27,58,107,0.06)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #F0F4FA',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1B3A6B',
    margin: 0,
  },
  listRow: {
    padding: '11px 20px',
    borderBottom: '1px solid #F5F7FA',
  },
  listName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1E2D3D',
    marginBottom: '2px',
  },
  listSub: {
    fontSize: '12px',
    color: '#B0BCC8',
  },
  emptyState: {
    padding: '32px 20px',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '14px',
    color: '#8A9BB0',
    margin: 0,
  },
  loadingWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
  },
  loadingText: {
    fontSize: '14px',
    color: '#8A9BB0',
  },
};

const DEFAULT_CENTER = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

function FitToMarkers({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 14);
    } else {
      map.fitBounds(points.map(p => [p.latitude, p.longitude]), { padding: [40, 40] });
    }
  }, [points, map]);
  return null;
}

function formatTime(value) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function MapView() {
  const [loading, setLoading] = useState(true);
  const [latestByClient, setLatestByClient] = useState([]);

  useEffect(() => { fetchLocations(); }, []);

  async function fetchLocations() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: clients } = await supabase.from('clients').select('id, name').eq('provider_id', user.id);
    const clientIds = clients?.map(c => c.id) || [];

    if (clientIds.length === 0) {
      setLatestByClient([]);
      setLoading(false);
      return;
    }

    const { data: checkins } = await supabase
      .from('checkins')
      .select('*, clients(name)')
      .in('client_id', clientIds)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('checked_in_at', { ascending: false })
      .limit(200);

    const seen = new Set();
    const latest = [];
    for (const ci of checkins || []) {
      if (seen.has(ci.client_id)) continue;
      seen.add(ci.client_id);
      latest.push(ci);
    }

    setLatestByClient(latest);
    setLoading(false);
  }

  if (loading) return (
    <div style={S.loadingWrap}>
      <p style={S.loadingText}>Loading map...</p>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.headerTitle}>Map View</h1>
        <p style={S.headerSub}>Last known check-in location for each client</p>
      </div>

      <div style={S.layout}>
        <div style={S.mapCard}>
          <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitToMarkers points={latestByClient} />
            {latestByClient.map(ci => (
              <Marker key={ci.id} position={[ci.latitude, ci.longitude]}>
                <Popup>
                  <strong>{ci.clients?.name || 'Unknown client'}</strong><br />
                  {formatTime(ci.checked_in_at)}<br />
                  {ci.latitude.toFixed(5)}, {ci.longitude.toFixed(5)}
                  {ci.notes && <><br />{ci.notes}</>}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div style={S.card}>
          <div style={S.cardHeader}>
            <h3 style={S.cardTitle}>Last Known Locations</h3>
          </div>
          <div>
            {latestByClient.length === 0 ? (
              <div style={S.emptyState}>
                <p style={S.emptyText}>No check-in location data yet</p>
              </div>
            ) : (
              latestByClient.map(ci => (
                <div key={ci.id} style={S.listRow}>
                  <div style={S.listName}>{ci.clients?.name || 'Unknown'}</div>
                  <div style={S.listSub}>{formatTime(ci.checked_in_at)}</div>
                  <div style={S.listSub}>{ci.latitude.toFixed(5)}, {ci.longitude.toFixed(5)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
