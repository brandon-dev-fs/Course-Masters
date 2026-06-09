import { useCallback, useState } from 'react';

export interface OrderedItem {
  id: string;
  order: number;
}

export type PersistFn<T extends OrderedItem> = (
  a: T,
  b: T,
  aNewOrder: number,
  bNewOrder: number,
) => Promise<void>;

interface UseOrderedListResult<T extends OrderedItem> {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  handleMove: (id: string, direction: 'up' | 'down') => Promise<void>;
}

export default function useOrderedList<T extends OrderedItem>(
  initialItems: T[],
  persistFn: PersistFn<T>,
): UseOrderedListResult<T> {
  const [items, setItems] = useState<T[]>(initialItems);

  const handleMove = useCallback(async (id: string, direction: 'up' | 'down') => {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(item => item.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    setItems(prev =>
      prev.map(r =>
        r.id === a.id ? { ...r, order: b.order } :
        r.id === b.id ? { ...r, order: a.order } : r,
      ).sort((x, y) => x.order - y.order),
    );
    try {
      await persistFn(a, b, b.order, a.order);
    } catch {
      setItems(prev =>
        prev.map(r =>
          r.id === a.id ? { ...r, order: a.order } :
          r.id === b.id ? { ...r, order: b.order } : r,
        ).sort((x, y) => x.order - y.order),
      );
    }
  }, [items, persistFn]);

  return { items, setItems, handleMove };
}
