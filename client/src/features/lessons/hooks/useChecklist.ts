import { useCallback, useEffect, useState } from 'react';

import { checklistApi } from '../../../api/checklist.js';
import type { ChecklistItem } from '../../../api/checklist.js';
import { ApiClientError, classifyError } from '../../../api/client.js';
import useFetch from '../../../hooks/useFetch.js';

export interface UseChecklistReturn {
  items: ChecklistItem[];
  loading: boolean;
  error: string | null;
  addItem: (text: string) => Promise<void>;
  toggleItem: (itemId: string, checked: boolean) => Promise<void>;
  updateItemText: (itemId: string, text: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  moveItem: (itemId: string, direction: 'up' | 'down') => Promise<void>;
  deletingItemId: string | null;
}

export default function useChecklist(lessonId: string): UseChecklistReturn {
  const { data: fetchedItems, loading } = useFetch<ChecklistItem[]>(
    () => checklistApi.getAll(lessonId),
    [lessonId],
  );

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Sync fetched items into local state
  useEffect(() => {
    if (fetchedItems) {
      setItems([...fetchedItems].sort((a, b) => a.order - b.order));
    }
  }, [fetchedItems]);

  const addItem = useCallback(async (text: string) => {
    const created = await checklistApi.create(lessonId, text);
    setItems(prev => [...prev, created].sort((a, b) => a.order - b.order));
  }, [lessonId]);

  const toggleItem = useCallback(async (itemId: string, checked: boolean) => {
    const snapshot = items;
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked } : i));
    try {
      const updated = await checklistApi.update(itemId, { checked });
      setItems(prev => prev.map(i => i.id === itemId ? updated : i));
    } catch (err: unknown) {
      setItems(snapshot);
      setError(err instanceof ApiClientError ? classifyError(err) : 'Something went wrong');
    }
  }, [items]);

  const updateItemText = useCallback(async (itemId: string, text: string) => {
    const snapshot = items;
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, text } : i));
    try {
      const updated = await checklistApi.update(itemId, { text });
      setItems(prev => prev.map(i => i.id === itemId ? updated : i));
    } catch (err: unknown) {
      setItems(snapshot);
      setError(err instanceof ApiClientError ? classifyError(err) : 'Something went wrong');
    }
  }, [items]);

  const deleteItem = useCallback(async (itemId: string) => {
    const snapshot = items;
    setDeletingItemId(itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    try {
      await checklistApi.delete(itemId);
    } catch (err: unknown) {
      setItems(snapshot);
      setError(err instanceof ApiClientError ? classifyError(err) : 'Something went wrong');
    } finally {
      setDeletingItemId(null);
    }
  }, [items]);

  const moveItem = useCallback(async (itemId: string, direction: 'up' | 'down') => {
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === items.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newItems = [...items];
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];

    const snapshot = items;
    setItems(newItems);

    try {
      const itemIds = newItems.map(i => i.id);
      const updated = await checklistApi.reorder(lessonId, itemIds);
      setItems(updated.sort((a, b) => a.order - b.order));
    } catch (err: unknown) {
      setItems(snapshot);
      setError(err instanceof ApiClientError ? classifyError(err) : 'Something went wrong');
    }
  }, [items, lessonId]);

  return {
    items,
    loading,
    error,
    addItem,
    toggleItem,
    updateItemText,
    deleteItem,
    moveItem,
    deletingItemId,
  };
}
