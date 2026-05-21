import { MapPin, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import type { PermissionState } from '../hooks/useGeolocation';

interface LocationPermissionBannerProps {
  permissionState: PermissionState;
  onRequestLocation: () => void;
}

export function LocationPermissionBanner({
  permissionState,
  onRequestLocation,
}: LocationPermissionBannerProps) {
  if (permissionState === 'success' || permissionState === 'denied' || permissionState === 'unavailable') {
    return null;
  }

  const isLoading = permissionState === 'loading';

  return (
    <div
      data-testid="location-permission-banner"
      className="flex items-center gap-3 px-4 py-3 bg-primary/5 border-b text-sm"
    >
      <MapPin className="size-4 text-primary flex-shrink-0" />
      <span className="flex-1 text-muted-foreground">
        Aktiviere deinen Standort für Entfernungen und Sortierung.
      </span>
      {isLoading && (
        <Loader2
          data-testid="location-loading"
          className="size-4 animate-spin text-muted-foreground flex-shrink-0"
        />
      )}
      <Button
        size="sm"
        onClick={onRequestLocation}
        disabled={isLoading}
      >
        Standort aktivieren
      </Button>
    </div>
  );
}
