import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bell } from 'lucide-react';
import { mockListings } from '../data/mockListings';
import { BottomNav } from '../components/BottomNav';
import { LocationPermissionBanner } from '../components/LocationPermissionBanner';
import { LocationFallback } from '../components/LocationFallback';
import { useGeolocation } from '../hooks/useGeolocation';
import { useUserBehavior } from '../hooks/useUserBehavior';
import { scoreListings, type RecommendationTier } from '../utils/recommendationEngine';
import { haversineDistance } from '../utils/haversineDistance';
import { Button } from '../components/ui/button';

// Fix default marker icons broken by Vite's asset pipeline
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ---------------------------------------------------------------------------
// Custom marker icons per recommendation tier
// ---------------------------------------------------------------------------

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 2px #2563eb;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function buildMarkerIcon(tier: RecommendationTier): L.Icon | L.DivIcon {
  if (tier === 'hot') {
    return L.divIcon({
      className: '',
      html: `<div class="marker-hot" style="
        width:28px;height:28px;
        background:#f97316;
        border:3px solid #fff;
        border-radius:50%;
        box-shadow:0 0 0 2px #f97316;
        display:flex;align-items:center;justify-content:center;
        font-size:13px;line-height:1;
      ">🔥</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }
  if (tier === 'warm') {
    return L.divIcon({
      className: '',
      html: `<div style="
        width:24px;height:24px;
        background:#eab308;
        border:3px solid #fff;
        border-radius:50%;
        box-shadow:0 0 0 2px #eab308;
        display:flex;align-items:center;justify-content:center;
        font-size:11px;line-height:1;
      ">⭐</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }
  // normal — default Leaflet icon
  return new L.Icon.Default();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HTW_CENTER: [number, number] = [52.4573, 13.5315];
const DEFAULT_ZOOM = 13;

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, DEFAULT_ZOOM, { animate: true });
  }, [center, map]);
  return null;
}

