import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Assignment, Lesson } from '../../api/types.js';
import {
  buildAssignmentItems,
  completionKeyOf,
  nextOrder,
} from '../../features/lessons/hooks/useAssignments.js';

// vi.mock is hoisted — use vi.hoisted() so variables are available when factories run
const { assignmentsApiMock } = vi.hoisted(() => ({
  assignmentsApiMock: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn(),
    complete: vi.fn(),
    uncomplete: vi.fn(),
  },
}));

vi.mock('../../api/assignments.js', () => ({ assignmentsApi: assignmentsApiMock }));

import useAssignments from '../../features/lessons/hooks/useAssignments.js';

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-1',
    title: 'Test Lesson',
    description: 'desc',
    order: 1,
    unitId: 'unit-1',
    objective: '',
    planContent: {},
    ...overrides,
  };
}

function makeAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: 'assign-1',
    lessonId: 'lesson-1',
    order: 1,
    title: 'Assignment 1',
    objective: null,
    type: 'note',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    completed: false,
    bookmark: null,
    noteAssignment: null,
    videoAssignment: null,
    readingAssignment: null,
    vocabAssignment: null,
    practiceProblemAssignment: null,
    fileAssignment: null,
    ...overrides,
  };
}

const defaultParams = {
  lessonId: 'lesson-1' as string | undefined,
  lesson: makeLesson(),
  setActiveStepKey: vi.fn(),
};

// ─── Pure function tests ──────────────────────────────────────────────────────

describe('nextOrder', () => {
  it('returns 1 for an empty array', () => {
    expect(nextOrder([])).toBe(1);
  });

  it('returns max + 1', () => {
    expect(nextOrder([{ order: 1 }, { order: 3 }, { order: 2 }])).toBe(4);
  });
});

describe('buildAssignmentItems', () => {
  it('always includes lessonPlan item first', () => {
    const items = buildAssignmentItems(makeLesson(), []);
    expect(items[0].kind).toBe('lessonPlan');
  });

  it('always includes quiz item last', () => {
    const items = buildAssignmentItems(makeLesson(), []);
    expect(items[items.length - 1].kind).toBe('quiz');
  });

  it('includes assignments sorted by order', () => {
    const assignments = [
      makeAssignment({ id: 'a2', order: 2 }),
      makeAssignment({ id: 'a1', order: 1 }),
    ];
    const items = buildAssignmentItems(makeLesson(), assignments);
    const assignmentItems = items.filter(i => i.kind === 'assignment');
    expect(assignmentItems[0].id).toBe('a1');
    expect(assignmentItems[1].id).toBe('a2');
  });

  it('returns only lessonPlan + quiz when no assignments', () => {
    const items = buildAssignmentItems(makeLesson(), []);
    expect(items).toHaveLength(2);
  });

  it('sets assignmentType on assignment items', () => {
    const assignments = [makeAssignment({ id: 'a1', order: 1, type: 'vocab' })];
    const items = buildAssignmentItems(makeLesson(), assignments);
    const assignmentItem = items.find(i => i.kind === 'assignment');
    expect(assignmentItem?.assignmentType).toBe('vocab');
  });
});

describe('completionKeyOf', () => {
  it('returns lessonId for lessonPlan kind', () => {
    const item = { kind: 'lessonPlan' as const, id: 'lesson-1', key: 'lessonPlan', title: 'Plan', isRequired: true, order: -1 };
    expect(completionKeyOf(item, 'lesson-1')).toBe('lesson-1');
  });

  it('returns item id for assignment kind', () => {
    const item = { kind: 'assignment' as const, id: 'assignment-1', key: 'assignment:assignment-1', title: 'A1', isRequired: true, order: 1 };
    expect(completionKeyOf(item, 'lesson-1')).toBe('assignment-1');
  });

  it('returns null for quiz kind (id is null)', () => {
    const item = { kind: 'quiz' as const, id: null, key: 'quiz', title: 'Quiz', isRequired: true, order: Infinity };
    expect(completionKeyOf(item, 'lesson-1')).toBeNull();
  });
});

// ─── Hook tests ───────────────────────────────────────────────────────────────

