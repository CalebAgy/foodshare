/**
 * Unit tests for the content-based recommendation engine.
 * Covers: time-decay weight, individual signal scores, scoreListings().
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  timeDecayWeight,
  computeCategoryScore,
  computeDistanceScore,
  computeTypeScore,
  computePriceScore,
  computeUrgencyScore,
  scoreListings,
} from '../app/utils/recommendationEngine';
import type { Listing } from '../app/types/listing';
import type { ViewEvent } from '../app/hooks/useUserBehavior';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-05-21T12:00:00Z').getTime();

function makeView(overrides: Partial<ViewEvent> = {}): ViewEvent {
  return {
    listingId: 'x',
    timestamp: NOW,
    distance: 1.0,
    categories: ['Bäckerei'],
    type: 'store',
    price: 0,
    ...overrides,
  };
}

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'test-listing',
    type: 'store',
    title: 'Test',
    description: '',
    location: 'Berlin',
    address: 'Musterstraße 1',
    latitude: 52.4573,
    longitude: 13.5315,
    distance: 1.0,
    price: 0,
    expiresAt: new Date(NOW + 24 * 60 * 60 * 1000), // 24 h from now
    imageUrl: '',
    contact: 'test@test.de',
    category: ['Bäckerei'],
    createdBy: 'Tester',
    createdAt: new Date(NOW),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// timeDecayWeight
// ---------------------------------------------------------------------------

describe('timeDecayWeight', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('returns 1.0 for a very recent event (0 h)', () => {
    expect(timeDecayWeight(NOW)).toBeCloseTo(1.0, 3);
  });

  it('returns ~0.5 after ~7 hours (half-life)', () => {
    const sevenHoursAgo = NOW - 7 * 60 * 60 * 1000;
    // e^(-0.1 * 7) ≈ 0.496
    expect(timeDecayWeight(sevenHoursAgo)).toBeCloseTo(0.496, 2);
  });

  it('returns a lower value for older events', () => {
    const recent = timeDecayWeight(NOW - 1 * 60 * 60 * 1000);
    const old = timeDecayWeight(NOW - 20 * 60 * 60 * 1000);
    expect(recent).toBeGreaterThan(old);
  });

  it('clamps future timestamps to weight 1.0 (no negative decay)', () => {
    const future = NOW + 60 * 60 * 1000;
    expect(timeDecayWeight(future)).toBeCloseTo(1.0, 3);
  });
});

// ---------------------------------------------------------------------------
// computeCategoryScore
// ---------------------------------------------------------------------------

describe('computeCategoryScore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('returns 0 for empty view history', () => {
    const listing = makeListing({ category: ['Bäckerei'] });
    expect(computeCategoryScore(listing, [])).toBe(0);
  });

  it('returns > 0 when user has viewed the same category before', () => {
    const listing = makeListing({ category: ['Bäckerei'] });
    const views = [makeView({ categories: ['Bäckerei'] })];
    expect(computeCategoryScore(listing, views)).toBeGreaterThan(0);
  });

  it('returns a higher score for exact category match than mismatch', () => {
    const listing = makeListing({ category: ['Bäckerei'] });
    const matchingViews = [makeView({ categories: ['Bäckerei'] })];
    const mismatchViews = [makeView({ categories: ['Obst & Gemüse'] })];
    const matchScore = computeCategoryScore(listing, matchingViews);
    const mismatchScore = computeCategoryScore(listing, mismatchViews);
    expect(matchScore).toBeGreaterThan(mismatchScore);
  });

  it('never returns a value above 1.0', () => {
    const listing = makeListing({ category: ['Bäckerei'] });
    const manyViews = Array.from({ length: 20 }, () => makeView({ categories: ['Bäckerei'] }));
    expect(computeCategoryScore(listing, manyViews)).toBeLessThanOrEqual(1.0);
  });
});

// ---------------------------------------------------------------------------
// computeDistanceScore
// ---------------------------------------------------------------------------

describe('computeDistanceScore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('returns a fallback value when no views and listing is nearby (<2 km)', () => {
    const listing = makeListing({ distance: 1.0 });
    const score = computeDistanceScore(listing, [], 52.46, 13.53);
    // No views: dist < 2 km → 0.8
    expect(score).toBe(0.8);
  });

  it('returns 0.3 fallback when no views and listing is far (>2 km)', () => {
    const listing = makeListing({ distance: 5.0, latitude: 52.5, longitude: 13.6 });
    const score = computeDistanceScore(listing, [], 52.46, 13.53);
    expect(score).toBe(0.3);
  });

  it('scores a listing within mean distance as 1.0', () => {
    const views = [makeView({ distance: 3.0 })]; // mean = 3 km
    const listing = makeListing({ distance: 2.0, latitude: 52.4573, longitude: 13.5315 });
    // User is at (52.4573, 13.5315) — same as listing → 0 km ≤ mean
    const score = computeDistanceScore(listing, views, 52.4573, 13.5315);
    expect(score).toBe(1.0);
  });

  it('scores a far listing lower than a nearby listing', () => {
    const views = [makeView({ distance: 1.0 })];
    const nearby = makeListing({ latitude: 52.458, longitude: 13.532 }); // ~0.1 km away
    const far = makeListing({ latitude: 52.52, longitude: 13.60 });     // ~8 km away
    const userLat = 52.4573;
    const userLng = 13.5315;
    const nearbyScore = computeDistanceScore(nearby, views, userLat, userLng);
    const farScore = computeDistanceScore(far, views, userLat, userLng);
    expect(nearbyScore).toBeGreaterThan(farScore);
  });
});

// ---------------------------------------------------------------------------
// computeTypeScore
// ---------------------------------------------------------------------------

describe('computeTypeScore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('returns 0.5 for empty view history', () => {
    expect(computeTypeScore(makeListing({ type: 'store' }), [])).toBe(0.5);
  });

  it('scores store listing higher when user mostly views stores', () => {
    const views = [
      makeView({ type: 'store' }),
      makeView({ type: 'store' }),
      makeView({ type: 'store' }),
    ];
    const storeScore = computeTypeScore(makeListing({ type: 'store' }), views);
    const privateScore = computeTypeScore(makeListing({ type: 'private' }), views);
    expect(storeScore).toBeGreaterThan(privateScore);
  });

  it('scores private listing higher when user mostly views private', () => {
    const views = [
      makeView({ type: 'private' }),
      makeView({ type: 'private' }),
    ];
    const privateScore = computeTypeScore(makeListing({ type: 'private' }), views);
    const storeScore = computeTypeScore(makeListing({ type: 'store' }), views);
    expect(privateScore).toBeGreaterThan(storeScore);
  });

  it('always stays in [0.3, 1.0] range', () => {
    const allStoreViews = Array.from({ length: 10 }, () => makeView({ type: 'store' }));
    const privateScore = computeTypeScore(makeListing({ type: 'private' }), allStoreViews);
    expect(privateScore).toBeGreaterThanOrEqual(0.3);
    expect(privateScore).toBeLessThanOrEqual(1.0);
  });
});

// ---------------------------------------------------------------------------
// computePriceScore
// ---------------------------------------------------------------------------

describe('computePriceScore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('favours free listings (0.7) over paid (0.5) when no views', () => {
    const freeListing = makeListing({ price: 0 });
    const paidListing = makeListing({ price: 2.5 });
    expect(computePriceScore(freeListing, [])).toBeGreaterThan(computePriceScore(paidListing, []));
  });

  it('scores free listing higher for a user who only views free items', () => {
    const views = [makeView({ price: 0 }), makeView({ price: 0 })];
    const freeScore = computePriceScore(makeListing({ price: 0 }), views);
    const paidScore = computePriceScore(makeListing({ price: 3 }), views);
    expect(freeScore).toBeGreaterThan(paidScore);
  });

  it('never returns below 0.2', () => {
    const allFreeViews = Array.from({ length: 10 }, () => makeView({ price: 0 }));
    const score = computePriceScore(makeListing({ price: 5 }), allFreeViews);
    expect(score).toBeGreaterThanOrEqual(0.2);
  });
});

// ---------------------------------------------------------------------------
// computeUrgencyScore
// ---------------------------------------------------------------------------

describe('computeUrgencyScore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('returns 1.0 for a listing expiring in <2 h', () => {
    const listing = makeListing({ expiresAt: new Date(NOW + 1 * 60 * 60 * 1000) });
    expect(computeUrgencyScore(listing)).toBe(1.0);
  });

  it('returns 0.8 for a listing expiring in 2–4 h', () => {
    const listing = makeListing({ expiresAt: new Date(NOW + 3 * 60 * 60 * 1000) });
    expect(computeUrgencyScore(listing)).toBe(0.8);
  });

  it('returns 0 for an already-expired listing', () => {
    const listing = makeListing({ expiresAt: new Date(NOW - 1000) });
    expect(computeUrgencyScore(listing)).toBe(0);
  });

  it('urgency decreases the further out the expiry is', () => {
    const soon = makeListing({ expiresAt: new Date(NOW + 1 * 60 * 60 * 1000) });
    const later = makeListing({ expiresAt: new Date(NOW + 48 * 60 * 60 * 1000) });
    expect(computeUrgencyScore(soon)).toBeGreaterThan(computeUrgencyScore(later));
  });
});

// ---------------------------------------------------------------------------
// scoreListings — integration tests
// ---------------------------------------------------------------------------

describe('scoreListings', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('returns an empty Map when view history is empty', () => {
    const listings = [makeListing()];
    const result = scoreListings(listings, [], null, null);
    expect(result.size).toBe(0);
  });

  it('returns an empty Map when fewer than 3 views', () => {
    const listings = [makeListing()];
    const views = [makeView(), makeView()];
    expect(scoreListings(listings, views, null, null).size).toBe(0);
  });

  it('returns scores for all listings once ≥3 views exist', () => {
    const listings = [makeListing({ id: 'a' }), makeListing({ id: 'b' })];
    const views = [makeView(), makeView(), makeView()];
    const result = scoreListings(listings, views, null, null);
    expect(result.size).toBe(2);
    expect(result.has('a')).toBe(true);
    expect(result.has('b')).toBe(true);
  });

  it('scores are in [0, 1] range', () => {
    const listings = [makeListing()];
    const views = [makeView(), makeView(), makeView()];
    const result = scoreListings(listings, views, null, null);
    const score = result.get('test-listing')!.score;
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('a listing matching user category/type preferences ranks higher than a mismatch', () => {
    const bakeryListing = makeListing({ id: 'bakery', category: ['Bäckerei'], type: 'store' });
    const unrelatedListing = makeListing({ id: 'other', category: ['Restaurant'], type: 'private' });

    const views = Array.from({ length: 5 }, () =>
      makeView({ categories: ['Bäckerei'], type: 'store' })
    );

    const result = scoreListings([bakeryListing, unrelatedListing], views, null, null);
    const bakeryScore = result.get('bakery')!.score;
    const otherScore = result.get('other')!.score;
    expect(bakeryScore).toBeGreaterThan(otherScore);
  });

  it('tier is "hot" when score ≥ 0.65', () => {
    // Create a listing that maximises all signals
    const urgentBakery = makeListing({
      id: 'hot-listing',
      category: ['Bäckerei'],
      type: 'store',
      price: 0,
      expiresAt: new Date(NOW + 30 * 60 * 1000), // 30 min → urgency 1.0
      latitude: 52.4573,
      longitude: 13.5315,
    });

    const views = Array.from({ length: 5 }, () =>
      makeView({
        categories: ['Bäckerei'],
        type: 'store',
        price: 0,
        distance: 0.1,
      })
    );

    const result = scoreListings([urgentBakery], views, 52.4573, 13.5315);
    const entry = result.get('hot-listing')!;
    expect(entry.tier).toBe('hot');
  });

  it('tier is "normal" when score < 0.45', () => {
    // No category, type, or price match at all
    const unrelatedListing = makeListing({
      id: 'cold',
      category: ['Restaurant'],
      type: 'private',
      price: 10,
      expiresAt: new Date(NOW + 72 * 60 * 60 * 1000), // 3 days → urgency 0.1
      latitude: 52.6, // ~17 km away from 52.4573
      longitude: 13.8,
    });

    const views = Array.from({ length: 5 }, () =>
      makeView({
        categories: ['Bäckerei'],
        type: 'store',
        price: 0,
        distance: 0.5,
      })
    );

    const result = scoreListings([unrelatedListing], views, 52.4573, 13.5315);
    const entry = result.get('cold')!;
    expect(entry.tier).toBe('normal');
  });

  it('hot-tier entries include a non-empty reason string', () => {
    const listing = makeListing({
      id: 'hot2',
      category: ['Bäckerei'],
      type: 'store',
      price: 0,
      expiresAt: new Date(NOW + 30 * 60 * 1000),
      latitude: 52.4573,
      longitude: 13.5315,
    });

    const views = Array.from({ length: 5 }, () =>
      makeView({ categories: ['Bäckerei'], type: 'store', price: 0, distance: 0.1 })
    );

    const result = scoreListings([listing], views, 52.4573, 13.5315);
    expect(result.get('hot2')!.reason).toBeTruthy();
  });

  it('normal-tier entries have an empty reason string', () => {
    const listing = makeListing({
      id: 'normal1',
      category: ['Restaurant'],
      type: 'private',
      price: 10,
      expiresAt: new Date(NOW + 72 * 60 * 60 * 1000),
      latitude: 52.6,
      longitude: 13.8,
    });

    const views = Array.from({ length: 5 }, () =>
      makeView({ categories: ['Bäckerei'], type: 'store', price: 0, distance: 0.5 })
    );

    const result = scoreListings([listing], views, 52.4573, 13.5315);
    expect(result.get('normal1')!.reason).toBe('');
  });
});
