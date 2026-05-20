import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useDisclosure from '../../hooks/useDisclosure.js';

describe('useDisclosure', () => {
  it('initial state: isOpen is false by default', () => {
    const { result } = renderHook(() => useDisclosure());
    expect(result.current.isOpen).toBe(false);
  });

  it('initial state: isOpen is true when defaultOpen=true is passed', () => {
    const { result } = renderHook(() => useDisclosure(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('open() sets isOpen to true', () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => { result.current.open(); });
    expect(result.current.isOpen).toBe(true);
  });

  it('close() sets isOpen to false', () => {
    const { result } = renderHook(() => useDisclosure(true));
    act(() => { result.current.close(); });
    expect(result.current.isOpen).toBe(false);
  });

  it('toggle() inverts state from false to true', () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => { result.current.toggle(); });
    expect(result.current.isOpen).toBe(true);
  });

  it('toggle() inverts state from true to false', () => {
    const { result } = renderHook(() => useDisclosure(true));
    act(() => { result.current.toggle(); });
    expect(result.current.isOpen).toBe(false);
  });

  it('calling open() twice remains open (idempotent)', () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => {
      result.current.open();
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('calling close() twice remains closed (idempotent)', () => {
    const { result } = renderHook(() => useDisclosure(true));
    act(() => {
      result.current.close();
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });
});
