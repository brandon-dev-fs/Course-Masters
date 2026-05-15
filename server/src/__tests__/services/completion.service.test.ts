import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { completionService } from '../../services/completion.service.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

const LESSON_ID = 'lesson-1';
const UNIT_ID = 'unit-1';
const USER_ID = 'user-1';

const mockLesson = { id: LESSON_ID, title: 'Lesson 1' };
const mockUnit = { id: UNIT_ID, title: 'Unit 1' };
const mockLessonCompletion = {
  id: 'lc-1',
  lessonId: LESSON_ID,
  userId: USER_ID,
  createdAt: new Date(),
};
const mockUnitCompletion = {
  id: 'uc-1',
  unitId: UNIT_ID,
  userId: USER_ID,
  createdAt: new Date(),
};

describe('completionService.markLessonComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findUnique.mockResolvedValue(mockLesson);
  });

  it('upserts lesson completion when lesson exists', async () => {
    prismaMock.lessonCompletion.upsert.mockResolvedValue(mockLessonCompletion);

    const result = await completionService.markLessonComplete(LESSON_ID, USER_ID);

    expect(prismaMock.lessonCompletion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_lessonId: { userId: USER_ID, lessonId: LESSON_ID } },
        create: { userId: USER_ID, lessonId: LESSON_ID },
      }),
    );
    expect(result).toEqual(mockLessonCompletion);
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(null);

    await expect(completionService.markLessonComplete(LESSON_ID, USER_ID)).rejects.toThrow(NotFoundError);
  });

  it('is idempotent — upsert does not fail on re-completion', async () => {
    prismaMock.lessonCompletion.upsert.mockResolvedValue(mockLessonCompletion);

    // Call twice
    await completionService.markLessonComplete(LESSON_ID, USER_ID);
    await completionService.markLessonComplete(LESSON_ID, USER_ID);

    expect(prismaMock.lessonCompletion.upsert).toHaveBeenCalledTimes(2);
  });
});

describe('completionService.removeLessonComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findUnique.mockResolvedValue(mockLesson);
    prismaMock.lessonCompletion.deleteMany.mockResolvedValue({ count: 1 });
  });

  it('deletes lesson completion record', async () => {
    await completionService.removeLessonComplete(LESSON_ID, USER_ID);

    expect(prismaMock.lessonCompletion.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID, lessonId: LESSON_ID } }),
    );
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(null);

    await expect(completionService.removeLessonComplete(LESSON_ID, USER_ID)).rejects.toThrow(NotFoundError);
  });
});

describe('completionService.markUnitComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.unit.findUnique.mockResolvedValue(mockUnit);
  });

  it('upserts unit completion when unit exists', async () => {
    prismaMock.unitCompletion.upsert.mockResolvedValue(mockUnitCompletion);

    const result = await completionService.markUnitComplete(UNIT_ID, USER_ID);

    expect(prismaMock.unitCompletion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_unitId: { userId: USER_ID, unitId: UNIT_ID } },
        create: { userId: USER_ID, unitId: UNIT_ID },
      }),
    );
    expect(result).toEqual(mockUnitCompletion);
  });

  it('throws NotFoundError when unit does not exist', async () => {
    prismaMock.unit.findUnique.mockResolvedValue(null);

    await expect(completionService.markUnitComplete(UNIT_ID, USER_ID)).rejects.toThrow(NotFoundError);
  });
});

describe('completionService.removeUnitComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.unit.findUnique.mockResolvedValue(mockUnit);
    prismaMock.unitCompletion.deleteMany.mockResolvedValue({ count: 1 });
  });

  it('deletes unit completion record', async () => {
    await completionService.removeUnitComplete(UNIT_ID, USER_ID);

    expect(prismaMock.unitCompletion.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID, unitId: UNIT_ID } }),
    );
  });

  it('throws NotFoundError when unit does not exist', async () => {
    prismaMock.unit.findUnique.mockResolvedValue(null);

    await expect(completionService.removeUnitComplete(UNIT_ID, USER_ID)).rejects.toThrow(NotFoundError);
  });
});
