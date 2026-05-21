/**
 * Unit tests for the haversineDistance utility (used by AC-4 and AC-5)
 */

import { describe, it, expect } from 'vitest';
import { haversineDistance } from '../app/utils/haversineDistance';

describe('haversineDistance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistance(52.4573, 13.5315, 52.4573, 13.5315)).toBe(0);
  });

  it('returns ~111 km per degree of latitude', () => {
    const d = haversineDistance(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });

  it('is symmetric: d(A,B) === d(B,A)', () => {
    const d1 = haversineDistance(52.4573, 13.5315, 52.5200, 13.4050);
    const d2 = haversineDistance(52.5200, 13.4050, 52.4573, 13.5315);
    expect(d1).toBe(d2);
  });

  it('distance from HTW to listing[0] is approximately 0.8 km', () => {
    const d = haversineDistance(52.4573, 13.5315, 52.4619, 13.5225);
    expect(d).toBeGreaterThan(0.5);
    expect(d).toBeLessThan(1.5);
  });

  it('returns a number rounded to 1 decimal place', () => {
    const d = haversineDistance(52.4573, 13.5315, 52.4762, 13.5315);
    const decimals = d.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(1);
  });

  it('distance from Berlin to Munich is approximately 525 km', () => {
    // Berlin: 52.52, 13.405 | Munich: 48.135, 11.582
    const d = haversineDistance(52.52, 13.405, 48.135, 11.582);
    expect(d).toBeGreaterThan(500);
    expect(d).toBeLessThan(550);
  });
});
