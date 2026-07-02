const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../../../api/client.js', () => ({
  apiClient: apiClientMock,
  ApiClientError: class ApiClientError extends Error {
    constructor(public readonly code: string, message: string) { super(message); }
  },
  classifyError: (e: unknown) => e instanceof Error ? e.message : String(e),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBuilderOutline } from '../../../../features/builder/hooks/useBuilderOutline.js';

const baseCourse = { id: 'c1', title: 'My Course' };
const baseOutline = {
  course: baseCourse,
  units: [],
  courseAssessment: null,
};

const makeUnit = (overrides = {}) => ({
  id: 'u1',
  title: 'Unit 1',
  description: 'Desc',
  order: 1,
  lessons: [],
  assessment: null,
  ...overrides,
});

describe('useBuilderOutline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // builder outline fetch
    apiClientMock.get.mockResolvedValue(baseOutline);
  });

  it('starts loading and returns null outline initially', async () => {
    apiClientMock.get.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useBuilderOutline('c1'));
    expect(result.current.loading).toBe(true);
    expect(result.current.outline).toBeNull();
  });

  it('loads outline on mount', async () => {
    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.outline).toEqual(baseOutline);
    });
  });

  it('sets error on fetch failure', async () => {
    apiClientMock.get.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => {
      // Non-ApiClientError falls back to the default message
      expect(result.current.error).toBe('Failed to load course outline.');
      expect(result.current.loading).toBe(false);
    });
  });

  it('reload() re-fetches the outline', async () => {
    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClientMock.get).toHaveBeenCalledTimes(1);
    act(() => {
      result.current.reload();
    });
    await waitFor(() => {
      expect(apiClientMock.get).toHaveBeenCalledTimes(2);
    });
  });

  it('addUnit adds a new unit to the outline', async () => {
    const newUnit = makeUnit();
    apiClientMock.post.mockResolvedValue(newUnit);
    const outlineWithUnit = { ...baseOutline, units: [newUnit] };
    // First call is getOutline, second is createUnit
    apiClientMock.get.mockResolvedValue(baseOutline);
    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addUnit({ title: 'Unit 1', description: 'Desc', order: 1 });
    });

    expect(apiClientMock.post).toHaveBeenCalled();
    expect(result.current.outline?.units).toHaveLength(1);
    expect(result.current.outline?.units[0].id).toBe('u1');
  });

  it('addLesson adds a lesson to the correct unit', async () => {
    const unitInOutline = makeUnit({ lessons: [] });
    apiClientMock.get.mockResolvedValue({ ...baseOutline, units: [unitInOutline] });
    const newLesson = { id: 'l1', title: 'Lesson 1', order: 1 };
    apiClientMock.post.mockResolvedValue(newLesson);

    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addLesson('u1', { title: 'Lesson 1', description: '', order: 1 });
    });

    const unit = result.current.outline?.units.find((u) => u.id === 'u1');
    expect(unit?.lessons).toHaveLength(1);
    expect(unit?.lessons[0].id).toBe('l1');
  });

  it('addActivity adds an activity to the correct lesson', async () => {
    const lesson = { id: 'l1', title: 'Lesson 1', order: 1, hasLessonPlan: false, assignments: [], assessment: null };
    const unit = makeUnit({ lessons: [lesson] });
    apiClientMock.get.mockResolvedValue({ ...baseOutline, units: [unit] });
    const newAssignment = { id: 'a1', title: 'Act 1', type: 'note', order: 1 };
    apiClientMock.post.mockResolvedValue(newAssignment);

    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addActivity('l1', { title: 'Act 1', type: 'note', content: {} });
    });

    const foundLesson = result.current.outline?.units[0].lessons[0];
    expect(foundLesson?.assignments).toHaveLength(1);
    expect(foundLesson?.assignments[0].id).toBe('a1');
  });

  it('renameUnit updates unit title in outline', async () => {
    const unit = makeUnit({ title: 'Old Title' });
    apiClientMock.get.mockResolvedValue({ ...baseOutline, units: [unit] });
    apiClientMock.put.mockResolvedValue({ ...unit, title: 'New Title' });

    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.renameUnit('c1', 'u1', 'New Title');
    });

    expect(result.current.outline?.units[0].title).toBe('New Title');
  });

  it('renameLesson updates lesson title in outline', async () => {
    const lesson = { id: 'l1', title: 'Old Lesson', order: 1, hasLessonPlan: false, assignments: [], assessment: null };
    const unit = makeUnit({ lessons: [lesson] });
    apiClientMock.get.mockResolvedValue({ ...baseOutline, units: [unit] });
    apiClientMock.put.mockResolvedValue({ ...lesson, title: 'New Lesson' });

    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.renameLesson('u1', 'l1', 'New Lesson');
    });

    const foundLesson = result.current.outline?.units[0].lessons[0];
    expect(foundLesson?.title).toBe('New Lesson');
  });

  it('editUnit updates unit data in outline', async () => {
    const unit = makeUnit({ title: 'Old', description: 'Old Desc' });
    apiClientMock.get.mockResolvedValue({ ...baseOutline, units: [unit] });
    apiClientMock.put.mockResolvedValue({ ...unit, title: 'New', description: 'New Desc' });

    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.editUnit('c1', 'u1', { title: 'New', description: 'New Desc', order: 1 });
    });

    expect(result.current.outline?.units[0].title).toBe('New');
    expect(result.current.outline?.units[0].description).toBe('New Desc');
  });

  it('deleteUnit removes the unit from outline', async () => {
    const unit = makeUnit();
    apiClientMock.get.mockResolvedValue({ ...baseOutline, units: [unit] });
    apiClientMock.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteUnit('c1', 'u1');
    });

    expect(result.current.outline?.units).toHaveLength(0);
  });

  it('deleteLesson removes the lesson from the unit', async () => {
    const lesson = { id: 'l1', title: 'Lesson 1', order: 1, hasLessonPlan: false, assignments: [], assessment: null };
    const unit = makeUnit({ lessons: [lesson] });
    apiClientMock.get.mockResolvedValue({ ...baseOutline, units: [unit] });
    apiClientMock.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteLesson('u1', 'l1');
    });

    expect(result.current.outline?.units[0].lessons).toHaveLength(0);
  });

  it('deleteActivity removes the activity from the lesson', async () => {
    const activity = { id: 'a1', title: 'Activity', type: 'note' as const, order: 1 };
    const lesson = { id: 'l1', title: 'Lesson 1', order: 1, hasLessonPlan: false, assignments: [activity], assessment: null };
    const unit = makeUnit({ lessons: [lesson] });
    apiClientMock.get.mockResolvedValue({ ...baseOutline, units: [unit] });
    apiClientMock.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteActivity('a1', 'l1');
    });

    const foundLesson = result.current.outline?.units[0].lessons[0];
    expect(foundLesson?.assignments).toHaveLength(0);
  });

  it('reorderUnits updates units in outline and calls API', async () => {
    const u1 = makeUnit({ id: 'u1', order: 1 });
    const u2 = makeUnit({ id: 'u2', order: 2 });
    apiClientMock.get.mockResolvedValue({ ...baseOutline, units: [u1, u2] });
    apiClientMock.put.mockResolvedValue(undefined);

    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const reordered = [u2, u1];
    const items = [{ id: 'u2', order: 1 }, { id: 'u1', order: 2 }];
    await act(async () => {
      await result.current.reorderUnits('c1', reordered, items);
    });

    expect(result.current.outline?.units[0].id).toBe('u2');
    expect(apiClientMock.put).toHaveBeenCalled();
  });

  it('reorderLessons updates lessons in the correct unit', async () => {
    const l1 = { id: 'l1', title: 'L1', order: 1, hasLessonPlan: false, assignments: [], assessment: null };
    const l2 = { id: 'l2', title: 'L2', order: 2, hasLessonPlan: false, assignments: [], assessment: null };
    const unit = makeUnit({ lessons: [l1, l2] });
    apiClientMock.get.mockResolvedValue({ ...baseOutline, units: [unit] });
    apiClientMock.put.mockResolvedValue(undefined);

    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const reordered = [l2, l1];
    const items = [{ id: 'l2', order: 1 }, { id: 'l1', order: 2 }];
    await act(async () => {
      await result.current.reorderLessons('u1', reordered, items);
    });

    expect(result.current.outline?.units[0].lessons[0].id).toBe('l2');
    expect(apiClientMock.put).toHaveBeenCalled();
  });

  it('reorderActivities updates activities in the correct lesson', async () => {
    const a1 = { id: 'a1', title: 'A1', type: 'note' as const, order: 1 };
    const a2 = { id: 'a2', title: 'A2', type: 'vocab' as const, order: 2 };
    const lesson = { id: 'l1', title: 'Lesson', order: 1, hasLessonPlan: false, assignments: [a1, a2], assessment: null };
    const unit = makeUnit({ lessons: [lesson] });
    apiClientMock.get.mockResolvedValue({ ...baseOutline, units: [unit] });
    apiClientMock.put.mockResolvedValue(undefined);

    const { result } = renderHook(() => useBuilderOutline('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const reordered = [a2, a1];
    await act(async () => {
      await result.current.reorderActivities('l1', reordered, ['a2', 'a1']);
    });

    const foundLesson = result.current.outline?.units[0].lessons[0];
    expect(foundLesson?.assignments[0].id).toBe('a2');
    expect(apiClientMock.put).toHaveBeenCalled();
  });
});
