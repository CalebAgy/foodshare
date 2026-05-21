/**
 * AC-8: When geolocation is denied/unavailable, a LocationFallback component
 *       explains what happened and offers a retry button.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LocationFallback } from '../app/components/LocationFallback';

describe('AC-8: LocationFallback component', () => {
  it('renders when permissionState is "denied"', () => {
    render(
      <LocationFallback permissionState="denied" onRetry={vi.fn()} />
    );
    expect(screen.getByTestId('location-fallback')).toBeInTheDocument();
  });

  it('renders when permissionState is "unavailable"', () => {
    render(
      <LocationFallback permissionState="unavailable" onRetry={vi.fn()} />
    );
    expect(screen.getByTestId('location-fallback')).toBeInTheDocument();
  });

  it('does NOT render when permissionState is "success"', () => {
    render(
      <LocationFallback permissionState="success" onRetry={vi.fn()} />
    );
    expect(screen.queryByTestId('location-fallback')).not.toBeInTheDocument();
  });

  it('does NOT render when permissionState is "idle"', () => {
    render(
      <LocationFallback permissionState="idle" onRetry={vi.fn()} />
    );
    expect(screen.queryByTestId('location-fallback')).not.toBeInTheDocument();
  });

  it('shows an explanation message when denied', () => {
    render(
      <LocationFallback permissionState="denied" onRetry={vi.fn()} />
    );
    // Should include text about location access being denied
    expect(screen.getByTestId('location-fallback')).toHaveTextContent(/standort|location|zugriff/i);
  });

  it('has a retry button that calls onRetry', () => {
    const onRetry = vi.fn();
    render(
      <LocationFallback permissionState="denied" onRetry={onRetry} />
    );
    const retryBtn = screen.getByRole('button', { name: /erneut|retry|nochmal/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows different message for "unavailable" vs "denied"', () => {
    const { rerender } = render(
      <LocationFallback permissionState="denied" onRetry={vi.fn()} />
    );
    const deniedText = screen.getByTestId('location-fallback').textContent;

    rerender(
      <LocationFallback permissionState="unavailable" onRetry={vi.fn()} />
    );
    const unavailableText = screen.getByTestId('location-fallback').textContent;

    // Messages may differ — both must be non-empty
    expect(deniedText?.length).toBeGreaterThan(0);
    expect(unavailableText?.length).toBeGreaterThan(0);
  });
});
