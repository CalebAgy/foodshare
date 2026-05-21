/**
 * AC-5: ListingCard shows computed distance (km, 1 decimal) using haversineDistance;
 *       falls back to listing.distance when no user location given.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { ListingCard } from '../app/components/ListingCard';
import { mockListings } from '../app/data/mockListings';

const listing = mockListings[0]; // Bäckerei Schmidt, 52.4619, 13.5225, distance=0.8

describe('AC-5: Distance display on ListingCard', () => {
  it('shows fallback distance when no userLocation provided', () => {
    render(
      <MemoryRouter>
        <ListingCard listing={listing} />
      </MemoryRouter>
    );
    // Should show the stored distance
    expect(screen.getByText(/0\.8\s*km/)).toBeInTheDocument();
  });

  it('shows computed distance when userLocation is provided', () => {
    // User is at HTW Berlin (52.4573, 13.5315)
    // Haversine to listing[0] (52.4619, 13.5225) ≈ 0.8 km
    render(
      <MemoryRouter>
        <ListingCard
          listing={listing}
          userLocation={{ latitude: 52.4573, longitude: 13.5315 }}
        />
      </MemoryRouter>
    );
    // Should show computed value (close to 0.8 km — within 0.5 km of stored value)
    const distanceEl = screen.getByTestId('listing-distance');
    const text = distanceEl.textContent ?? '';
    const km = parseFloat(text);
    expect(km).toBeGreaterThan(0);
    expect(km).toBeLessThan(2);
  });

  it('distance element has data-testid="listing-distance"', () => {
    render(
      <MemoryRouter>
        <ListingCard listing={listing} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('listing-distance')).toBeInTheDocument();
  });

  it('distance is rounded to 1 decimal place', () => {
    render(
      <MemoryRouter>
        <ListingCard
          listing={listing}
          userLocation={{ latitude: 52.4573, longitude: 13.5315 }}
        />
      </MemoryRouter>
    );
    const text = screen.getByTestId('listing-distance').textContent ?? '';
    // Matches e.g. "0.8 km" or "1.2 km" — one decimal
    expect(text).toMatch(/^\d+\.\d km$/);
  });
});
