import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { Lesson, Unit, Course, UnitProgress } from '../../api/types.js';
import { AuthContext } from '../../context/AuthContext.js';
import { makeAuthContext, makeStudentUser, makeTeacherUser } from '../mocks/authContext.mock.js';

// ─── React Router mock ────────────────────────────────────────────────────────

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// ─── API module mocks ─────────────────────────────────────────────────────────
// vi.mock is hoisted — use vi.hoisted() so variables are available when factories run

const { lessonsApiMock, unitsApiMock, coursesApiMock, progressApiMock } = vi.hoisted(() => ({
  lessonsApiMock: {
    getOne: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  unitsApiMock: {
    getAll: vi.fn(),
  },
  coursesApiMock: {
    getOne: vi.fn(),
  },
  progressApiMock: {
    getUnit: vi.fn(),
  },
}));

vi.mock('../../api/lessons.js', () => ({ lessonsApi: lessonsApiMock }));
vi.mock('../../api/units.js', () => ({ unitsApi: unitsApiMock }));
vi.mock('../../api/courses.js', () => ({ coursesApi: coursesApiMock }));
vi.mock('../../api/progress.js', () => ({ progressApi: progressApiMock }));

import useLesson from '../../features/lessons/hooks/useLesson.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

function makeUnit(overrides: Partial<Unit> = {}): Unit {
  return {
    id: 'unit-1',
    title: 'Unit 1',
    description: '',
    order: 1,
    courseId: 'course-1',
    ...overrides,
  };
}

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'course-1',
    title: 'Course Title',
    description: '',
    authorId: 'user-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
  };
}

function makeUnitProgress(overrides: Partial<UnitProgress> = {}): UnitProgress {
  return {
    totalLessons: 3,
    completedLessons: 1,
    testPassed: false,
    percentComplete: 33,
    lessons: [],
    ...overrides,
  };
}

const defaultParams = {
  courseId: 'course-1',
  unitId: 'unit-1',
  lessonId: 'lesson-1',
};

function makeWrapper(user = makeStudentUser()) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter>
        <AuthContext.Provider value={makeAuthContext({ user })}>
          {children}
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };
}

