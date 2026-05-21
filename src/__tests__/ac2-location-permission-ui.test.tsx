/**
 * AC-2: LocationPermissionBanner shown when location not yet granted;
 *       has "Standort aktivieren" button that calls requestLocation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LocationPermissionBanner } from '../app/components/LocationPermissionBanner';

describe('AC-2: LocationPermissionBanner', () => {
  it('renders when permissionState is "idle"', () => {
    render(
      <LocationPermissionBanner
        permissionState="idle"
        onRequestLocation={vi.fn()}
      />
    );
    expect(screen.getByTestId('location-permission-banner')).toBeInTheDocument();
  });

  it('renders when permissionState is "loading"', () => {
    render(
      <LocationPermissionBanner
        permissionState="loading"
        onRequestLocation={vi.fn()}
      />
    );
    expect(screen.getByTestId('location-permission-banner')).toBeInTheDocument();
  });

  it('does NOT render when permissionState is "success"', () => {
    render(
      <LocationPermissionBanner
        permissionState="success"
        onRequestLocation={vi.fn()}
      />
    );
    expect(screen.queryByTestId('location-permission-banner')).not.toBeInTheDocument();
  });

  it('shows a "Standort aktivieren" button when idle', () => {
    render(
      <LocationPermissionBanner
        permissionState="idle"
        onRequestLocation={vi.fn()}
      />
    );
    expect(
      screen.getByRole('button', { name: /standort aktivieren/i })
    ).toBeInTheDocument();
  });

  it('calls onRequestLocation when button is clicked', () => {
    const onRequest = vi.fn();
    render(
      <LocationPermissionBanner
        permissionState="idle"
        onRequestLocation={onRequest}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /standort aktivieren/i }));
    expect(onRequest).toHaveBeenCalledOnce();
  });

  it('shows loading indicator when permissionState is "loading"', () => {
    render(
      <LocationPermissionBanner
        permissionState="loading"
        onRequestLocation={vi.fn()}
      />
    );
    expect(screen.getByTestId('location-loading')).toBeInTheDocument();
  });

  it('button is disabled while loading', () => {
    render(
      <LocationPermissionBanner
        permissionState="loading"
        onRequestLocation={vi.fn()}
      />
    );
    const btn = screen.getByRole('button', { name: /standort aktivieren/i });
    expect(btn).toBeDisabled();
  });
});
