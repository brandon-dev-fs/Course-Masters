import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../mocks/prisma.js';

vi.mock('../../../lib/prisma.js', () => ({ default: prismaMock }));
vi.mock('../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Let tool() act as an identity so we can call execute() directly in tests.
vi.mock('ai', () => ({
  tool: vi.fn().mockImplementation((config) => config),
}));

import { makeGetUserProfileTool } from '../../../agent/tools/getUserProfile.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'user-1';
const NOW = new Date('2026-07-25T10:00:00Z');

function makeUser(overrides: Partial<{ id: string; name: string; role: string; createdAt: Date }> = {}) {
  return {
    id: overrides.id ?? USER_ID,
    name: overrides.name ?? 'Jane Doe',
    role: overrides.role ?? 'student',
    createdAt: overrides.createdAt ?? new Date('2025-01-01T00:00:00Z'),
  };
}

/** A LessonCompletion row as Prisma returns it from the nested select. */
function makeCompletion(lessonId: string, courseId: string, unitDeletedAt: Date | null = null) {
  return {
    lessonId,
    lesson: { unit: { courseId, deletedAt: unitDeletedAt } },
  };
}

/** A Course row as Prisma returns it from course.findMany. */
function makeCourse(id: string, lessonIds: string[]) {
  return {
    id,
    title: `Course ${id}`,
    units: [
      {
        lessons: lessonIds.map((lid) => ({ id: lid })),
      },
    ],
  };
}

/** An AssessmentAttempt row as Prisma returns it. */
function makeAttempt(overrides: {
  score?: number;
  passed?: boolean;
  type?: string;
  courseTitle?: string | null;
  unitTitle?: string | null;
  lessonTitle?: string | null;
  createdAt?: Date;
}) {
  return {
    score: overrides.score ?? 80,
    passed: overrides.passed ?? true,
    createdAt: overrides.createdAt ?? NOW,
    assessment: {
      type: overrides.type ?? 'lesson_quiz',
      course: overrides.courseTitle != null ? { title: overrides.courseTitle } : null,
      unit: overrides.unitTitle != null ? { title: overrides.unitTitle } : null,
      lesson: overrides.lessonTitle != null ? { title: overrides.lessonTitle } : null,
    },
  };
}

type ExecuteFn = () => Promise<{
  user: { name: string; role: string; memberSince: string };
  enrolledCourses: Array<{
    courseId: string;
    title: string;
    completedLessons: number;
    totalLessons: number;
    percentComplete: number;
  }>;
  recentAssessments: Array<{
    type: string;
    contextName: string;
    score: number;
    passed: boolean;
    date: string;
  }>;
}>;

function getExecute(userId = USER_ID): ExecuteFn {
  const tool = makeGetUserProfileTool(userId) as unknown as { execute: ExecuteFn };
  return tool.execute;
}

/** Set up the three parallel queries with sensible defaults. */
function mockQueries({
  completions = [] as ReturnType<typeof makeCompletion>[],
  attempts = [] as ReturnType<typeof makeAttempt>[],
  user = makeUser(),
  courses = [] as ReturnType<typeof makeCourse>[],
} = {}) {
  prismaMock.lessonCompletion.findMany.mockResolvedValue(completions);
  prismaMock.assessmentAttempt.findMany.mockResolvedValue(attempts);
  prismaMock.user.findFirst.mockResolvedValue(user);
  prismaMock.course.findMany.mockResolvedValue(courses);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('makeGetUserProfileTool', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('user field', () => {
    it('returns name, role, and memberSince from the user record', async () => {
      mockQueries({ user: makeUser({ name: 'Alice', role: 'teacher', createdAt: new Date('2024-06-01T00:00:00Z') }) });

      const result = await getExecute()();

      expect(result.user).toEqual({
        name: 'Alice',
        role: 'teacher',
        memberSince: '2024-06-01T00:00:00.000Z',
      });
    });

    it('returns Unknown defaults when user record is not found', async () => {
      prismaMock.lessonCompletion.findMany.mockResolvedValue([]);
      prismaMock.assessmentAttempt.findMany.mockResolvedValue([]);
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.course.findMany.mockResolvedValue([]);

      const result = await getExecute()();

      expect(result.user.name).toBe('Unknown');
      expect(result.user.role).toBe('student');
      expect(result.user.memberSince).toBe('');
    });
  });

  describe('enrolledCourses', () => {
    it('returns empty array when user has no lesson completions', async () => {
      mockQueries();

      const result = await getExecute()();

      expect(result.enrolledCourses).toEqual([]);
      expect(prismaMock.course.findMany).not.toHaveBeenCalled();
    });

    it('computes percentComplete correctly', async () => {
      const completions = [
        makeCompletion('lesson-1', 'course-1'),
        makeCompletion('lesson-2', 'course-1'),
      ];
      // course-1 has 4 lessons total, user completed 2
      const courses = [makeCourse('course-1', ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4'])];

      mockQueries({ completions, courses });

      const result = await getExecute()();

      expect(result.enrolledCourses).toHaveLength(1);
      expect(result.enrolledCourses[0]).toMatchObject({
        courseId: 'course-1',
        completedLessons: 2,
        totalLessons: 4,
        percentComplete: 50,
      });
    });

    it('returns percentComplete 0 when course has no lessons', async () => {
      const completions = [makeCompletion('lesson-1', 'course-1')];
      const courses = [{ id: 'course-1', title: 'Empty Course', units: [] }];

      mockQueries({ completions, courses });

      const result = await getExecute()();

      expect(result.enrolledCourses[0].percentComplete).toBe(0);
      expect(result.enrolledCourses[0].totalLessons).toBe(0);
    });

    it('returns percentComplete 100 when all lessons are completed', async () => {
      const completions = [
        makeCompletion('l-1', 'course-1'),
        makeCompletion('l-2', 'course-1'),
      ];
      const courses = [makeCourse('course-1', ['l-1', 'l-2'])];

      mockQueries({ completions, courses });

      const result = await getExecute()();

      expect(result.enrolledCourses[0].percentComplete).toBe(100);
    });

    it('deduplicates courses when user has multiple completions in the same course', async () => {
      const completions = [
        makeCompletion('l-1', 'course-1'),
        makeCompletion('l-2', 'course-1'),
        makeCompletion('l-3', 'course-1'),
      ];
      const courses = [makeCourse('course-1', ['l-1', 'l-2', 'l-3'])];

      mockQueries({ completions, courses });

      const result = await getExecute()();

      expect(result.enrolledCourses).toHaveLength(1);
    });

    it('handles multiple courses', async () => {
      const completions = [
        makeCompletion('l-1', 'course-1'),
        makeCompletion('l-a', 'course-2'),
      ];
      const courses = [
        makeCourse('course-1', ['l-1']),
        makeCourse('course-2', ['l-a', 'l-b']),
      ];

      mockQueries({ completions, courses });

      const result = await getExecute()();

      expect(result.enrolledCourses).toHaveLength(2);
      expect(result.enrolledCourses.find((c) => c.courseId === 'course-1')?.percentComplete).toBe(100);
      expect(result.enrolledCourses.find((c) => c.courseId === 'course-2')?.percentComplete).toBe(50);
    });
  });

  describe('soft-delete filtering', () => {
    it('excludes completions whose unit has been soft-deleted', async () => {
      const completions = [
        makeCompletion('l-1', 'course-1'),                              // active unit
        makeCompletion('l-2', 'course-deleted', new Date('2026-01-01')), // deleted unit
      ];
      const courses = [makeCourse('course-1', ['l-1'])];

      mockQueries({ completions, courses });

      const result = await getExecute()();

      // Only course-1 should appear; course-deleted is excluded
      expect(result.enrolledCourses).toHaveLength(1);
      expect(result.enrolledCourses[0].courseId).toBe('course-1');

      // course.findMany should only be called with course-1
      expect(prismaMock.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { in: ['course-1'] } }),
        }),
      );
    });

    it('returns empty enrolledCourses when all completions are in deleted units', async () => {
      const completions = [
        makeCompletion('l-1', 'course-gone', new Date('2026-01-01')),
      ];

      mockQueries({ completions });

      const result = await getExecute()();

      expect(result.enrolledCourses).toHaveLength(0);
      expect(prismaMock.course.findMany).not.toHaveBeenCalled();
    });
  });

  describe('recentAssessments', () => {
    it('returns assessment attempts formatted correctly', async () => {
      const attempts = [
        makeAttempt({
          score: 85,
          passed: true,
          type: 'lesson_quiz',
          lessonTitle: 'Variables',
          createdAt: NOW,
        }),
      ];

      mockQueries({ attempts });

      const result = await getExecute()();

      expect(result.recentAssessments).toHaveLength(1);
      expect(result.recentAssessments[0]).toEqual({
        type: 'lesson_quiz',
        contextName: 'Variables',
        score: 85,
        passed: true,
        date: NOW.toISOString(),
      });
    });

    it('uses course title as contextName for course_exam', async () => {
      const attempts = [
        makeAttempt({ type: 'course_exam', courseTitle: 'Intro to Python', lessonTitle: null, unitTitle: null }),
      ];

      mockQueries({ attempts });

      const result = await getExecute()();

      expect(result.recentAssessments[0].contextName).toBe('Intro to Python');
    });

    it('falls back to unit title when course title is null', async () => {
      const attempts = [
        makeAttempt({ type: 'unit_quiz', courseTitle: null, unitTitle: 'Unit 2', lessonTitle: null }),
      ];

      mockQueries({ attempts });

      const result = await getExecute()();

      expect(result.recentAssessments[0].contextName).toBe('Unit 2');
    });

    it('falls back to lesson title when course and unit titles are null', async () => {
      const attempts = [
        makeAttempt({ type: 'lesson_quiz', courseTitle: null, unitTitle: null, lessonTitle: 'Lesson 3' }),
      ];

      mockQueries({ attempts });

      const result = await getExecute()();

      expect(result.recentAssessments[0].contextName).toBe('Lesson 3');
    });

    it('falls back to Unknown when all title fields are null', async () => {
      const attempts = [
        makeAttempt({ courseTitle: null, unitTitle: null, lessonTitle: null }),
      ];

      mockQueries({ attempts });

      const result = await getExecute()();

      expect(result.recentAssessments[0].contextName).toBe('Unknown');
    });

    it('returns empty array when user has no assessment attempts', async () => {
      mockQueries();

      const result = await getExecute()();

      expect(result.recentAssessments).toEqual([]);
    });

    it('queries attempts ordered by createdAt desc, limited to 20', async () => {
      mockQueries();

      await getExecute()();

      expect(prismaMock.assessmentAttempt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      );
    });
  });

  describe('query scoping', () => {
    it('scopes all queries to the provided userId', async () => {
      const targetUserId = 'specific-user-99';
      mockQueries();

      await getExecute(targetUserId)();

      expect(prismaMock.lessonCompletion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: targetUserId } }),
      );
      expect(prismaMock.assessmentAttempt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: targetUserId } }),
      );
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: targetUserId } }),
      );
    });
  });
});
