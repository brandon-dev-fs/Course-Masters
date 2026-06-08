import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ChecklistItem } from '../../api/types.js';

// vi.mock is hoisted — use vi.hoisted() so mock variables are available when factories run
const { checklistApiMock } = vi.hoisted(() => ({
  checklistApiMock: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn(),
  },
}));

vi.mock('../../api/checklist.js', () => ({ checklistApi: checklistApiMock }));

import useChecklist from '../../features/lessons/hooks/useChecklist.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id: 'item-1',
    lessonId: 'lesson-1',
    text: 'Do something',
    checked: false,
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

const LESSON_ID = 'lesson-1';

describe('useChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checklistApiMock.getAll.mockResolvedValue([]);
  });

  describe('initial load', () => {
    it('fetches checklist items on mount', async () => {
      renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(checklistApiMock.getAll).toHaveBeenCalledWith(LESSON_ID));
    });

    it('returns items from the API sorted by order', async () => {
      const items = [
        makeItem({ id: 'item-2', order: 2 }),
        makeItem({ id: 'item-1', order: 1 }),
      ];
      checklistApiMock.getAll.mockResolvedValueOnce(items);

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      expect(result.current.items[0].id).toBe('item-1');
      expect(result.current.items[1].id).toBe('item-2');
    });

    it('starts with loading=true and resolves to loading=false', async () => {
      const { result } = renderHook(() => useChecklist(LESSON_ID));
      expect(result.current.loading).toBe(true);
      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('returns empty items array when API returns empty array', async () => {
      checklistApiMock.getAll.mockResolvedValueOnce([]);
      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.items).toEqual([]);
    });

    it('propagates fetch errors into error state', async () => {
      const { ApiClientError } = await import('../../api/client.js');
      checklistApiMock.getAll.mockRejectedValueOnce(
        new ApiClientError('SERVER_ERROR', 'Server error', undefined, 'server'),
      );

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('addItem', () => {
    it('calls checklistApi.create with lessonId and text', async () => {
      const created = makeItem({ id: 'item-new', text: 'New task', order: 1 });
      checklistApiMock.create.mockResolvedValueOnce(created);

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addItem('New task');
      });

      expect(checklistApiMock.create).toHaveBeenCalledWith(LESSON_ID, 'New task');
    });

    it('appends the created item to the list', async () => {
      const existing = makeItem({ id: 'item-1', order: 1 });
      const created = makeItem({ id: 'item-2', text: 'New task', order: 2 });
      checklistApiMock.getAll.mockResolvedValueOnce([existing]);
      checklistApiMock.create.mockResolvedValueOnce(created);

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      await act(async () => {
        await result.current.addItem('New task');
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items.some(i => i.id === 'item-2')).toBe(true);
    });

    it('sorts items by order after adding', async () => {
      const existing = makeItem({ id: 'item-3', order: 3 });
      const created = makeItem({ id: 'item-1', order: 1 });
      checklistApiMock.getAll.mockResolvedValueOnce([existing]);
      checklistApiMock.create.mockResolvedValueOnce(created);

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      await act(async () => {
        await result.current.addItem('First task');
      });

      expect(result.current.items[0].id).toBe('item-1');
      expect(result.current.items[1].id).toBe('item-3');
    });
  });

  describe('toggleItem', () => {
    it('calls checklistApi.update with itemId and checked value', async () => {
      const item = makeItem({ id: 'item-1', checked: false });
      checklistApiMock.getAll.mockResolvedValueOnce([item]);
      checklistApiMock.update.mockResolvedValueOnce({ ...item, checked: true });

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      await act(async () => {
        await result.current.toggleItem('item-1', true);
      });

      expect(checklistApiMock.update).toHaveBeenCalledWith('item-1', { checked: true });
    });

    it('optimistically updates the item checked state', async () => {
      const item = makeItem({ id: 'item-1', checked: false });
      checklistApiMock.getAll.mockResolvedValueOnce([item]);
      // Hold the update so we can check optimistic state
      let resolveUpdate!: (value: ChecklistItem) => void;
      checklistApiMock.update.mockReturnValueOnce(
        new Promise<ChecklistItem>(res => { resolveUpdate = res; }),
      );

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      act(() => {
        void result.current.toggleItem('item-1', true);
      });

      // Optimistic update should have flipped checked
      expect(result.current.items[0].checked).toBe(true);

      // Cleanup
      await act(async () => { resolveUpdate({ ...item, checked: true }); });
    });

    it('updates the item with the server response', async () => {
      const item = makeItem({ id: 'item-1', checked: false });
      const updated = makeItem({ id: 'item-1', checked: true, updatedAt: '2024-06-01T00:00:00Z' });
      checklistApiMock.getAll.mockResolvedValueOnce([item]);
      checklistApiMock.update.mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      await act(async () => {
        await result.current.toggleItem('item-1', true);
      });

      expect(result.current.items[0].updatedAt).toBe('2024-06-01T00:00:00Z');
    });

    it('rolls back optimistic update on API failure', async () => {
      const item = makeItem({ id: 'item-1', checked: false });
      checklistApiMock.getAll.mockResolvedValueOnce([item]);
      checklistApiMock.update.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      await act(async () => {
        await result.current.toggleItem('item-1', true);
      });

      expect(result.current.items[0].checked).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('deleteItem', () => {
    it('calls checklistApi.delete with the itemId', async () => {
      const item = makeItem({ id: 'item-1' });
      checklistApiMock.getAll.mockResolvedValueOnce([item]);
      checklistApiMock.delete.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      await act(async () => {
        await result.current.deleteItem('item-1');
      });

      expect(checklistApiMock.delete).toHaveBeenCalledWith('item-1');
    });

    it('removes the item from the list', async () => {
      const item = makeItem({ id: 'item-1' });
      checklistApiMock.getAll.mockResolvedValueOnce([item]);
      checklistApiMock.delete.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      await act(async () => {
        await result.current.deleteItem('item-1');
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('sets deletingItemId during the delete operation', async () => {
      const item = makeItem({ id: 'item-1' });
      checklistApiMock.getAll.mockResolvedValueOnce([item]);
      let resolveDelete!: () => void;
      checklistApiMock.delete.mockReturnValueOnce(
        new Promise<void>(res => { resolveDelete = res; }),
      );

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      act(() => {
        void result.current.deleteItem('item-1');
      });

      expect(result.current.deletingItemId).toBe('item-1');

      // Cleanup
      await act(async () => { resolveDelete(); });
      expect(result.current.deletingItemId).toBeNull();
    });

    it('rolls back removal and sets error on API failure', async () => {
      const item = makeItem({ id: 'item-1' });
      checklistApiMock.getAll.mockResolvedValueOnce([item]);
      checklistApiMock.delete.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      await act(async () => {
        await result.current.deleteItem('item-1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('return shape', () => {
    it('exposes all expected return fields', async () => {
      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current).toHaveProperty('items');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('addItem');
      expect(result.current).toHaveProperty('toggleItem');
      expect(result.current).toHaveProperty('updateItemText');
      expect(result.current).toHaveProperty('deleteItem');
      expect(result.current).toHaveProperty('moveItem');
      expect(result.current).toHaveProperty('deletingItemId');
    });

    it('error is null initially when fetch succeeds', async () => {
      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBeNull();
    });

    it('deletingItemId is null initially', async () => {
      const { result } = renderHook(() => useChecklist(LESSON_ID));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.deletingItemId).toBeNull();
    });
  });
});
