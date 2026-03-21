import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react';

interface ResourceApi<T, C, U> {
  create: (data: C) => Promise<T>;
  update: (id: string, data: U) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

export default function useResourceList<T extends { id: string }, C, U>(
  fetchAll: () => Promise<T[]>,
  api: ResourceApi<T, C, U>,
  key: string,
  sort?: (a: T, b: T) => number,
): {
  items: T[];
  loading: boolean;
  error: string;
  showAdd: boolean;
  setShowAdd: Dispatch<SetStateAction<boolean>>;
  editing: T | null;
  setEditing: Dispatch<SetStateAction<T | null>>;
  deleting: T | null;
  setDeleting: Dispatch<SetStateAction<T | null>>;
  setItems: Dispatch<SetStateAction<T[]>>;
  handleAdd: (data: C) => Promise<void>;
  handleUpdate: (data: U) => Promise<void>;
  handleDelete: () => Promise<void>;
} {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const fetchRef = useRef(fetchAll);
  fetchRef.current = fetchAll;

  const applySort = (list: T[]) => (sort ? [...list].sort(sort) : list);

  useEffect(() => {
    fetchRef.current()
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [key]);

  async function handleAdd(data: C) {
    const created = await api.create(data);
    setItems(prev => applySort([...prev, created]));
    setShowAdd(false);
  }

  async function handleUpdate(data: U) {
    if (!editing) return;
    const updated = await api.update(editing.id, data);
    setItems(prev => applySort(prev.map(item => (item.id === updated.id ? updated : item))));
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    await api.delete(deleting.id);
    setItems(prev => prev.filter(item => item.id !== deleting.id));
    setDeleting(null);
  }

  return {
    items, loading, error,
    showAdd, setShowAdd,
    editing, setEditing,
    deleting, setDeleting,
    setItems,
    handleAdd, handleUpdate, handleDelete,
  };
}
