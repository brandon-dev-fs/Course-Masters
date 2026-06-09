import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';

/**
 * Factory for a matchMedia stub that controls whether the query matches
 * and captures the registered change listeners so tests can trigger them.
 */
function createMatchMediaMock(matches: boolean) {
  const listeners: ((e: MediaQueryListEvent) => void)[] = [];

  const mql = {
    matches,
    addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
      listeners.push(handler);
    }),
    removeEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(handler);
      if (idx !== -1) listeners.splice(idx, 1);
    }),
    /** Simulate a media query change event. */
    triggerChange: (newMatches: boolean) => {
      listeners.forEach(fn => fn({ matches: newMatches } as MediaQueryListEvent));
    },
  };

  return mql;
}

describe('useMediaQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when matchMedia reports a match', () => {
    const mql = createMatchMediaMock(true);
    vi.stubGlobal('matchMedia', vi.fn(() => mql));

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('returns false when matchMedia does not match', () => {
    const mql = createMatchMediaMock(false);
    vi.stubGlobal('matchMedia', vi.fn(() => mql));

    const { result } = renderHook(() => useMediaQuery('(min-width: 1200px)'));
    expect(result.current).toBe(false);
  });

  it('updates value when matchMedia change event fires', () => {
    const mql = createMatchMediaMock(false);
    vi.stubGlobal('matchMedia', vi.fn(() => mql));

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      mql.triggerChange(true);
    });
    expect(result.current).toBe(true);
  });

  it('updates value from true to false when change event fires', () => {
    const mql = createMatchMediaMock(true);
    vi.stubGlobal('matchMedia', vi.fn(() => mql));

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);

    act(() => {
      mql.triggerChange(false);
    });
    expect(result.current).toBe(false);
  });

  it('cleans up event listener on unmount', () => {
    const mql = createMatchMediaMock(true);
    vi.stubGlobal('matchMedia', vi.fn(() => mql));

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(mql.addEventListener).toHaveBeenCalledTimes(1);

    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
