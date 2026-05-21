import { useState, useCallback } from 'react';

export interface ViewEvent {
  listingId: string;
  timestamp: number;
  distance: number;        // km from user at time of view
  categories: string[];
  type: 'store' | 'private';
  price: number;
}

export interface UserBehavior {
  views: ViewEvent[];
}

const STORAGE_KEY = 'foodshare_behavior';
const MAX_EVENTS = 50;
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // ignore same listing within 5 min

function loadBehavior(): UserBehavior {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UserBehavior;
  } catch {
    // corrupted storage — reset silently
  }
  return { views: [] };
}

function saveBehavior(b: UserBehavior): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
  } catch {
    // storage quota exceeded — ignore
  }
}

export function useUserBehavior() {
  const [behavior, setBehavior] = useState<UserBehavior>(loadBehavior);

  const recordView = useCallback((event: Omit<ViewEvent, 'timestamp'>) => {
    setBehavior((prev) => {
      // Deduplicate: same listing within 5 minutes counts once
      const alreadySeen = prev.views.some(
        (v) =>
          v.listingId === event.listingId &&
          Date.now() - v.timestamp < DEDUP_WINDOW_MS
      );
      if (alreadySeen) return prev;

      const newEvent: ViewEvent = { ...event, timestamp: Date.now() };
      const views = [newEvent, ...prev.views].slice(0, MAX_EVENTS);
      const updated: UserBehavior = { views };
      saveBehavior(updated);
      return updated;
    });
  }, []);

  const clearBehavior = useCallback(() => {
    const empty: UserBehavior = { views: [] };
    saveBehavior(empty);
    setBehavior(empty);
  }, []);

  return { behavior, recordView, clearBehavior };
}
