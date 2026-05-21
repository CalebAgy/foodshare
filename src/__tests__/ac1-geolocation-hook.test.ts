/**
 * AC-1: useGeolocation hook returns { latitude, longitude, error, loading, permissionState }
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from '../app/hooks/useGeolocation';

const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

describe('AC-1: useGeolocation hook', () => {
  beforeEach(() => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('initial state is idle with no coordinates', () => {
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.permissionState).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('exposes a requestLocation function', () => {
    const { result } = renderHook(() => useGeolocation());
    expect(typeof result.current.requestLocation).toBe('function');
  });

  it('sets loading=true and permissionState=loading while waiting', () => {
    mockGeolocation.getCurrentPosition.mockImplementation(() => {
      // never resolves — simulates pending state
    });
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestLocation());
    expect(result.current.loading).toBe(true);
    expect(result.current.permissionState).toBe('loading');
  });

  it('sets latitude, longitude, permissionState=success on success', () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success: PositionCallback) => {
      success({ coords: { latitude: 52.4573, longitude: 13.5315 } } as GeolocationPosition);
    });
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestLocation());
    expect(result.current.latitude).toBe(52.4573);
    expect(result.current.longitude).toBe(13.5315);
    expect(result.current.loading).toBe(false);
    expect(result.current.permissionState).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('sets permissionState=denied when user denies', () => {
    mockGeolocation.getCurrentPosition.mockImplementation(
      (_: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, message: 'User denied Geolocation' } as GeolocationPositionError);
      }
    );
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestLocation());
    expect(result.current.permissionState).toBe('denied');
    expect(result.current.loading).toBe(false);
    expect(result.current.latitude).toBeNull();
  });

  it('sets permissionState=unavailable when geolocation times out', () => {
    mockGeolocation.getCurrentPosition.mockImplementation(
      (_: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 3, message: 'Timeout' } as GeolocationPositionError);
      }
    );
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestLocation());
    expect(result.current.permissionState).toBe('unavailable');
  });

  it('sets permissionState=unavailable when navigator.geolocation is absent', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestLocation());
    expect(result.current.permissionState).toBe('unavailable');
  });
});
