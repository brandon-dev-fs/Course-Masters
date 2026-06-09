import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClientError } from '../../api/client.js';
import useResourceList from '../../hooks/useResourceList.js';

interface TestItem {
  id: string;
  name: string;
  order: number;
}

function makeItem(overrides: Partial<TestItem> = {}): TestItem {
  return { id: 'item-1', name: 'Item 1', order: 1, ...overrides };
}

function makeApi() {
  return {
    create: vi.fn<(data: Partial<TestItem>) => Promise<TestItem>>(),
    update: vi.fn<(id: string, data: Partial<TestItem>) => Promise<TestItem>>(),
    delete: vi.fn<(id: string) => Promise<void>>(),
  };
}

describe('useResourceList', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('initial fetch', () => {
    it('starts with loading=true', () => {
      const fetchAll = vi.fn().mockResolvedValue([]);
      const { result } = renderHook(() =>
        useResourceList(fetchAll, makeApi(), 'key-1'),
      );
      expect(result.current.loading).toBe(true);
    });

    it('calls fetchAll on mount', async () => {
      const fetchAll = vi.fn().mockResolvedValue([]);
      renderHook(() => useResourceList(fetchAll, makeApi(), 'key-1'));
      await waitFor(() => expect(fetchAll).toHaveBeenCalledTimes(1));
    });

    it('populates items after fetch', async () => {
      const items = [makeItem()];
      const fetchAll = vi.fn().mockResolvedValue(items);
      const { result } = renderHook(() =>
        useResourceList(fetchAll, makeApi(), 'key-1'),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));
      expect(result.current.items[0]).toEqual(items[0]);
    });

    it('sets loading=false after fetch completes', async () => {
      const fetchAll = vi.fn().mockResolvedValue([]);
      const { result } = renderHook(() =>
        useResourceList(fetchAll, makeApi(), 'key-1'),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('sets error when fetch fails with ApiClientError', async () => {
      const fetchAll = vi.fn().mockRejectedValue(
        new ApiClientError('SERVER_ERROR', 'Server error', undefined, 'server'),
      );
      const { result } = renderHook(() =>
        useResourceList(fetchAll, makeApi(), 'key-1'),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).not.toBe('');
    });

    it('sets generic error when fetch fails with plain Error', async () => {
      const fetchAll = vi.fn().mockRejectedValue(new Error('unexpected'));
      const { result } = renderHook(() =>
        useResourceList(fetchAll, makeApi(), 'key-1'),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe('Failed to load');
    });

    it('re-fetches when key changes', async () => {
      const fetchAll = vi.fn().mockResolvedValue([]);
      let key = 'key-1';
      const { result, rerender } = renderHook(() =>
        useResourceList(fetchAll, makeApi(), key),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchAll).toHaveBeenCalledTimes(1);

      key = 'key-2';
      rerender();
      await waitFor(() => expect(fetchAll).toHaveBeenCalledTimes(2));
    });

    it('accepts a sort function (applied on add/update, not initial fetch)', async () => {
      const fetched = [
        makeItem({ id: 'b', order: 2 }),
        makeItem({ id: 'a', order: 1 }),
      ];
      const fetchAll = vi.fn().mockResolvedValue(fetched);
      const sort = (a: TestItem, b: TestItem) => a.order - b.order;
      const { result } = renderHook(() =>
        useResourceList(fetchAll, makeApi(), 'key-1', sort),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      // Initial fetch preserves server order; sort fn is applied on handleAdd/handleUpdate
      expect(result.current.items[0].id).toBe('b');
      expect(result.current.items[1].id).toBe('a');
    });
  });

  describe('initial UI state', () => {
    it('showAdd is false initially', () => {
      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([]), makeApi(), 'key-1'),
      );
      expect(result.current.showAdd).toBe(false);
    });

    it('editing is null initially', () => {
      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([]), makeApi(), 'key-1'),
      );
      expect(result.current.editing).toBeNull();
    });

    it('deleting is null initially', () => {
      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([]), makeApi(), 'key-1'),
      );
      expect(result.current.deleting).toBeNull();
    });

    it('setShowAdd changes showAdd state', () => {
      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([]), makeApi(), 'key-1'),
      );
      act(() => { result.current.setShowAdd(true); });
      expect(result.current.showAdd).toBe(true);
    });

    it('setEditing changes editing state', () => {
      const item = makeItem();
      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([item]), makeApi(), 'key-1'),
      );
      act(() => { result.current.setEditing(item); });
      expect(result.current.editing).toEqual(item);
    });

    it('setDeleting changes deleting state', () => {
      const item = makeItem();
      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([item]), makeApi(), 'key-1'),
      );
      act(() => { result.current.setDeleting(item); });
      expect(result.current.deleting).toEqual(item);
    });
  });

  describe('handleAdd', () => {
    it('calls api.create with data', async () => {
      const api = makeApi();
      const created = makeItem({ id: 'new-1' });
      api.create.mockResolvedValueOnce(created);

      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([]), api, 'key-1'),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleAdd({ name: 'New Item', order: 1 });
      });

      expect(api.create).toHaveBeenCalledWith({ name: 'New Item', order: 1 });
    });

    it('appends created item to list', async () => {
      const api = makeApi();
      const created = makeItem({ id: 'new-1' });
      api.create.mockResolvedValueOnce(created);

      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([]), api, 'key-1'),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => { await result.current.handleAdd({ name: 'New', order: 1 }); });

      expect(result.current.items).toContainEqual(created);
    });

    it('sets showAdd to false after add', async () => {
      const api = makeApi();
      api.create.mockResolvedValueOnce(makeItem({ id: 'new-1' }));

      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([]), api, 'key-1'),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => { result.current.setShowAdd(true); });
      expect(result.current.showAdd).toBe(true);

      await act(async () => { await result.current.handleAdd({ name: 'New', order: 1 }); });
      expect(result.current.showAdd).toBe(false);
    });
  });

  describe('handleUpdate', () => {
    it('calls api.update with editing id and data', async () => {
      const api = makeApi();
      const existing = makeItem({ id: 'item-1', name: 'Old' });
      const updated = makeItem({ id: 'item-1', name: 'New' });
      api.update.mockResolvedValueOnce(updated);

      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([existing]), api, 'key-1'),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      act(() => { result.current.setEditing(existing); });

      await act(async () => {
        await result.current.handleUpdate({ name: 'New', order: 1 });
      });

      expect(api.update).toHaveBeenCalledWith('item-1', { name: 'New', order: 1 });
    });

    it('replaces item in list after update', async () => {
      const api = makeApi();
      const existing = makeItem({ id: 'item-1', name: 'Old' });
      const updated = makeItem({ id: 'item-1', name: 'New' });
      api.update.mockResolvedValueOnce(updated);

      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([existing]), api, 'key-1'),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      act(() => { result.current.setEditing(existing); });

      await act(async () => {
        await result.current.handleUpdate({ name: 'New', order: 1 });
      });

      expect(result.current.items[0].name).toBe('New');
    });

    it('clears editing after update', async () => {
      const api = makeApi();
      const existing = makeItem();
      api.update.mockResolvedValueOnce(existing);

      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([existing]), api, 'key-1'),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      act(() => { result.current.setEditing(existing); });

      await act(async () => {
        await result.current.handleUpdate({ name: 'Same', order: 1 });
      });

      expect(result.current.editing).toBeNull();
    });

    it('does nothing when editing is null', async () => {
      const api = makeApi();

      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([]), api, 'key-1'),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleUpdate({ name: 'Test', order: 1 });
      });

      expect(api.update).not.toHaveBeenCalled();
    });
  });

  describe('handleDelete', () => {
    it('calls api.delete with deleting id', async () => {
      const api = makeApi();
      const item = makeItem({ id: 'item-1' });
      api.delete.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([item]), api, 'key-1'),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      act(() => { result.current.setDeleting(item); });

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(api.delete).toHaveBeenCalledWith('item-1');
    });

    it('removes item from list after delete', async () => {
      const api = makeApi();
      const item = makeItem({ id: 'item-1' });
      api.delete.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([item]), api, 'key-1'),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      act(() => { result.current.setDeleting(item); });

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('clears deleting after delete', async () => {
      const api = makeApi();
      const item = makeItem();
      api.delete.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([item]), api, 'key-1'),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      act(() => { result.current.setDeleting(item); });

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(result.current.deleting).toBeNull();
    });

    it('does nothing when deleting is null', async () => {
      const api = makeApi();

      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([]), api, 'key-1'),
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(api.delete).not.toHaveBeenCalled();
    });
  });

  describe('setItems', () => {
    it('allows directly replacing items', async () => {
      const { result } = renderHook(() =>
        useResourceList(vi.fn().mockResolvedValue([makeItem()]), makeApi(), 'key-1'),
      );
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      act(() => { result.current.setItems([]); });
      expect(result.current.items).toHaveLength(0);
    });
  });
});
