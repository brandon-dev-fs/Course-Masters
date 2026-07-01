import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContextMenu } from '../../../../features/builder/hooks/useContextMenu.js';

describe('useContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with isOpen = false', () => {
    const { result } = renderHook(() => useContextMenu());
    expect(result.current.isOpen).toBe(false);
  });

  it('open() sets isOpen to true', () => {
    const { result } = renderHook(() => useContextMenu());
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('close() sets isOpen to false', () => {
    const { result } = renderHook(() => useContextMenu());
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('returns a triggerRef', () => {
    const { result } = renderHook(() => useContextMenu());
    expect(result.current.triggerRef).toBeDefined();
    expect(result.current.triggerRef.current).toBeNull();
  });

  it('Escape key closes the menu when open', () => {
    const { result } = renderHook(() => useContextMenu());
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('Escape key does nothing when menu is closed', () => {
    const { result } = renderHook(() => useContextMenu());
    expect(result.current.isOpen).toBe(false);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('cleans up keydown listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { result, unmount } = renderHook(() => useContextMenu());
    act(() => {
      result.current.open();
    });
    unmount();
    // Should have cleaned up
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it('does not add keydown listener when isOpen is false', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    renderHook(() => useContextMenu());
    // Only mount effect runs — no keydown listener when closed
    const keydownCalls = addEventListenerSpy.mock.calls.filter((c) => c[0] === 'keydown');
    expect(keydownCalls).toHaveLength(0);
    addEventListenerSpy.mockRestore();
  });

  it('open then close then Escape does not reopen', () => {
    const { result } = renderHook(() => useContextMenu());
    act(() => {
      result.current.open();
    });
    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(result.current.isOpen).toBe(false);
  });
});
