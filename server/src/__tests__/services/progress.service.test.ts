import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Prisma } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import {
  computeCourseProgress,
  computeUnitProgress,
  fetchCourseProgressData,
  fetchUnitProgressData,
} from '../../services/progress.service.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

// ── Types ────────────────────────────────────────────────────────────────────

type CourseProgressData = Prisma.CourseGetPayload<{
  include: {
    units: {
      where: { deletedAt: null };
      include: {
        lessons: {
          where: { deletedAt: null };
          include: {
            assessment: {
              where: { type: 'lesson_quiz' };
              include: { attempts: true };
            };
          };
        };
        assessment: {
          where: { type: 'unit_quiz' };
          include: { attempts: true };
        };
      };
    };
    assessment: {
      where: { type: 'course_exam' };
      include: { attempts: true };
    };
  };
}>;

type UnitProgressData = Prisma.UnitGetPayload<{
  include: {
    lessons: {
      where: { deletedAt: null };
      include: {
        assessment: {
          where: { type: 'lesson_quiz' };
          include: { attempts: true };
        };
      };
    };
    assessment: {
      where: { type: 'unit_quiz' };
      include: { attempts: true };
    };
  };
}>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAttempt(passed: boolean, score = passed ? 1 : 0) {
  return {
    id: 'attempt-1',
    assessmentId: 'a-1',
    userId: 'user-1',
    score,
    passed,
    createdAt: new Date(),
  };
}

function makeLesson(id: string, passed?: boolean) {
  return {
    id,
    unitId: 'unit-1',
    title: `Lesson ${id}`,
    description: 'Test description',
    objective: '',
    planContent: {},
    order: 1,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assessment: passed !== undefined
      ? {
          id: `assessment-${id}`,
          type: 'lesson_quiz' as const,
          lessonId: id,
          unitId: null,
          courseId: null,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          attempts: [makeAttempt(passed)],
        }
      : null,
  };
}

function makeUnit(id: string, lessons: ReturnType<typeof makeLesson>[], unitQuizPassed?: boolean) {
  return {
    id,
    courseId: 'course-1',
    title: `Unit ${id}`,
    description: 'Test description',
    order: 1,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lessons,
    assessment: unitQuizPassed !== undefined
      ? {
          id: `unit-assessment-${id}`,
          type: 'unit_quiz' as const,
          lessonId: null,
          unitId: id,
          courseId: null,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          attempts: [makeAttempt(unitQuizPassed)],
        }
      : null,
  };
}

function makeCourseData(
  units: ReturnType<typeof makeUnit>[],
  examPassed?: boolean,
): CourseProgressData {
  return {
    id: 'course-1',
    title: 'Test Course',
    description: 'Test Course',
    syllabus: null,
    authorId: 'user-1',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    units,
    assessment: examPassed !== undefined
      ? {
          id: 'exam-1',
          type: 'course_exam' as const,
          lessonId: null,
          unitId: null,
          courseId: 'course-1',
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          attempts: [makeAttempt(examPassed, examPassed ? 0.9 : 0.5)],
        }
      : null,
  } as CourseProgressData;
}

// ── computeCourseProgress tests ───────────────────────────────────────────────

