import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock @dnd-kit/core before importing the hook
vi.mock('@dnd-kit/core', () => ({
  PointerSensor: class {},
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn((...sensors: unknown[]) => sensors),
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: (arr: unknown[], from: number, to: number) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  },
}));

import { useDragReorder } from '../../../../features/builder/hooks/useDragReorder.js';
import type { DragEndEvent } from '@dnd-kit/core';

type TestItem = { id: string; order: number; title: string };

const makeItems = (): TestItem[] => [
  { id: 'a', order: 1, title: 'Alpha' },
  { id: 'b', order: 2, title: 'Beta' },
  { id: 'c', order: 3, title: 'Gamma' },
];

function makeDragEndEvent(activeId: string, overId: string | null): DragEndEvent {
  return {
    active: { id: activeId, data: { current: undefined }, rect: { current: { initial: null, translated: null } } },
    over: overId ? { id: overId, data: { current: undefined }, rect: { width: 0, height: 0, left: 0, top: 0, right: 0, bottom: 0 } } : null,
    collisions: [],
    activatorEvent: new Event('pointerdown'),
    delta: { x: 0, y: 0 },
  } as unknown as DragEndEvent;
}

describe('useDragReorder', () => {
  const onReorder = vi.fn().mockResolvedValue(undefined);
  const onRollback = vi.fn();
  const onError = vi.fn();
  const announce = vi.fn();
  const getItemLabel = vi.fn((item: TestItem) => item.title);

  beforeEach(() => {
    vi.clearAllMocks();
    onReorder.mockResolvedValue(undefined);
  });

  it('returns sensors and handleDragEnd', () => {
    const items = makeItems();
    const { result } = renderHook(() =>
      useDragReorder({ items, onReorder, onRollback }),
    );
    expect(result.current.sensors).toBeDefined();
    expect(typeof result.current.handleDragEnd).toBe('function');
  });

  it('is a no-op when over is null', () => {
    const items = makeItems();
    const { result } = renderHook(() =>
      useDragReorder({ items, onReorder, onRollback }),
    );
    act(() => {
      result.current.handleDragEnd(makeDragEndEvent('a', null));
    });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('is a no-op when active.id === over.id', () => {
    const items = makeItems();
    const { result } = renderHook(() =>
      useDragReorder({ items, onReorder, onRollback }),
    );
    act(() => {
      result.current.handleDragEnd(makeDragEndEvent('a', 'a'));
    });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('is a no-op when active item is not found', () => {
    const items = makeItems();
    const { result } = renderHook(() =>
      useDragReorder({ items, onReorder, onRollback }),
    );
    act(() => {
      result.current.handleDragEnd(makeDragEndEvent('x', 'b'));
    });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('calls onReorder with reordered items when items are moved', async () => {
    const items = makeItems();
    const { result } = renderHook(() =>
      useDragReorder({ items, onReorder, onRollback }),
    );
    await act(async () => {
      result.current.handleDragEnd(makeDragEndEvent('a', 'c'));
    });
    expect(onReorder).toHaveBeenCalledTimes(1);
    const [reordered, reorderItems] = onReorder.mock.calls[0] as [TestItem[], Array<{ id: string; order: number }>];
    // After moving 'a' to position of 'c', the order should be updated
    expect(reordered).toHaveLength(3);
    expect(reorderItems).toHaveLength(3);
    // Each item should have updated order values
    reordered.forEach((item, i) => {
      expect(item.order).toBe(i + 1);
    });
  });

  it('calls onRollback on reorder failure', async () => {
    onReorder.mockRejectedValueOnce(new Error('Network error'));
    const items = makeItems();
    const { result } = renderHook(() =>
      useDragReorder({ items, onReorder, onRollback, onError }),
    );
    await act(async () => {
      result.current.handleDragEnd(makeDragEndEvent('a', 'c'));
      // Wait for the promise rejection to be handled
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(onRollback).toHaveBeenCalledTimes(1);
  });

  it('calls onError with message on reorder failure', async () => {
    onReorder.mockRejectedValueOnce(new Error('Network error'));
    const items = makeItems();
    const { result } = renderHook(() =>
      useDragReorder({ items, onReorder, onRollback, onError }),
    );
    await act(async () => {
      result.current.handleDragEnd(makeDragEndEvent('a', 'c'));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(onError).toHaveBeenCalledWith('Reorder failed. The order has been restored.');
  });

  it('calls announce and getItemLabel when provided', async () => {
    const items = makeItems();
    const { result } = renderHook(() =>
      useDragReorder({ items, onReorder, onRollback, announce, getItemLabel }),
    );
    await act(async () => {
      result.current.handleDragEnd(makeDragEndEvent('a', 'c'));
    });
    expect(announce).toHaveBeenCalledTimes(1);
    expect(getItemLabel).toHaveBeenCalled();
    const announceArg = announce.mock.calls[0][0] as string;
    expect(announceArg).toContain('Alpha');
    expect(announceArg).toContain('moved to position');
  });

  it('does not call announce when announce is not provided', async () => {
    const items = makeItems();
    const { result } = renderHook(() =>
      useDragReorder({ items, onReorder, onRollback }),
    );
    await act(async () => {
      result.current.handleDragEnd(makeDragEndEvent('a', 'c'));
    });
    // No error means announce was not called (no mock to assert on)
    expect(onReorder).toHaveBeenCalled();
  });
});
