import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import useOrderedList from '../../hooks/useOrderedList.js';
import type { OrderedItem, PersistFn } from '../../hooks/useOrderedList.js';

interface TestItem extends OrderedItem {
  id: string;
  order: number;
  label: string;
}

const makeItems = (): TestItem[] => [
  { id: 'a', order: 1, label: 'Alpha' },
  { id: 'b', order: 2, label: 'Beta' },
  { id: 'c', order: 3, label: 'Gamma' },
];

describe('useOrderedList', () => {
  let persistFn: Mock<PersistFn<TestItem>>;

  beforeEach(() => {
    vi.clearAllMocks();
    persistFn = vi.fn<PersistFn<TestItem>>().mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('returns items in the order they were passed', () => {
      const items = makeItems();
      const { result } = renderHook(() => useOrderedList(items, persistFn));
      expect(result.current.items).toEqual(items);
    });
  });

  describe('setItems', () => {
    it('replaces list with new items', () => {
      const items = makeItems();
      const { result } = renderHook(() => useOrderedList(items, persistFn));
      const newItems: TestItem[] = [{ id: 'x', order: 1, label: 'Xavier' }];

      act(() => { result.current.setItems(newItems); });
      expect(result.current.items).toEqual(newItems);
    });
  });

  describe('handleMove', () => {
    it('swaps two items order values optimistically when moving up', async () => {
      const items = makeItems();
      const { result } = renderHook(() => useOrderedList(items, persistFn));

      await act(async () => {
        await result.current.handleMove('b', 'up');
      });

      // 'b' should now have order 1 (swapped with 'a') and be first
      const ids = result.current.items.map(i => i.id);
      expect(ids[0]).toBe('b');
      expect(ids[1]).toBe('a');
    });

    it('swaps two items order values optimistically when moving down', async () => {
      const items = makeItems();
      const { result } = renderHook(() => useOrderedList(items, persistFn));

      await act(async () => {
        await result.current.handleMove('a', 'down');
      });

      const ids = result.current.items.map(i => i.id);
      expect(ids[0]).toBe('b');
      expect(ids[1]).toBe('a');
    });

    it('calls persistFn with correct arguments (a, b, aNewOrder, bNewOrder)', async () => {
      const items = makeItems();
      const { result } = renderHook(() => useOrderedList(items, persistFn));

      // Moving 'b' (order=2) up means swapping with 'a' (order=1).
      // a gets aNewOrder = b.order = 2, b gets bNewOrder = a.order = 1.
      await act(async () => {
        await result.current.handleMove('b', 'up');
      });

      expect(persistFn).toHaveBeenCalledTimes(1);
      const [argA, argB, aNewOrder, bNewOrder] = persistFn.mock.calls[0] as [TestItem, TestItem, number, number];
      // 'b' is at idx 1, 'a' is swapIdx 0
      expect(argA.id).toBe('b');
      expect(argB.id).toBe('a');
      expect(aNewOrder).toBe(1); // b gets a's order
      expect(bNewOrder).toBe(2); // a gets b's order
    });

    it('rolls back to previous state when persistFn rejects', async () => {
      const items = makeItems();
      persistFn = vi.fn().mockRejectedValueOnce(new Error('network error'));
      const { result } = renderHook(() => useOrderedList(items, persistFn));

      const before = result.current.items.map(i => i.id);

      await act(async () => {
        await result.current.handleMove('b', 'up');
      });

      await waitFor(() => {
        const after = result.current.items.map(i => i.id);
        expect(after).toEqual(before);
      });
    });

    it('does nothing when moving the first item up', async () => {
      const items = makeItems();
      const { result } = renderHook(() => useOrderedList(items, persistFn));
      const before = result.current.items.map(i => i.id);

      await act(async () => {
        await result.current.handleMove('a', 'up');
      });

      expect(result.current.items.map(i => i.id)).toEqual(before);
      expect(persistFn).not.toHaveBeenCalled();
    });

    it('does nothing when moving the last item down', async () => {
      const items = makeItems();
      const { result } = renderHook(() => useOrderedList(items, persistFn));
      const before = result.current.items.map(i => i.id);

      await act(async () => {
        await result.current.handleMove('c', 'down');
      });

      expect(result.current.items.map(i => i.id)).toEqual(before);
      expect(persistFn).not.toHaveBeenCalled();
    });

    it('returns items in correct order after move (sorted by order field)', async () => {
      const items = makeItems();
      const { result } = renderHook(() => useOrderedList(items, persistFn));

      await act(async () => {
        await result.current.handleMove('b', 'up');
      });

      const orders = result.current.items.map(i => i.order);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    });
  });
});
