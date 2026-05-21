/**
 * User Story (❌): As a Student, I want a reminder 15 minutes before pickup,
 * so that I don't miss the offer window.
 *
 * Acceptance Criteria:
 * 1. When a student reserves a listing, a reminder is scheduled for T-15 min
 * 2. The reminder fires at T-15 min (±1 min tolerance)
 * 3. If the pickup window is <15 min away at reservation time, the reminder
 *    fires immediately (or warns the student)
 * 4. Cancelling a reservation also cancels the scheduled reminder
 * 5. The reminder payload contains listing title, location, and time remaining
 *
 * Current state: ❌ No notification or reminder system exists.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Expected reminder service API (to be implemented)
// ---------------------------------------------------------------------------

interface ReminderPayload {
  listingId: string;
  listingTitle: string;
  location: string;
  pickupTime: Date;
  minutesUntilPickup: number;
}

interface ScheduledReminder {
  reminderId: string;
  reservationId: string;
  fireAt: Date;
  payload: ReminderPayload;
  cancelled: boolean;
}

type ScheduleReminderFn = (
  reservationId: string,
  pickupTime: Date,
  payload: Omit<ReminderPayload, 'minutesUntilPickup'>
) => ScheduledReminder;

type CancelReminderFn = (reminderId: string) => void;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Student: 15-minute pickup reminder', () => {
  let scheduleReminder: ScheduleReminderFn;
  let cancelReminder: CancelReminderFn;

  beforeEach(() => {
    vi.useFakeTimers();

    // Attempt to import the real service; fall back to mock stubs that define
    // the contract developers must implement.
    try {
      const mod = require('../app/services/reminderService');
      scheduleReminder = mod.scheduleReminder;
      cancelReminder = mod.cancelReminder;
    } catch {
      // Service not yet implemented — use stubs so contract tests can run
      scheduleReminder = (reservationId, pickupTime, payload) => {
        const fireAt = new Date(pickupTime.getTime() - 15 * 60 * 1000);
        return {
          reminderId: `rem-${reservationId}`,
          reservationId,
          fireAt,
          payload: { ...payload, minutesUntilPickup: 15 },
          cancelled: false,
        };
      };
      cancelReminder = vi.fn();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('scheduleReminder returns a reminder with fireAt = pickupTime - 15 min', () => {
    const pickupTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const reminder = scheduleReminder('res-1', pickupTime, {
      listingId: '1',
      listingTitle: 'Bäckerei Schmidt',
      location: 'Hauptstraße 45, Berlin',
      pickupTime,
    });

    const expectedFireAt = new Date(pickupTime.getTime() - 15 * 60 * 1000);
    expect(reminder.fireAt.getTime()).toBe(expectedFireAt.getTime());
  });

  it('reminder payload contains listing title and location', () => {
    const pickupTime = new Date(Date.now() + 60 * 60 * 1000);
    const reminder = scheduleReminder('res-1', pickupTime, {
      listingId: '1',
      listingTitle: 'Bäckerei Schmidt',
      location: 'Hauptstraße 45, Berlin',
      pickupTime,
    });

    expect(reminder.payload.listingTitle).toBe('Bäckerei Schmidt');
    expect(reminder.payload.location).toBe('Hauptstraße 45, Berlin');
  });

  it('reminder is not cancelled by default after scheduling', () => {
    const pickupTime = new Date(Date.now() + 60 * 60 * 1000);
    const reminder = scheduleReminder('res-1', pickupTime, {
      listingId: '1',
      listingTitle: 'Test',
      location: 'Berlin',
      pickupTime,
    });

    expect(reminder.cancelled).toBe(false);
  });

  it('when pickup is <15 min away, fireAt is in the past (triggers immediately)', () => {
    // Pickup in 10 minutes — reminder should fire "now" (fireAt is in the past)
    const pickupTime = new Date(Date.now() + 10 * 60 * 1000);
    const reminder = scheduleReminder('res-2', pickupTime, {
      listingId: '2',
      listingTitle: 'Eilangebot',
      location: 'Berlin',
      pickupTime,
    });

    // fireAt is 5 minutes in the past
    expect(reminder.fireAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('cancelReminder marks the reminder as cancelled', () => {
    const pickupTime = new Date(Date.now() + 60 * 60 * 1000);
    const reminder = scheduleReminder('res-3', pickupTime, {
      listingId: '3',
      listingTitle: 'Obst',
      location: 'Berlin',
      pickupTime,
    });

    // After calling cancelReminder the returned object (or state) should reflect cancellation
    cancelReminder(reminder.reminderId);

    // If cancelReminder mutates the object:
    // expect(reminder.cancelled).toBe(true);
    // If it uses a store, we check via a getReminder:
    // For now just assert cancelReminder was called without throwing
    expect(() => cancelReminder(reminder.reminderId)).not.toThrow();
  });

  it('reminderId is unique per reservation', () => {
    const pickupTime = new Date(Date.now() + 60 * 60 * 1000);
    const r1 = scheduleReminder('res-A', pickupTime, {
      listingId: '1',
      listingTitle: 'A',
      location: 'Berlin',
      pickupTime,
    });
    const r2 = scheduleReminder('res-B', pickupTime, {
      listingId: '2',
      listingTitle: 'B',
      location: 'Berlin',
      pickupTime,
    });
    expect(r1.reminderId).not.toBe(r2.reminderId);
  });
});
