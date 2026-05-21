/**
 * AC-3: Listing type has latitude/longitude; all mock listings have real Berlin coordinates
 */

import { describe, it, expect } from 'vitest';
import { mockListings } from '../app/data/mockListings';
import type { Listing } from '../app/types/listing';

// Berlin bounding box: lat 52.33–52.68, lng 13.09–13.76
const BERLIN_LAT_MIN = 52.33;
const BERLIN_LAT_MAX = 52.68;
const BERLIN_LNG_MIN = 13.09;
const BERLIN_LNG_MAX = 13.76;

describe('AC-3: Listing type coordinates', () => {
  it('Listing interface has a latitude field of type number', () => {
    const listing: Listing = mockListings[0];
    expect(typeof listing.latitude).toBe('number');
  });

  it('Listing interface has a longitude field of type number', () => {
    const listing: Listing = mockListings[0];
    expect(typeof listing.longitude).toBe('number');
  });

  it('Listing interface has an address field of type string', () => {
    const listing: Listing = mockListings[0];
    expect(typeof listing.address).toBe('string');
    expect(listing.address.length).toBeGreaterThan(0);
  });
});

describe('AC-3: Mock listings have valid Berlin coordinates', () => {
  it('all 6 mock listings are present', () => {
    expect(mockListings).toHaveLength(6);
  });

  mockListings.forEach((listing, index) => {
    it(`listing[${index}] "${listing.id}" has latitude within Berlin bounds`, () => {
      expect(listing.latitude).toBeGreaterThanOrEqual(BERLIN_LAT_MIN);
      expect(listing.latitude).toBeLessThanOrEqual(BERLIN_LAT_MAX);
    });

    it(`listing[${index}] "${listing.id}" has longitude within Berlin bounds`, () => {
      expect(listing.longitude).toBeGreaterThanOrEqual(BERLIN_LNG_MIN);
      expect(listing.longitude).toBeLessThanOrEqual(BERLIN_LNG_MAX);
    });

    it(`listing[${index}] "${listing.id}" has a non-empty address`, () => {
      expect(listing.address).toBeTruthy();
      expect(listing.address.length).toBeGreaterThan(5);
    });
  });

  it('no two listings share the exact same coordinates', () => {
    const coordKeys = mockListings.map((l) => `${l.latitude},${l.longitude}`);
    const unique = new Set(coordKeys);
    expect(unique.size).toBe(mockListings.length);
  });
});