function formatTimeLeft(expiresAt: Date): string {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return 'Abgelaufen';
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (h === 0) return `${m} Min`;
  if (h < 24) return `${h}h ${m}m`;
  return `${Math.floor(h / 24)}d`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MapView() {
  const navigate = useNavigate();
  const { latitude, longitude, permissionState, requestLocation } = useGeolocation();
  const { behavior, recordView } = useUserBehavior();

  useEffect(() => {
    requestLocation();
    if (!document.getElementById('foodshare-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'foodshare-marker-styles';
      style.textContent = `
        @keyframes pulse-hot {
          0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.6); }
          50%      { box-shadow: 0 0 0 10px rgba(249,115,22,0); }
        }
        .marker-hot { animation: pulse-hot 1.6s ease-in-out infinite; }
        .foodshare-popup .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .foodshare-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .foodshare-popup .leaflet-popup-tip-container {
          margin-top: -1px;
        }
      `;
      document.head.appendChild(style);
    }
    return () => document.getElementById('foodshare-marker-styles')?.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const userPos: [number, number] | null =
    latitude !== null && longitude !== null ? [latitude, longitude] : null;
  const mapCenter = userPos ?? HTW_CENTER;

  const scores = useMemo(
    () => scoreListings(mockListings, behavior.views, latitude, longitude),
    [behavior.views, latitude, longitude]
  );

  const hasRecommendations = scores.size > 0;

  return (
    <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shrink-0">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-green-600">Karte</h1>
              <p className="text-sm text-muted-foreground">
                {hasRecommendations
                  ? 'Empfehlungen basierend auf deinem Verhalten'
                  : 'Angebote in deiner Nähe'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={requestLocation}
                aria-label="Standort aktualisieren"
              >
                <Bell className="size-5" />
              </Button>
            </div>
          </div>

          {hasRecommendations && (
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">🔥 Sehr passend</span>
              <span className="flex items-center gap-1">⭐ Passend</span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-[#2563eb] border border-white" />
                Normal
              </span>
            </div>
          )}
        </div>
        <LocationPermissionBanner
          permissionState={permissionState}
          onRequestLocation={requestLocation}
        />
        <LocationFallback permissionState={permissionState} onRetry={requestLocation} />
      </header>

      {/* Map — flex-1 + min-h-0 fills remaining space between header and nav */}
      <div className="flex-1 min-h-0 max-w-md w-full mx-auto">
        <MapContainer
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          <RecenterMap center={mapCenter} />

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup className="foodshare-popup">
                <div style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>
                  📍 Dein Standort
                </div>
              </Popup>
            </Marker>
          )}

          {mockListings.map((listing) => {
            const rec = scores.get(listing.id);
            const tier = rec?.tier ?? 'normal';
            const icon = buildMarkerIcon(tier);
            const isUrgent = listing.expiresAt.getTime() - Date.now() < 3 * 60 * 60 * 1000;
            const dist = userPos
              ? haversineDistance(userPos[0], userPos[1], listing.latitude, listing.longitude)
              : listing.distance;

            return (
              <Marker
                key={listing.id}
                position={[listing.latitude, listing.longitude]}
                icon={icon}
              >
                <Popup className="foodshare-popup" minWidth={272} maxWidth={272}>
                  <div style={{ width: 272, fontFamily: 'system-ui, sans-serif' }}>

                    {/* Image */}
                    <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      {/* Type + price badges overlaid on image */}
                      <div style={{ position: 'absolute', bottom: 8, left: 10, display: 'flex', gap: 6 }}>
                        <span style={{
                          background: listing.type === 'store' ? '#18181b' : '#f4f4f5',
                          color: listing.type === 'store' ? '#fff' : '#3f3f46',
                          fontSize: 10, fontWeight: 600, padding: '2px 8px',
                          borderRadius: 20, letterSpacing: 0.3,
                        }}>
                          {listing.type === 'store' ? 'Laden' : 'Privat'}
                        </span>
                        {listing.price === 0 && (
                          <span style={{
                            background: '#16a34a', color: '#fff',
                            fontSize: 10, fontWeight: 600, padding: '2px 8px',
                            borderRadius: 20, letterSpacing: 0.3,
                          }}>
                            Kostenlos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '10px 12px 12px' }}>

                      {/* Recommendation badge */}
                      {rec && tier !== 'normal' && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 6,
                          background: tier === 'hot' ? '#fff7ed' : '#fefce8',
                          border: `1px solid ${tier === 'hot' ? '#fed7aa' : '#fef08a'}`,
                          borderRadius: 6, padding: '2px 7px',
                          fontSize: 10, fontWeight: 600,
                          color: tier === 'hot' ? '#c2410c' : '#a16207',
                        }}>
                          {tier === 'hot' ? '🔥' : '⭐'} {rec.reason}
                        </div>
                      )}

                      {/* Title */}
                      <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: '#18181b' }}>
                        {listing.title}
                      </p>
                      <p style={{ margin: '0 0 8px', fontSize: 11, color: '#71717a' }}>
                        {listing.address}
                      </p>

                      {/* Stats row */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        <span style={{
                          background: isUrgent ? '#fef2f2' : '#f4f4f5',
                          color: isUrgent ? '#dc2626' : '#52525b',
                          fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
                        }}>
                          ⏱ {formatTimeLeft(listing.expiresAt)}
                        </span>
                        <span style={{
                          background: '#f4f4f5', color: '#52525b',
                          fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
                        }}>
                          📍 {dist.toFixed(1)} km
                        </span>
                        {listing.price > 0 && (
                          <span style={{
                            background: '#f4f4f5', color: '#52525b',
                            fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
                          }}>
                            {listing.price.toFixed(2)} €
                          </span>
                        )}
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => {
                          recordView({
                            listingId: listing.id,
                            distance: userPos
                              ? haversineDistance(userPos[0], userPos[1], listing.latitude, listing.longitude)
                              : listing.distance,
                            categories: listing.category,
                            type: listing.type,
                            price: listing.price,
                          });
                          navigate(`/listing/${listing.id}`);
                        }}
                        style={{
                          width: '100%', padding: '8px 0',
                          background: '#16a34a', color: '#fff',
                          border: 'none', borderRadius: 8,
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          letterSpacing: 0.2,
                        }}
                      >
                        Angebot öffnen →
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Inline nav — participates in flex layout so map never extends behind it */}
      <div className="shrink-0">
        <BottomNav variant="inline" />
      </div>
    </div>
  );
}
