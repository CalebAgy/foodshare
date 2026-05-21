/**
 * AC-4: Home page sorts listings by computed haversine distance (closest first)
 *       when user location is available.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Listings sorted by their actual computed distance from HTW Berlin (52.4573, 13.5315):
// id 1 → 52.4619, 13.5225 → ~0.8 km  ← closest
// id 2 → 52.4573, 13.5491 → ~1.2 km
// id 5 → 52.4421, 13.5224 → ~1.8 km
// id 3 → 52.4762, 13.5315 → ~2.1 km
// id 6 → 52.4355, 13.5521 → ~2.8 km
// id 4 → 52.4846, 13.5572 → ~3.5 km  ← furthest

const USER_LAT = 52.4573;
const USER_LNG = 13.5315;

describe('AC-4: Distance-based sort on Home page', () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
  };

  beforeEach(() => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });
    // Simulate granted geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success: PositionCallback) => {
      success({
        coords: { latitude: USER_LAT, longitude: USER_LNG },
      } as GeolocationPosition);
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('haversineDistance utility is importable', async () => {
    const { haversineDistance } = await import('../app/utils/haversineDistance');
    expect(typeof haversineDistance).toBe('function');
  });

  it('listings array sorted by distance has id "1" first (closest to HTW)', async () => {
    const { haversineDistance } = await import('../app/utils/haversineDistance');
    const { mockListings } = await import('../app/data/mockListings');

    const sorted = [...mockListings].sort(
      (a, b) =>
        haversineDistance(USER_LAT, USER_LNG, a.latitude, a.longitude) -
        haversineDistance(USER_LAT, USER_LNG, b.latitude, b.longitude)
    );
    expect(sorted[0].id).toBe('1');
  });

  it('listings array sorted by distance has id "4" last (furthest from HTW)', async () => {
    const { haversineDistance } = await import('../app/utils/haversineDistance');
    const { mockListings } = await import('../app/data/mockListings');

    const sorted = [...mockListings].sort(
      (a, b) =>
        haversineDistance(USER_LAT, USER_LNG, a.latitude, a.longitude) -
        haversineDistance(USER_LAT, USER_LNG, b.latitude, b.longitude)
    );
    expect(sorted[sorted.length - 1].id).toBe('4');
  });

  it('Home page renders listing cards in distance order when location is available', async () => {
    const { MemoryRouter } = await import('react-router');
    const Home = (await import('../app/pages/Home')).default;

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Find all listing card titles and check Bäckerei Schmidt (id=1, closest) comes first
    const cards = screen.getAllByRole('link');
    // The first card should link to /listing/1 (closest)
    expect(cards[0]).toHaveAttribute('href', '/listing/1');
  });
});