describe('computeCourseProgress', () => {
  it('returns 0% progress when there are no lessons and no exam', () => {
    const data = makeCourseData([makeUnit('u-1', [])]);

    const result = computeCourseProgress(data);

    expect(result.percentComplete).toBe(0);
    expect(result.completedLessons).toBe(0);
    expect(result.totalLessons).toBe(0);
  });

  it('calculates lesson progress as Math.round((completed/total) * 90)', () => {
    // 1 out of 2 lessons passed = 50% → Math.round(0.5 * 90) = 45
    const unit = makeUnit('u-1', [
      makeLesson('l-1', true),
      makeLesson('l-2', false),
    ]);
    const data = makeCourseData([unit]);

    const result = computeCourseProgress(data);

    expect(result.percentComplete).toBe(Math.round(0.5 * 90));
    expect(result.completedLessons).toBe(1);
    expect(result.totalLessons).toBe(2);
  });

  it('maxes at 90% when all lessons complete but exam not passed', () => {
    const unit = makeUnit('u-1', [
      makeLesson('l-1', true),
      makeLesson('l-2', true),
    ]);
    const data = makeCourseData([unit], false);

    const result = computeCourseProgress(data);

    // 2/2 = 100% × 90 = 90
    expect(result.percentComplete).toBe(90);
    expect(result.examPassed).toBe(false);
  });

  it('caps at 100% when course exam is passed', () => {
    const unit = makeUnit('u-1', [makeLesson('l-1', true)]);
    const data = makeCourseData([unit], true);

    const result = computeCourseProgress(data);

    expect(result.percentComplete).toBe(100);
    expect(result.examPassed).toBe(true);
  });

  it('returns 100% when exam passed even if not all lessons complete', () => {
    const unit = makeUnit('u-1', [
      makeLesson('l-1', true),
      makeLesson('l-2', false),
    ]);
    const data = makeCourseData([unit], true);

    const result = computeCourseProgress(data);

    expect(result.percentComplete).toBe(100);
    expect(result.examPassed).toBe(true);
  });

  it('returns examScore from last attempt when exam exists', () => {
    const unit = makeUnit('u-1', []);
    const data = makeCourseData([unit], true);

    const result = computeCourseProgress(data);

    expect(result.examScore).not.toBeNull();
  });

  it('returns null examScore when no exam exists', () => {
    const data = makeCourseData([makeUnit('u-1', [])]);

    const result = computeCourseProgress(data);

    expect(result.examScore).toBeNull();
  });

  it('counts completed units correctly', () => {
    // Unit is complete when all lessons passed AND unit quiz passed
    const unit = makeUnit('u-1', [makeLesson('l-1', true)], true);
    const data = makeCourseData([unit]);

    const result = computeCourseProgress(data);

    expect(result.completedUnits).toBe(1);
    expect(result.totalUnits).toBe(1);
  });

  it('unit is not complete when lessons pass but unit quiz fails', () => {
    const unit = makeUnit('u-1', [makeLesson('l-1', true)], false);
    const data = makeCourseData([unit]);

    const result = computeCourseProgress(data);

    expect(result.completedUnits).toBe(0);
  });

  it('lesson without quiz is counted as incomplete (never passed)', () => {
    // Lesson with no quiz → assessment is null → attempts undefined → passed false
    const unit = makeUnit('u-1', [{ ...makeLesson('l-1'), assessment: null }]);
    const data = makeCourseData([unit]);

    const result = computeCourseProgress(data);

    expect(result.completedLessons).toBe(0);
  });

  it('includes per-lesson progress in unit status', () => {
    const lesson = makeLesson('l-1', true);
    const unit = makeUnit('u-1', [lesson]);
    const data = makeCourseData([unit]);

    const result = computeCourseProgress(data);

    expect(result.units[0].lessons[0]).toMatchObject({
      lessonId: 'l-1',
      hasQuiz: true,
      attempted: true,
      quizPassed: true,
    });
  });

  it('lesson with no quiz has hasQuiz: false', () => {
    const lesson = { ...makeLesson('l-1'), assessment: null };
    const unit = makeUnit('u-1', [lesson]);
    const data = makeCourseData([unit]);

    const result = computeCourseProgress(data);

    expect(result.units[0].lessons[0].hasQuiz).toBe(false);
  });
});

// ── computeUnitProgress tests ─────────────────────────────────────────────────

describe('computeUnitProgress', () => {
  function makeUnitData(
    lessons: ReturnType<typeof makeLesson>[],
    unitQuizPassed?: boolean,
  ): UnitProgressData {
    return {
      id: 'unit-1',
      courseId: 'course-1',
      title: 'Unit 1',
      description: 'Test description',
      order: 1,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lessons,
      assessment: unitQuizPassed !== undefined
        ? {
            id: 'unit-assessment-1',
            type: 'unit_quiz' as const,
            lessonId: null,
            unitId: 'unit-1',
            courseId: null,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            attempts: [makeAttempt(unitQuizPassed)],
          }
        : null,
    } as UnitProgressData;
  }

  it('returns 0% when no lessons', () => {
    const data = makeUnitData([]);

    const result = computeUnitProgress(data);

    expect(result.percentComplete).toBe(0);
    expect(result.totalLessons).toBe(0);
    expect(result.completedLessons).toBe(0);
  });

  it('calculates percentComplete as Math.round((completed/total) * 100)', () => {
    const data = makeUnitData([
      makeLesson('l-1', true),
      makeLesson('l-2', false),
    ]);

    const result = computeUnitProgress(data);

    expect(result.percentComplete).toBe(50);
    expect(result.completedLessons).toBe(1);
    expect(result.totalLessons).toBe(2);
  });

  it('returns testPassed: true when unit quiz is passed', () => {
    const data = makeUnitData([], true);

    const result = computeUnitProgress(data);

    expect(result.testPassed).toBe(true);
  });

  it('returns testPassed: false when unit quiz is not passed', () => {
    const data = makeUnitData([], false);

    const result = computeUnitProgress(data);

    expect(result.testPassed).toBe(false);
  });

  it('returns testPassed: false when no unit quiz exists', () => {
    const data = makeUnitData([]);

    const result = computeUnitProgress(data);

    expect(result.testPassed).toBe(false);
  });

  it('returns per-lesson progress details', () => {
    const data = makeUnitData([makeLesson('l-1', true)]);

    const result = computeUnitProgress(data);

    expect(result.lessons).toEqual([
      expect.objectContaining({
        lessonId: 'l-1',
        hasQuiz: true,
        attempted: true,
        quizPassed: true,
      }),
    ]);
  });
});

// ── fetchCourseProgressData tests ─────────────────────────────────────────────

describe('fetchCourseProgressData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NotFoundError when course does not exist', async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);

    await expect(fetchCourseProgressData('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
  });
});

// ── fetchUnitProgressData tests ───────────────────────────────────────────────

describe('fetchUnitProgressData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NotFoundError when unit does not exist', async () => {
    prismaMock.unit.findFirst.mockResolvedValue(null);

    await expect(fetchUnitProgressData('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
  });
});
