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
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MapView() {
  const navigate = useNavigate();
  const { latitude, longitude, permissionState, requestLocation } = useGeolocation();
  const { behavior } = useUserBehavior();

  useEffect(() => {
    requestLocation();
    // Inject pulse animation for hot markers once
    const style = document.createElement('style');
    style.id = 'foodshare-marker-styles';
    if (!document.getElementById('foodshare-marker-styles')) {
      style.textContent = `
        @keyframes pulse-hot {
          0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.6); }
          50%      { box-shadow: 0 0 0 10px rgba(249,115,22,0); }
        }
        .marker-hot { animation: pulse-hot 1.6s ease-in-out infinite; }
      `;
      document.head.appendChild(style);
    }
    return () => document.getElementById('foodshare-marker-styles')?.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const userPos: [number, number] | null =
    latitude !== null && longitude !== null ? [latitude, longitude] : null;
  const mapCenter = userPos ?? HTW_CENTER;

  // Recompute scores whenever behavior or location changes
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
            <Button size="icon" variant="ghost" onClick={requestLocation}>
              <Bell className="size-5" />
            </Button>
          </div>

          {/* Legend — only shown when recommendations are active */}
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

      {/* Map */}
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

          {/* User location */}
          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup>Dein Standort</Popup>
            </Marker>
          )}

          {/* Listing markers */}
          {mockListings.map((listing) => {
            const rec = scores.get(listing.id);
            const tier = rec?.tier ?? 'normal';
            const icon = buildMarkerIcon(tier);

            return (
              <Marker
                key={listing.id}
                position={[listing.latitude, listing.longitude]}
                icon={icon}
              >
                <Popup minWidth={210}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>

                    {/* Recommendation badge */}
                    {rec && tier !== 'normal' && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: tier === 'hot' ? '#fff7ed' : '#fefce8',
                        border: `1px solid ${tier === 'hot' ? '#fed7aa' : '#fef08a'}`,
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: tier === 'hot' ? '#c2410c' : '#a16207',
                      }}>
                        {tier === 'hot' ? '🔥' : '⭐'} Empfohlen · {rec.reason}
                      </div>
                    )}

                    {/* Title + type */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, margin: 0, lineHeight: 1.3 }}>{listing.title}</p>
                      <Badge
                        variant={listing.type === 'store' ? 'default' : 'secondary'}
                        className="text-xs shrink-0"
                      >
                        {listing.type === 'store' ? 'Laden' : 'Privat'}
                      </Badge>
                    </div>

                    {/* Address */}
                    <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{listing.address}</p>

                    {/* Price */}
                    {listing.price === 0 ? (
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', margin: 0 }}>Kostenlos</p>
                    ) : (
                      <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{listing.price.toFixed(2)} €</p>
                    )}

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      Angebot öffnen
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="shrink-0">
        <BottomNav />
      </div>
    </div>
  );
}
