import { useMemo } from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import type { DragEndEvent, SensorDescriptor, SensorOptions } from '@dnd-kit/core';
import type { ReorderItem } from '../../../api/types.js';

interface UseDragReorderOptions<T extends { id: string; order: number }> {
  items: T[];
  onReorder: (reordered: T[], reorderItems: ReorderItem[]) => Promise<void>;
  onRollback: (snapshot: T[]) => void;
  onError?: (message: string) => void;
  announce?: (message: string) => void;
  getItemLabel?: (item: T) => string;
}

interface UseDragReorderResult {
  sensors: SensorDescriptor<SensorOptions>[];
  handleDragEnd: (event: DragEndEvent) => void;
}

export function useDragReorder<T extends { id: string; order: number }>({
  items,
  onReorder,
  onRollback,
  onError,
  announce,
  getItemLabel,
}: UseDragReorderOptions<T>): UseDragReorderResult {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const snapshot = [...items];
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, i) => ({
      ...item,
      order: i + 1,
    }));
    const reorderItems: ReorderItem[] = reordered.map((item) => ({
      id: item.id,
      order: item.order,
    }));

    if (announce && getItemLabel) {
      const activeItem = items[oldIndex];
      announce(`${getItemLabel(activeItem)} moved to position ${newIndex + 1}`);
    }

    onReorder(reordered, reorderItems).catch(() => {
      onRollback(snapshot);
      onError?.('Reorder failed. The order has been restored.');
    });
  }

  // Memoize sensors — useSensors returns a stable reference anyway
  const memoizedSensors = useMemo(() => sensors, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { sensors: memoizedSensors, handleDragEnd };
}
