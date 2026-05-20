import { act, renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ApiClientError } from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';

describe('useFetch', () => {
  describe('successful fetch', () => {
    it('sets loading=true initially, then loading=false with data on resolution', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ id: '1', title: 'Test' });
      const { result } = renderHook(() => useFetch(fetchFn, []));

      // Immediately after mount, loading should be true
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data).toEqual({ id: '1', title: 'Test' });
      expect(result.current.error).toBe('');
    });

    it('calls fetchFn exactly once on initial mount', async () => {
      const fetchFn = vi.fn().mockResolvedValue([]);
      renderHook(() => useFetch(fetchFn, []));

      await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
    });
  });

  describe('failed fetch', () => {
    it('sets error string via classifyError when fetchFn rejects with ApiClientError (server class)', async () => {
      const fetchFn = vi.fn().mockRejectedValue(
        new ApiClientError('SERVER_ERROR', 'Something broke', undefined, 'server'),
      );
      const { result } = renderHook(() => useFetch(fetchFn, []));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('A server error occurred. Please try again later.');
      expect(result.current.data).toBeNull();
    });

    it('sets error string via classifyError when fetchFn rejects with ApiClientError (client class)', async () => {
      const fetchFn = vi.fn().mockRejectedValue(
        new ApiClientError('VALIDATION_ERROR', 'Bad input', undefined, 'client'),
      );
      const { result } = renderHook(() => useFetch(fetchFn, []));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('The request was invalid. Please check your input and try again.');
      expect(result.current.data).toBeNull();
    });

    it('sets error string via classifyError when fetchFn rejects with ApiClientError (network class)', async () => {
      const fetchFn = vi.fn().mockRejectedValue(
        new ApiClientError('NETWORK_ERROR', 'Network request failed', undefined, 'network'),
      );
      const { result } = renderHook(() => useFetch(fetchFn, []));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('Could not connect to the server. Please check your network connection.');
      expect(result.current.data).toBeNull();
    });

    it('sets generic error string when fetchFn rejects with a plain Error', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('unexpected'));
      const { result } = renderHook(() => useFetch(fetchFn, []));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('Failed to load');
      expect(result.current.data).toBeNull();
    });
  });

  describe('reload', () => {
    it('calling reload() re-invokes fetchFn a second time', async () => {
      const fetchFn = vi.fn().mockResolvedValue([]);
      const { result } = renderHook(() => useFetch(fetchFn, []));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchFn).toHaveBeenCalledTimes(1);

      act(() => { result.current.reload(); });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it('reload() clears error and resolves new data on success', async () => {
      const fetchFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('first failure'))
        .mockResolvedValueOnce({ id: '2' });

      const { result } = renderHook(() => useFetch(fetchFn, []));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe('Failed to load');

      act(() => { result.current.reload(); });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('');
      expect(result.current.data).toEqual({ id: '2' });
    });
  });

  describe('cancellation on unmount', () => {
    it('does not update state when unmounted before fetch resolves (cancelled=true branch)', async () => {
      let resolveIt!: (value: object) => void;
      const fetchFn = vi.fn().mockReturnValue(
        new Promise<object>(r => { resolveIt = r; }),
      );
      const { unmount } = renderHook(() => useFetch(fetchFn, []));
      unmount(); // mark cancelled=true before the promise resolves
      resolveIt({ id: '1' }); // resolving now hits `if (!cancelled)` false branch
      await new Promise(r => setTimeout(r, 20));
      expect(fetchFn).toHaveBeenCalledOnce();
    });

    it('does not update state when unmounted before fetch rejects (cancelled=true in catch)', async () => {
      let rejectIt!: (err: unknown) => void;
      const fetchFn = vi.fn().mockReturnValue(
        new Promise<object>((_, r) => { rejectIt = r; }),
      );
      const { unmount } = renderHook(() => useFetch(fetchFn, []));
      unmount();
      rejectIt(new Error('too late'));
      await new Promise(r => setTimeout(r, 20));
      expect(fetchFn).toHaveBeenCalledOnce();
    });
  });

  describe('dependency change', () => {
    it('re-fetches when a dep value changes', async () => {
      const fetchFn = vi.fn().mockResolvedValue([]);
      let dep = 'a';
      const { result, rerender } = renderHook(() => useFetch(fetchFn, [dep]));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchFn).toHaveBeenCalledTimes(1);

      dep = 'b';
      rerender();
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it('does not re-fetch when a dep value stays the same', async () => {
      const fetchFn = vi.fn().mockResolvedValue([]);
      const dep = 'a';
      const { result, rerender } = renderHook(() => useFetch(fetchFn, [dep]));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Rerender with same dep value — should not trigger another fetch
      rerender();
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });
});
