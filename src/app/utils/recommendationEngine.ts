import * as tf from '@tensorflow/tfjs';
import type { Listing } from '../types/listing';
import type { ViewEvent } from '../hooks/useUserBehavior';
import { haversineDistance } from './haversineDistance';

// Single Dense layer, no bias — equivalent to a weighted dot product.
// Weights encode the same domain intuitions as the previous hand-crafted
// coefficients; in production they would be trained on real click-through data.
const _scoringModel = (() => {
  const m = tf.sequential();
  m.add(tf.layers.dense({ units: 1, useBias: false, inputShape: [5] }));
  m.setWeights([tf.tensor2d([[0.35], [0.25], [0.20], [0.10], [0.10]])]);
  return m;
})();

function predictScore(catS: number, distS: number, typS: number, priS: number, urgS: number): number {
  const input = tf.tensor2d([[catS, distS, typS, priS, urgS]]);
  const output = _scoringModel.predict(input) as tf.Tensor;
  const score = output.dataSync()[0];
  tf.dispose([input, output]);
  return score;
}

export type RecommendationTier = 'hot' | 'warm' | 'normal';

export interface ListingScore {
  listingId: string;
  score: number;            // 0–1
  tier: RecommendationTier;
  reason: string;           // human-readable, shown in popup
}

// ---------------------------------------------------------------------------
// Time decay
// w(t) = e^(-λ * hours_since_view)   λ = 0.1  →  half-life ≈ 7 hours
// ---------------------------------------------------------------------------
const LAMBDA = 0.1;

export function timeDecayWeight(timestamp: number): number {
  const hoursSince = (Date.now() - timestamp) / (1000 * 60 * 60);
  return Math.exp(-LAMBDA * Math.max(0, hoursSince));
}

// ---------------------------------------------------------------------------
// Individual signal scores
// ---------------------------------------------------------------------------

/** How well the listing's categories match what the user has clicked before. */
export function computeCategoryScore(listing: Listing, views: ViewEvent[]): number {
  if (views.length === 0) return 0;

  const weights: Record<string, number> = {};
  let totalWeight = 0;

  for (const view of views) {
    const w = timeDecayWeight(view.timestamp);
    totalWeight += w;
    for (const cat of view.categories) {
      weights[cat] = (weights[cat] ?? 0) + w;
    }
  }

  if (totalWeight === 0) return 0;

  const matchWeight = listing.category.reduce(
    (sum, cat) => sum + (weights[cat] ?? 0),
    0
  );

  const maxPossible =
    Math.max(...Object.values(weights)) * listing.category.length;

  return maxPossible > 0 ? Math.min(1, matchWeight / maxPossible) : 0;
}

/** How comfortable the listing's distance is relative to the user's travel history. */
export function computeDistanceScore(
  listing: Listing,
  views: ViewEvent[],
  userLat: number | null,
  userLng: number | null
): number {
  const dist =
    userLat !== null && userLng !== null
      ? haversineDistance(userLat, userLng, listing.latitude, listing.longitude)
      : listing.distance;

  if (views.length === 0) return dist < 2 ? 0.8 : 0.3;

  const weights = views.map((v) => timeDecayWeight(v.timestamp));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return 0.5;

  const weightedMean =
    views.reduce((sum, v, i) => sum + v.distance * weights[i], 0) / totalWeight;

  // Use 1.5× mean as the "willing to stretch" radius
  const comfortMax = weightedMean * 1.5;

  if (dist <= weightedMean) return 1.0;
  if (dist <= comfortMax)
    return 0.5 + 0.5 * (1 - (dist - weightedMean) / (comfortMax - weightedMean));
  return Math.max(0, 0.5 * (1 - (dist - comfortMax) / comfortMax));
}

/** Whether the listing's type (store/private) matches the user's preference. */
export function computeTypeScore(
  listing: Listing,
  views: ViewEvent[]
): number {
  if (views.length === 0) return 0.5;

  let storeW = 0;
  let totalW = 0;
  for (const view of views) {
    const w = timeDecayWeight(view.timestamp);
    totalW += w;
    if (view.type === 'store') storeW += w;
  }

  const storeRatio = totalW > 0 ? storeW / totalW : 0.5;
  const raw = listing.type === 'store' ? storeRatio : 1 - storeRatio;
  // Floor at 0.3 so non-preferred type isn't brutally penalised
  return 0.3 + 0.7 * raw;
}

/** Whether the listing's price matches the user's price sensitivity. */
export function computePriceScore(
  listing: Listing,
  views: ViewEvent[]
): number {
  if (views.length === 0) return listing.price === 0 ? 0.7 : 0.5;

  let freeW = 0;
  let totalW = 0;
  for (const view of views) {
    const w = timeDecayWeight(view.timestamp);
    totalW += w;
    if (view.price === 0) freeW += w;
  }

  const freeRatio = totalW > 0 ? freeW / totalW : 0.5;
  return listing.price === 0
    ? 0.5 + 0.5 * freeRatio
    : Math.max(0.2, 0.5 - 0.3 * freeRatio);
}

/** Time-pressure bonus: expiring soon items are surfaced higher. */
export function computeUrgencyScore(listing: Listing): number {
  const hoursLeft =
    (listing.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < 0) return 0;
  if (hoursLeft < 2) return 1.0;
  if (hoursLeft < 4) return 0.8;
  if (hoursLeft < 8) return 0.5;
  if (hoursLeft < 24) return 0.3;
  return 0.1;
}

// ---------------------------------------------------------------------------
// Primary export
// ---------------------------------------------------------------------------

const MIN_VIEWS = 3;        // need at least this many events to activate
const HOT_THRESHOLD = 0.65;
const WARM_THRESHOLD = 0.45;

function buildReason(cat: number, dist: number, type: number): string {
  const parts: string[] = [];
  if (cat >= 0.55) parts.push('passende Kategorie');
  if (dist >= 0.75) parts.push('in deiner Nähe');
  if (type >= 0.75) parts.push('bevorzugter Anbietertyp');
  return parts.length > 0 ? parts.join(' · ') : 'passt zu deinen Vorlieben';
}

/**
 * Score every listing based on the user's view history.
 * Returns an empty Map when there are fewer than MIN_VIEWS events —
 * the UI should treat all listings as 'normal' in that case.
 */
export function scoreListings(
  listings: Listing[],
  views: ViewEvent[],
  userLat: number | null,
  userLng: number | null
): Map<string, ListingScore> {
  const result = new Map<string, ListingScore>();
  if (views.length < MIN_VIEWS) return result;

  for (const listing of listings) {
    const catS = computeCategoryScore(listing, views);
    const distS = computeDistanceScore(listing, views, userLat, userLng);
    const typS = computeTypeScore(listing, views);
    const priS = computePriceScore(listing, views);
    const urgS = computeUrgencyScore(listing);

    const score = predictScore(catS, distS, typS, priS, urgS);

    const tier: RecommendationTier =
      score >= HOT_THRESHOLD ? 'hot'
      : score >= WARM_THRESHOLD ? 'warm'
      : 'normal';

    result.set(listing.id, {
      listingId: listing.id,
      score: Math.round(score * 100) / 100,
      tier,
      reason: tier !== 'normal' ? buildReason(catS, distS, typS) : '',
    });
  }

  return result;
}
