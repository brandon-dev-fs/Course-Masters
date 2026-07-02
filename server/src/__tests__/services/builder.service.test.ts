import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { builderService } from '../../services/builder.service.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

const COURSE_ID = 'course-1';
const UNIT_ID = 'unit-1';
const LESSON_ID = 'lesson-1';

function makeDbCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: COURSE_ID,
    title: 'Course 1',
    description: 'A course',
    assessment: null,
    units: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getOutline
// ---------------------------------------------------------------------------

describe('builderService.getOutline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws NotFoundError when course not found', async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);
    await expect(builderService.getOutline(COURSE_ID)).rejects.toThrow(NotFoundError);
  });

  it('returns outline with empty units and null courseAssessment', async () => {
    prismaMock.course.findFirst.mockResolvedValue(makeDbCourse());
    const result = await builderService.getOutline(COURSE_ID);
    expect(result.course.id).toBe(COURSE_ID);
    expect(result.units).toEqual([]);
    expect(result.courseAssessment).toBeNull();
  });

  it('returns courseAssessment when course has an assessment', async () => {
    const assessment = { id: 'a1', type: 'course_exam', _count: { questions: 5 } };
    prismaMock.course.findFirst.mockResolvedValue(makeDbCourse({ assessment }));
    const result = await builderService.getOutline(COURSE_ID);
    expect(result.courseAssessment).toEqual({ id: 'a1', type: 'course_exam', questionCount: 5 });
  });

  it('returns null unit and lesson assessments when absent', async () => {
    const lesson = { id: LESSON_ID, title: 'Lesson 1', order: 1, objective: '', planContent: {}, assignments: [], assessment: null };
    const unit = { id: UNIT_ID, title: 'Unit 1', description: 'Desc', order: 1, lessons: [lesson], assessment: null };
    prismaMock.course.findFirst.mockResolvedValue(makeDbCourse({ units: [unit] }));
    const result = await builderService.getOutline(COURSE_ID);
    expect(result.units[0].assessment).toBeNull();
    expect(result.units[0].lessons[0].assessment).toBeNull();
  });

  it('maps unit and lesson assessments when both present', async () => {
    const unitAssessment = { id: 'ua1', type: 'unit_quiz', _count: { questions: 3 } };
    const lessonAssessment = { id: 'la1', type: 'lesson_quiz', _count: { questions: 2 } };
    const lesson = { id: LESSON_ID, title: 'Lesson 1', order: 1, objective: '', planContent: {}, assignments: [], assessment: lessonAssessment };
    const unit = { id: UNIT_ID, title: 'Unit 1', description: 'Desc', order: 1, lessons: [lesson], assessment: unitAssessment };
    prismaMock.course.findFirst.mockResolvedValue(makeDbCourse({ units: [unit] }));
    const result = await builderService.getOutline(COURSE_ID);
    expect(result.units[0].assessment).toEqual({ id: 'ua1', type: 'unit_quiz', questionCount: 3 });
    expect(result.units[0].lessons[0].assessment).toEqual({ id: 'la1', type: 'lesson_quiz', questionCount: 2 });
  });

  it('sets hasLessonPlan false when objective is empty and planContent is empty', async () => {
    const lesson = { id: LESSON_ID, title: 'Lesson 1', order: 1, objective: '', planContent: {}, assignments: [], assessment: null };
    const unit = { id: UNIT_ID, title: 'Unit 1', description: 'Desc', order: 1, lessons: [lesson], assessment: null };
    prismaMock.course.findFirst.mockResolvedValue(makeDbCourse({ units: [unit] }));
    const result = await builderService.getOutline(COURSE_ID);
    expect(result.units[0].lessons[0].hasLessonPlan).toBe(false);
  });

  it('sets hasLessonPlan true when objective is non-empty', async () => {
    const lesson = { id: LESSON_ID, title: 'Lesson 1', order: 1, objective: 'Students will learn X', planContent: {}, assignments: [], assessment: null };
    const unit = { id: UNIT_ID, title: 'Unit 1', description: 'Desc', order: 1, lessons: [lesson], assessment: null };
    prismaMock.course.findFirst.mockResolvedValue(makeDbCourse({ units: [unit] }));
    const result = await builderService.getOutline(COURSE_ID);
    expect(result.units[0].lessons[0].hasLessonPlan).toBe(true);
  });

  it('sets hasLessonPlan true when planContent is non-empty', async () => {
    const lesson = { id: LESSON_ID, title: 'Lesson 1', order: 1, objective: '', planContent: { type: 'doc', content: [] }, assignments: [], assessment: null };
    const unit = { id: UNIT_ID, title: 'Unit 1', description: 'Desc', order: 1, lessons: [lesson], assessment: null };
    prismaMock.course.findFirst.mockResolvedValue(makeDbCourse({ units: [unit] }));
    const result = await builderService.getOutline(COURSE_ID);
    expect(result.units[0].lessons[0].hasLessonPlan).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// reorderUnits
// ---------------------------------------------------------------------------

describe('builderService.reorderUnits', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws NotFoundError when course not found', async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);
    await expect(
      builderService.reorderUnits(COURSE_ID, [{ id: UNIT_ID, order: 1 }]),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws AppError when provided IDs do not match course units', async () => {
    prismaMock.course.findFirst.mockResolvedValue({ id: COURSE_ID });
    prismaMock.$transaction.mockImplementation((cb: (tx: unknown) => Promise<unknown>) =>
      cb({ ...prismaMock, $queryRaw: vi.fn().mockResolvedValue([{ id: 'other-unit' }]) }),
    );
    await expect(
      builderService.reorderUnits(COURSE_ID, [{ id: UNIT_ID, order: 1 }]),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('updates unit orders successfully', async () => {
    prismaMock.course.findFirst.mockResolvedValue({ id: COURSE_ID });
    prismaMock.unit.update.mockResolvedValue({} as never);
    prismaMock.$transaction.mockImplementation((cb: (tx: unknown) => Promise<unknown>) =>
      cb({ ...prismaMock, $queryRaw: vi.fn().mockResolvedValue([{ id: UNIT_ID }]) }),
    );
    await expect(
      builderService.reorderUnits(COURSE_ID, [{ id: UNIT_ID, order: 1 }]),
    ).resolves.toBeUndefined();
    expect(prismaMock.unit.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: UNIT_ID }, data: { order: 1 } }),
    );
  });
});

