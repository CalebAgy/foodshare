/**
 * TF.js recommendation model — training, persistence, and reset.
 *
 * Covers:
 *   - scoreListings gating (MIN_VIEWS = 3)
 *   - trainOnBehavior happy path and no-op when views < 3
 *   - localStorage persistence via saveModel / loadSavedModel
 *   - resetModel restores default weights
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  trainOnBehavior,
  saveModel,
  loadSavedModel,
  resetModel,
  scoreListings,
} from '../app/utils/recommendationEngine';
import { mockListings } from '../app/data/mockListings';
import type { ViewEvent } from '../app/hooks/useUserBehavior';

function makeView(listingId: string): ViewEvent {
  const listing = mockListings.find((l) => l.id === listingId)!;
  return {
    listingId,
    timestamp: Date.now(),
    distance: listing.distance,
    categories: listing.category,
    type: listing.type,
    price: listing.price,
  };
}

const THREE_VIEWS = ['1', '2', '3'].map(makeView);
// 5 positives, 1 negative (listing '6') — clear signal for direction tests
const FIVE_VIEWS = ['1', '2', '3', '4', '5'].map(makeView);

describe('scoreListings — gating and output shape', () => {
  beforeEach(() => {
    resetModel();
    localStorage.clear();
  });

  it('returns an empty map when views < MIN_VIEWS (3)', () => {
    const scores = scoreListings(mockListings, ['1', '2'].map(makeView), null, null);
    expect(scores.size).toBe(0);
  });

  it('returns exactly one entry per listing when views >= 3', () => {
    const scores = scoreListings(mockListings, THREE_VIEWS, null, null);
    expect(scores.size).toBe(mockListings.length);
  });

  it('all scores are in the [0, 1] range', () => {
    const scores = scoreListings(mockListings, THREE_VIEWS, null, null);
    for (const { score } of scores.values()) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it('every entry has a valid tier (hot | warm | normal)', () => {
    const scores = scoreListings(mockListings, THREE_VIEWS, null, null);
    for (const { tier } of scores.values()) {
      expect(['hot', 'warm', 'normal']).toContain(tier);
    }
  });

  it('hot listings have score >= 0.65', () => {
    const scores = scoreListings(mockListings, THREE_VIEWS, null, null);
    for (const { score, tier } of scores.values()) {
      if (tier === 'hot') expect(score).toBeGreaterThanOrEqual(0.65);
    }
  });
});

describe('trainOnBehavior', () => {
  beforeEach(() => {
    resetModel();
    localStorage.clear();
  });

  it('resolves without error when views < 3 (no training)', async () => {
    await expect(
      trainOnBehavior(mockListings, ['1', '2'].map(makeView), null, null)
    ).resolves.toBeUndefined();
  });

  it('resolves without error given 3+ views', async () => {
    await expect(
      trainOnBehavior(mockListings, THREE_VIEWS, null, null)
    ).resolves.toBeUndefined();
  });

  it('writes model weights to localStorage after training', async () => {
    await trainOnBehavior(mockListings, THREE_VIEWS, null, null);
    const keys = Object.keys(localStorage);
    expect(keys.some((k) => k.includes('foodshare-scoring-model'))).toBe(true);
  });

  it('training measurably changes the model output (fit() mutates weights)', async () => {
    const before = scoreListings(mockListings, FIVE_VIEWS, null, null);

    await trainOnBehavior(mockListings, FIVE_VIEWS, null, null);

    const after = scoreListings(mockListings, FIVE_VIEWS, null, null);

    // A genuine trainable model updates its weights, so at least one listing's
    // score must move after a fit() pass — a static formula could never do this.
    const changed = mockListings.some((l) => {
      const b = before.get(l.id)?.score ?? 0;
      const a = after.get(l.id)?.score ?? 0;
      return Math.abs(a - b) > 0.01;
    });
    expect(changed).toBe(true);
  });
});

describe('loadSavedModel / saveModel — localStorage persistence', () => {
  beforeEach(() => {
    resetModel();
    localStorage.clear();
  });

  it('returns false when no model has been saved', async () => {
    expect(await loadSavedModel()).toBe(false);
  });

  it('returns true after saveModel has been called', async () => {
    await saveModel();
    expect(await loadSavedModel()).toBe(true);
  });

  it('loaded model continues to score listings correctly', async () => {
    await saveModel();
    await loadSavedModel();
    const scores = scoreListings(mockListings, THREE_VIEWS, null, null);
    expect(scores.size).toBe(mockListings.length);
  });
});

describe('resetModel', () => {
  beforeEach(() => {
    resetModel();
    localStorage.clear();
  });

  it('scoreListings still returns full results after a reset', () => {
    resetModel();
    expect(scoreListings(mockListings, THREE_VIEWS, null, null).size).toBe(mockListings.length);
  });

  it('model can be trained again after a reset', async () => {
    await trainOnBehavior(mockListings, THREE_VIEWS, null, null);
    resetModel();
    await expect(
      trainOnBehavior(mockListings, THREE_VIEWS, null, null)
    ).resolves.toBeUndefined();
  });

  it('reset restores default weights after training shifted them', async () => {
    const defaultScores = scoreListings(mockListings, FIVE_VIEWS, null, null);

    // Train to shift weights away from the defaults
    await trainOnBehavior(mockListings, FIVE_VIEWS, null, null);
    const trainedScores = scoreListings(mockListings, FIVE_VIEWS, null, null);

    // Reset back to default weights
    resetModel();
    const resetScores = scoreListings(mockListings, FIVE_VIEWS, null, null);

    // Training must have shifted at least one score away from default
    const trainingChangedSomething = mockListings.some((l) =>
      Math.abs((trainedScores.get(l.id)?.score ?? 0) - (defaultScores.get(l.id)?.score ?? 0)) > 0.01
    );
    expect(trainingChangedSomething).toBe(true);

    // Reset must restore every score back to its default value
    for (const l of mockListings) {
      const resetScore = resetScores.get(l.id)?.score ?? 0;
      const defaultScore = defaultScores.get(l.id)?.score ?? 0;
      expect(Math.abs(resetScore - defaultScore)).toBeLessThan(0.02);
    }
  });
});
