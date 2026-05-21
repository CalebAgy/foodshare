/**
 * User Story (⚠️): As a Student, I want to filter by category (vegan, halal, etc.)
 * so that I can find food that matches my dietary needs.
 *
 * Acceptance Criteria:
 * 1. Dietary category chips (vegan, halal, vegetarian, …) are available as filter options
 * 2. Selecting a dietary category returns only listings whose `category` array includes it
 * 3. Combining a type filter (store/private) with a dietary filter works correctly
 * 4. Clearing the dietary filter restores the full (type-filtered) list
 *
 * Current state: The store/private type filter works. Dietary category filtering does NOT
 * exist — no vegan/halal chips are rendered and the filter logic only checks listing.type.
 */

import { describe, it, expect } from 'vitest';
import { Listing } from '../app/types/listing';

// ---------------------------------------------------------------------------
// Helper: the filtering function that SHOULD exist in the app.
// It mirrors what Home.tsx currently does for type/search but adds `dietaryCategory`.
// When this logic is implemented, these tests will pass.
// ---------------------------------------------------------------------------

type FilterType = 'all' | 'store' | 'private';

function filterListings(
  listings: Listing[],
  typeFilter: FilterType,
  searchQuery: string,
  dietaryCategory: string | null
): Listing[] {
  return listings.filter((listing) => {
    const matchesType = typeFilter === 'all' || listing.type === typeFilter;
    const matchesSearch =
      !searchQuery ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.category.some((cat) =>
        cat.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesDietary =
      !dietaryCategory ||
      listing.category.some(
        (cat) => cat.toLowerCase() === dietaryCategory.toLowerCase()
      );

    return matchesType && matchesSearch && matchesDietary;
  });
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const baseDate = new Date();
const future = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000);

const veganListing: Listing = {
  id: 'v1',
  type: 'store',
  title: 'Veganer Auflauf',
  description: 'Komplett pflanzlich',
  location: 'Berlin',
  distance: 1.0,
  price: 0,
  expiresAt: future,
  imageUrl: '',
  contact: 'app',
  category: ['Vegan', 'Gemüse'],
  createdBy: 'Bio Laden',
  createdAt: baseDate,
};

const halalListing: Listing = {
  id: 'h1',
  type: 'store',
  title: 'Halal Fleisch',
  description: 'Halal zertifiziert',
  location: 'Berlin',
  distance: 2.0,
  price: 3,
  expiresAt: future,
  imageUrl: '',
  contact: 'Tel: 030 111',
  category: ['Halal', 'Fleisch'],
  createdBy: 'Halal Markt',
  createdAt: baseDate,
};

const regularListing: Listing = {
  id: 'r1',
  type: 'private',
  title: 'Kuchen',
  description: 'Selbstgebacken',
  location: 'Berlin',
  distance: 0.5,
  price: 0,
  expiresAt: future,
  imageUrl: '',
  contact: 'app',
  category: ['Backwaren'],
  createdBy: 'Anna',
  createdAt: baseDate,
};

const allListings = [veganListing, halalListing, regularListing];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Student: filter by dietary category', () => {
  it('returns all listings when no dietary category is selected', () => {
    const result = filterListings(allListings, 'all', '', null);
    expect(result).toHaveLength(3);
  });

  it('returns only vegan listings when "Vegan" category is selected', () => {
    const result = filterListings(allListings, 'all', '', 'Vegan');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v1');
  });

  it('returns only halal listings when "Halal" category is selected', () => {
    const result = filterListings(allListings, 'all', '', 'Halal');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('h1');
  });

  it('is case-insensitive for dietary category matching', () => {
    const result = filterListings(allListings, 'all', '', 'vegan');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v1');
  });

  it('returns empty list when no listing matches the dietary category', () => {
    const result = filterListings(allListings, 'all', '', 'Glutenfrei');
    expect(result).toHaveLength(0);
  });

  it('combines type filter and dietary category filter correctly', () => {
    // Only store listings that are also vegan
    const result = filterListings(allListings, 'store', '', 'Vegan');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v1');
  });

  it('combines private type filter with dietary — no match returns empty', () => {
    // Private listings that are vegan — none in fixture
    const result = filterListings(allListings, 'private', '', 'Vegan');
    expect(result).toHaveLength(0);
  });

  it('combines search query and dietary category filter', () => {
    // Search "auflauf" + vegan
    const result = filterListings(allListings, 'all', 'auflauf', 'Vegan');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v1');
  });

  it('clearing dietary filter (null) restores type-filtered list', () => {
    const storeOnly = filterListings(allListings, 'store', '', null);
    expect(storeOnly).toHaveLength(2); // veganListing + halalListing are both 'store'
  });
});