describe('useAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assignmentsApiMock.getAll.mockResolvedValue([]);
    assignmentsApiMock.reorder.mockResolvedValue([]);
  });

  describe('initial fetch', () => {
    it('fetches assignments on mount', async () => {
      renderHook(() => useAssignments(defaultParams));
      await waitFor(() => expect(assignmentsApiMock.getAll).toHaveBeenCalledWith('lesson-1'));
    });

    it('populates assignments from fetched data', async () => {
      const assignment = makeAssignment();
      assignmentsApiMock.getAll.mockResolvedValueOnce([assignment]);

      const { result } = renderHook(() => useAssignments(defaultParams));
      await waitFor(() => expect(result.current.assignments).toHaveLength(1));
      expect(result.current.assignments[0]).toEqual(assignment);
    });

    it('returns empty assignments when lessonId is undefined', async () => {
      const { result } = renderHook(() => useAssignments({ ...defaultParams, lessonId: undefined }));
      await waitFor(() => expect(result.current.assignments).toEqual([]));
      expect(assignmentsApiMock.getAll).not.toHaveBeenCalled();
    });
  });

  describe('handleCreateAssignment', () => {
    it('calls assignmentsApi.create with correct arguments', async () => {
      const created = makeAssignment({ id: 'new-1', order: 1 });
      assignmentsApiMock.create.mockResolvedValueOnce(created);

      const params = { ...defaultParams, setActiveStepKey: vi.fn() };
      const { result } = renderHook(() => useAssignments(params));
      await waitFor(() => expect(assignmentsApiMock.getAll).toHaveBeenCalled());

      await act(async () => {
        await result.current.handleCreateAssignment({ title: 'New Assignment', type: 'note', content: {} });
      });

      expect(assignmentsApiMock.create).toHaveBeenCalledWith(
        'lesson-1',
        expect.objectContaining({ title: 'New Assignment', type: 'note' }),
      );
    });

    it('appends created assignment to list', async () => {
      const created = makeAssignment({ id: 'new-1', order: 1 });
      assignmentsApiMock.create.mockResolvedValueOnce(created);

      const { result } = renderHook(() => useAssignments(defaultParams));
      await waitFor(() => expect(assignmentsApiMock.getAll).toHaveBeenCalled());
      // Flush the getAll response so the sync useEffect has committed setAssignments([])
      // before handleCreateAssignment appends. Without this, the fetch response can
      // arrive after create and overwrite [created] back to [].
      await act(async () => {});

      await act(async () => {
        await result.current.handleCreateAssignment({ title: 'New', type: 'note', content: {} });
      });

      expect(result.current.assignments).toContainEqual(created);
    });

    it('sets isAddingAssignment to false after create', async () => {
      const created = makeAssignment();
      assignmentsApiMock.create.mockResolvedValueOnce(created);

      const { result } = renderHook(() => useAssignments(defaultParams));
      await waitFor(() => expect(assignmentsApiMock.getAll).toHaveBeenCalled());

      act(() => { result.current.setIsAddingAssignment(true); });
      expect(result.current.isAddingAssignment).toBe(true);

      await act(async () => {
        await result.current.handleCreateAssignment({ title: 'New', type: 'note', content: {} });
      });

      expect(result.current.isAddingAssignment).toBe(false);
    });
  });

  describe('handleUpdateAssignment', () => {
    it('calls assignmentsApi.update and updates item in list', async () => {
      const existing = makeAssignment({ id: 'a-1', title: 'Old Title' });
      const updated = makeAssignment({ id: 'a-1', title: 'New Title' });
      assignmentsApiMock.getAll.mockResolvedValueOnce([existing]);
      assignmentsApiMock.update.mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useAssignments(defaultParams));
      await waitFor(() => expect(result.current.assignments).toHaveLength(1));

      await act(async () => {
        await result.current.handleUpdateAssignment('a-1', { title: 'New Title' });
      });

      expect(result.current.assignments[0].title).toBe('New Title');
    });

    it('clears editingAssignment after update', async () => {
      const existing = makeAssignment({ id: 'a-1' });
      const updated = makeAssignment({ id: 'a-1', title: 'Updated' });
      assignmentsApiMock.getAll.mockResolvedValueOnce([existing]);
      assignmentsApiMock.update.mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useAssignments(defaultParams));
      await waitFor(() => expect(result.current.assignments).toHaveLength(1));

      act(() => { result.current.setEditingAssignment(existing); });

      await act(async () => {
        await result.current.handleUpdateAssignment('a-1', { title: 'Updated' });
      });

      expect(result.current.editingAssignment).toBeNull();
    });
  });

  describe('handleDeleteAssignment', () => {
    it('calls assignmentsApi.delete and removes item from list', async () => {
      const assignment = makeAssignment({ id: 'a-1' });
      assignmentsApiMock.getAll.mockResolvedValueOnce([assignment]);
      assignmentsApiMock.delete.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAssignments(defaultParams));
      await waitFor(() => expect(result.current.assignments).toHaveLength(1));

      const currentItems = result.current.assignmentItems;
      await act(async () => {
        await result.current.handleDeleteAssignment('a-1', currentItems, 0);
      });

      expect(result.current.assignments).toHaveLength(0);
    });
  });

  describe('handleToggleAssignmentCompletion', () => {
    it('optimistically toggles completed to true', async () => {
      const assignment = makeAssignment({ id: 'a-1', completed: false });
      assignmentsApiMock.getAll.mockResolvedValueOnce([assignment]);
      assignmentsApiMock.complete.mockResolvedValueOnce({ id: 'c-1', userId: 'u', assignmentId: 'a-1', completedAt: '' });

      const { result } = renderHook(() => useAssignments(defaultParams));
      await waitFor(() => expect(result.current.assignments).toHaveLength(1));

      await act(async () => {
        await result.current.handleToggleAssignmentCompletion(assignment);
      });

      expect(result.current.assignments[0].completed).toBe(true);
    });

    it('optimistically toggles completed to false', async () => {
      const assignment = makeAssignment({ id: 'a-1', completed: true });
      assignmentsApiMock.getAll.mockResolvedValueOnce([assignment]);
      assignmentsApiMock.uncomplete.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAssignments(defaultParams));
      await waitFor(() => expect(result.current.assignments).toHaveLength(1));

      await act(async () => {
        await result.current.handleToggleAssignmentCompletion(assignment);
      });

      expect(result.current.assignments[0].completed).toBe(false);
    });

    it('rolls back toggle when API call fails', async () => {
      const assignment = makeAssignment({ id: 'a-1', completed: false });
      assignmentsApiMock.getAll.mockResolvedValueOnce([assignment]);
      assignmentsApiMock.complete.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAssignments(defaultParams));
      await waitFor(() => expect(result.current.assignments).toHaveLength(1));

      await act(async () => {
        await result.current.handleToggleAssignmentCompletion(assignment);
      });

      // Should roll back to original false
      expect(result.current.assignments[0].completed).toBe(false);
    });
  });

  describe('derived state', () => {
    it('completedAssignmentIds contains IDs of completed assignments', async () => {
      const assignment = makeAssignment({ id: 'a-1', completed: true });
      assignmentsApiMock.getAll.mockResolvedValueOnce([assignment]);

      const { result } = renderHook(() => useAssignments(defaultParams));
      await waitFor(() => expect(result.current.assignments).toHaveLength(1));

      expect(result.current.completedAssignmentIds.has('a-1')).toBe(true);
    });

    it('availableTools includes all four panel types', async () => {
      const { result } = renderHook(() => useAssignments(defaultParams));
      await waitFor(() => expect(assignmentsApiMock.getAll).toHaveBeenCalled());

      expect(result.current.availableTools).toEqual(['notes', 'flashcards', 'checklist', 'bookmarks']);
    });

    it('assignmentItems is empty when lesson is null', async () => {
      const { result } = renderHook(() => useAssignments({ ...defaultParams, lesson: null }));
      await waitFor(() => expect(assignmentsApiMock.getAll).toHaveBeenCalled());

      expect(result.current.assignmentItems).toEqual([]);
    });
  });
});
