import { MapPinOff } from 'lucide-react';
import { Button } from './ui/button';
import type { PermissionState } from '../hooks/useGeolocation';

interface LocationFallbackProps {
  permissionState: PermissionState;
  onRetry: () => void;
}

const MESSAGES: Partial<Record<PermissionState, string>> = {
  denied:
    'Standortzugriff wurde abgelehnt. Bitte erlaube den Standortzugriff in deinen Browsereinstellungen.',
  unavailable:
    'Standort ist nicht verfügbar. Bitte überprüfe deine Verbindung oder versuche es erneut.',
};

export function LocationFallback({ permissionState, onRetry }: LocationFallbackProps) {
  if (permissionState !== 'denied' && permissionState !== 'unavailable') {
    return null;
  }

  return (
    <div
      data-testid="location-fallback"
      className="flex flex-col items-center gap-3 px-4 py-4 bg-destructive/5 border-b text-sm"
    >
      <div className="flex items-center gap-2 text-destructive">
        <MapPinOff className="size-4 flex-shrink-0" />
        <span>{MESSAGES[permissionState]}</span>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Erneut versuchen
      </Button>
    </div>
  );
}