function setupSuccessfulFetch() {
  const lesson = makeLesson();
  const units = [makeUnit()];
  const course = makeCourse();
  const lessons = [lesson];
  const unitProgress = makeUnitProgress();

  lessonsApiMock.getOne.mockResolvedValueOnce(lesson);
  unitsApiMock.getAll.mockResolvedValueOnce(units);
  coursesApiMock.getOne.mockResolvedValueOnce(course);
  lessonsApiMock.getAll.mockResolvedValueOnce(lessons);
  progressApiMock.getUnit.mockResolvedValueOnce(unitProgress);

  return { lesson, units, course, lessons, unitProgress };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial loading state', () => {
    it('loading is true initially', () => {
      setupSuccessfulFetch();
      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });
      expect(result.current.loading).toBe(true);
    });

    it('loading becomes false after fetch resolves', async () => {
      setupSuccessfulFetch();
      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.loading).toBe(false));
    });
  });

  describe('data fetching', () => {
    it('fetches lesson, units, course, and unit lessons in parallel', async () => {
      setupSuccessfulFetch();
      renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });

      await waitFor(() => expect(lessonsApiMock.getOne).toHaveBeenCalled());

      expect(lessonsApiMock.getOne).toHaveBeenCalledWith('unit-1', 'lesson-1');
      expect(unitsApiMock.getAll).toHaveBeenCalledWith('course-1');
      expect(coursesApiMock.getOne).toHaveBeenCalledWith('course-1');
      expect(lessonsApiMock.getAll).toHaveBeenCalledWith('unit-1');
      expect(progressApiMock.getUnit).toHaveBeenCalledWith('course-1', 'unit-1');
    });

    it('sets lesson data in state after fetch', async () => {
      const { lesson } = setupSuccessfulFetch();
      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });

      await waitFor(() => expect(result.current.lesson).toEqual(lesson));
    });

    it('sets courseTitle from fetched course', async () => {
      setupSuccessfulFetch();
      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });

      await waitFor(() => expect(result.current.courseTitle).toBe('Course Title'));
    });

    it('sets units from fetched data', async () => {
      const { units } = setupSuccessfulFetch();
      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });

      await waitFor(() => expect(result.current.units).toEqual(units));
    });

    it('sets unitProgress from fetched data', async () => {
      const { unitProgress } = setupSuccessfulFetch();
      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });

      await waitFor(() => expect(result.current.unitProgress).toEqual(unitProgress));
    });

    it('returns error string when fetch fails', async () => {
      lessonsApiMock.getOne.mockRejectedValueOnce(new Error('Network'));
      unitsApiMock.getAll.mockResolvedValueOnce([]);
      coursesApiMock.getOne.mockResolvedValueOnce(makeCourse());
      lessonsApiMock.getAll.mockResolvedValueOnce([]);
      progressApiMock.getUnit.mockResolvedValueOnce(makeUnitProgress());

      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBeTruthy();
    });

    it('returns empty error string on success', async () => {
      setupSuccessfulFetch();
      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe('');
    });
  });

  describe('handleUpdate', () => {
    it('calls lessonsApi.update with correct arguments', async () => {
      const { lesson } = setupSuccessfulFetch();
      const updated = makeLesson({ title: 'Updated Title' });
      lessonsApiMock.update.mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.lesson).toEqual(lesson));

      await act(async () => {
        await result.current.handleUpdate({ title: 'Updated Title', order: 1 });
      });

      expect(lessonsApiMock.update).toHaveBeenCalledWith(
        'unit-1',
        'lesson-1',
        expect.objectContaining({ title: 'Updated Title' }),
      );
    });

    it('updates lesson state after successful update', async () => {
      const { lesson } = setupSuccessfulFetch();
      const updated = makeLesson({ title: 'Updated Title' });
      lessonsApiMock.update.mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.lesson).toEqual(lesson));

      await act(async () => {
        await result.current.handleUpdate({ title: 'Updated Title', order: 1 });
      });

      expect(result.current.lesson?.title).toBe('Updated Title');
    });
  });

  describe('handleDelete', () => {
    it('calls lessonsApi.delete with correct arguments', async () => {
      const { lesson } = setupSuccessfulFetch();
      lessonsApiMock.delete.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.lesson).toEqual(lesson));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(lessonsApiMock.delete).toHaveBeenCalledWith('unit-1', 'lesson-1');
    });

    it('navigates to course page after successful delete', async () => {
      const { lesson } = setupSuccessfulFetch();
      lessonsApiMock.delete.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.lesson).toEqual(lesson));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(navigateMock).toHaveBeenCalledWith('/courses/course-1');
    });
  });

  describe('handleAddLesson', () => {
    it('calls lessonsApi.create and navigates to new lesson', async () => {
      const { lesson } = setupSuccessfulFetch();
      const newLesson = makeLesson({ id: 'lesson-new', title: 'New Lesson' });
      lessonsApiMock.create.mockResolvedValueOnce(newLesson);

      const { result } = renderHook(() => useLesson(defaultParams), { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.lesson).toEqual(lesson));

      await act(async () => {
        await result.current.handleAddLesson({ title: 'New Lesson', description: '', order: 2 });
      });

      expect(lessonsApiMock.create).toHaveBeenCalledWith('unit-1', expect.objectContaining({ title: 'New Lesson' }));
      expect(navigateMock).toHaveBeenCalledWith('/courses/course-1/units/unit-1/lessons/lesson-new');
    });
  });

  describe('canEdit', () => {
    it('returns true when user is a teacher', async () => {
      setupSuccessfulFetch();
      const { result } = renderHook(() => useLesson(defaultParams), {
        wrapper: makeWrapper(makeTeacherUser()),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.canEdit).toBe(true);
    });

    it('returns false when user is a student', async () => {
      setupSuccessfulFetch();
      const { result } = renderHook(() => useLesson(defaultParams), {
        wrapper: makeWrapper(makeStudentUser()),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.canEdit).toBe(false);
    });
  });
});
