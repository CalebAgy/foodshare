/**
 * AC-6: /map route renders MapView page with Leaflet MapContainer; one Marker per listing
 * AC-7: Clicking a map marker navigates to /listing/:id
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';

// ---------------------------------------------------------------------------
// Mock react-leaflet so it works in jsdom (no real DOM measurements needed)
// ---------------------------------------------------------------------------
vi.mock('react-leaflet', () => {
  const MapContainer = ({ children, ...props }: React.PropsWithChildren<{ 'data-testid'?: string }>) => (
    <div data-testid="map-container" {...props}>{children}</div>
  );
  const TileLayer = () => <div data-testid="tile-layer" />;
  const Marker = ({
    children,
    position,
    eventHandlers,
  }: {
    children?: React.ReactNode;
    position: [number, number];
    eventHandlers?: { click?: () => void };
  }) => (
    <div
      data-testid={`marker-${position[0].toFixed(4)}-${position[1].toFixed(4)}`}
      onClick={eventHandlers?.click}
    >
      {children}
    </div>
  );
  const Popup = ({ children }: React.PropsWithChildren) => (
    <div data-testid="popup">{children}</div>
  );
  const useMap = () => ({ setView: vi.fn() });
  return { MapContainer, TileLayer, Marker, Popup, useMap };
});

// Mock leaflet itself (icon setup + divIcon)
vi.mock('leaflet', () => {
  function IconDefault() { return {}; }
  IconDefault.prototype = {};
  IconDefault.mergeOptions = vi.fn();
  return {
    default: {
      Icon: { Default: IconDefault },
      icon: vi.fn(() => ({})),
      divIcon: vi.fn(() => ({})),
    },
    Icon: { Default: IconDefault },
    divIcon: vi.fn(() => ({})),
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AC-6: MapView page renders with Leaflet', () => {
  beforeAll(() => {
    mockNavigate.mockReset();
  });

  it('MapView page is importable', async () => {
    const mod = await import('../app/pages/MapView');
    expect(mod.default).toBeDefined();
  });

  it('renders a map container element', async () => {
    const MapView = (await import('../app/pages/MapView')).default;
    render(
      <MemoryRouter>
        <MapView />
      </MemoryRouter>
    );
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders a TileLayer', async () => {
    const MapView = (await import('../app/pages/MapView')).default;
    render(
      <MemoryRouter>
        <MapView />
      </MemoryRouter>
    );
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  it('renders exactly 6 markers (one per mock listing)', async () => {
    const MapView = (await import('../app/pages/MapView')).default;
    render(
      <MemoryRouter>
        <MapView />
      </MemoryRouter>
    );
    const markers = screen.getAllByTestId(/^marker-/);
    expect(markers).toHaveLength(6);
  });

  it('each marker is positioned at its listing coordinates', async () => {
    const MapView = (await import('../app/pages/MapView')).default;
    render(
      <MemoryRouter>
        <MapView />
      </MemoryRouter>
    );
    // Listing id=1: lat=52.4619, lng=13.5225
    expect(
      screen.getByTestId('marker-52.4619-13.5225')
    ).toBeInTheDocument();
  });
});

describe('AC-7: Marker popup button navigates to listing detail', () => {
  it('popup "Angebot öffnen" buttons exist for each listing', async () => {
    const MapView = (await import('../app/pages/MapView')).default;
    render(
      <MemoryRouter>
        <MapView />
      </MemoryRouter>
    );
    const buttons = screen.getAllByRole('button', { name: /Angebot öffnen/i });
    expect(buttons.length).toBeGreaterThanOrEqual(6);
  });

  it('clicking "Angebot öffnen" for listing id=1 calls navigate("/listing/1")', async () => {
    mockNavigate.mockReset();
    const MapView = (await import('../app/pages/MapView')).default;
    render(
      <MemoryRouter>
        <MapView />
      </MemoryRouter>
    );
    // First button corresponds to first listing (id=1)
    const buttons = screen.getAllByRole('button', { name: /Angebot öffnen/i });
    fireEvent.click(buttons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/listing/1');
  });

  it('clicking "Angebot öffnen" for listing id=6 calls navigate("/listing/6")', async () => {
    mockNavigate.mockReset();
    const MapView = (await import('../app/pages/MapView')).default;
    render(
      <MemoryRouter>
        <MapView />
      </MemoryRouter>
    );
    const buttons = screen.getAllByRole('button', { name: /Angebot öffnen/i });
    fireEvent.click(buttons[5]);
    expect(mockNavigate).toHaveBeenCalledWith('/listing/6');
  });
});
