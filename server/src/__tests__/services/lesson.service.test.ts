import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Lesson } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { lessonService } from '../../services/lesson.service.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-1',
    unitId: 'unit-1',
    title: 'Test Lesson',
    description: null,
    order: 1,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const UNIT_ID = 'unit-1';
const LESSON_ID = 'lesson-1';
const mockUnit = { id: UNIT_ID, title: 'Unit 1', deletedAt: null };

describe('lessonService.findAllByUnit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.unit.findFirst.mockResolvedValue(mockUnit);
    prismaMock.lesson.findMany.mockResolvedValue([]);
  });

  it('throws NotFoundError when unit does not exist', async () => {
    prismaMock.unit.findFirst.mockResolvedValue(null);

    await expect(lessonService.findAllByUnit(UNIT_ID)).rejects.toThrow(NotFoundError);
  });

  it('returns lessons sorted by order', async () => {
    const lessons = [makeLesson({ order: 1 }), makeLesson({ id: 'lesson-2', order: 2 })];
    prismaMock.lesson.findMany.mockResolvedValue(lessons);

    const result = await lessonService.findAllByUnit(UNIT_ID);

    expect(prismaMock.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { order: 'asc' } }),
    );
    expect(result).toEqual(lessons);
  });

  it('filters out soft-deleted lessons', async () => {
    await lessonService.findAllByUnit(UNIT_ID);

    expect(prismaMock.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      }),
    );
  });
});

describe('lessonService.findById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns lesson when found', async () => {
    const lesson = makeLesson();
    prismaMock.lesson.findFirst.mockResolvedValue(lesson);

    const result = await lessonService.findById(LESSON_ID);

    expect(result).toEqual(lesson);
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findFirst.mockResolvedValue(null);

    await expect(lessonService.findById(LESSON_ID)).rejects.toThrow(NotFoundError);
  });

  it('uses findFirst with deletedAt: null', async () => {
    prismaMock.lesson.findFirst.mockResolvedValue(makeLesson());

    await lessonService.findById(LESSON_ID);

    expect(prismaMock.lesson.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: LESSON_ID, deletedAt: null }),
      }),
    );
  });
});

describe('lessonService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.unit.findFirst.mockResolvedValue(mockUnit);
  });

  it('creates lesson with the provided unitId', async () => {
    const lesson = makeLesson();
    prismaMock.lesson.create.mockResolvedValue(lesson);

    const result = await lessonService.create(UNIT_ID, { title: 'New Lesson', order: 1 });

    expect(prismaMock.lesson.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ unitId: UNIT_ID }),
      }),
    );
    expect(result).toEqual(lesson);
  });

  it('throws NotFoundError when unit does not exist', async () => {
    prismaMock.unit.findFirst.mockResolvedValue(null);

    await expect(lessonService.create(UNIT_ID, { title: 'New Lesson', order: 1 })).rejects.toThrow(NotFoundError);
  });
});

describe('lessonService.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findFirst.mockResolvedValue(makeLesson());
  });

  it('updates lesson and returns updated record', async () => {
    const updated = makeLesson({ title: 'Updated Lesson' });
    prismaMock.lesson.update.mockResolvedValue(updated);

    const result = await lessonService.update(LESSON_ID, { title: 'Updated Lesson' });

    expect(prismaMock.lesson.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: LESSON_ID } }),
    );
    expect(result).toEqual(updated);
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findFirst.mockResolvedValue(null);

    await expect(lessonService.update(LESSON_ID, { title: 'Updated' })).rejects.toThrow(NotFoundError);
  });
});

describe('lessonService.remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findFirst.mockResolvedValue(makeLesson());
  });

  it('completes without error when lesson exists', async () => {
    // The soft-delete runs inside $transaction with a fresh proxy client,
    // so we verify the operation completes successfully without throwing.
    await expect(lessonService.remove(LESSON_ID)).resolves.toBeUndefined();
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findFirst.mockResolvedValue(null);

    await expect(lessonService.remove(LESSON_ID)).rejects.toThrow(NotFoundError);
  });
});