// ---------------------------------------------------------------------------
// reorderLessons
// ---------------------------------------------------------------------------

describe('builderService.reorderLessons', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws NotFoundError when unit not found', async () => {
    prismaMock.unit.findFirst.mockResolvedValue(null);
    await expect(
      builderService.reorderLessons(UNIT_ID, [{ id: LESSON_ID, order: 1 }]),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws AppError when provided IDs do not match unit lessons', async () => {
    prismaMock.unit.findFirst.mockResolvedValue({ id: UNIT_ID });
    prismaMock.$transaction.mockImplementation((cb: (tx: unknown) => Promise<unknown>) =>
      cb({ ...prismaMock, $queryRaw: vi.fn().mockResolvedValue([{ id: 'other-lesson' }]) }),
    );
    await expect(
      builderService.reorderLessons(UNIT_ID, [{ id: LESSON_ID, order: 1 }]),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('updates lesson orders successfully', async () => {
    prismaMock.unit.findFirst.mockResolvedValue({ id: UNIT_ID });
    prismaMock.lesson.update.mockResolvedValue({} as never);
    prismaMock.$transaction.mockImplementation((cb: (tx: unknown) => Promise<unknown>) =>
      cb({ ...prismaMock, $queryRaw: vi.fn().mockResolvedValue([{ id: LESSON_ID }]) }),
    );
    await expect(
      builderService.reorderLessons(UNIT_ID, [{ id: LESSON_ID, order: 1 }]),
    ).resolves.toBeUndefined();
    expect(prismaMock.lesson.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: LESSON_ID }, data: { order: 1 } }),
    );
  });
});
