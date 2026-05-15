import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Assignment } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { assignmentService } from '../../services/assignment.service.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

function makeAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: 'assignment-1',
    lessonId: 'lesson-1',
    type: 'note',
    title: 'Test Assignment',
    objective: null,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const LESSON_ID = 'lesson-1';
const ASSIGNMENT_ID = 'assignment-1';
const USER_ID = 'user-1';
const mockLesson = { id: LESSON_ID, title: 'Lesson 1' };

const ASSIGNMENT_WITH_RELATIONS = {
  ...makeAssignment(),
  noteAssignment: null,
  videoAssignment: null,
  readingAssignment: null,
  vocabAssignment: null,
  practiceProblemAssignment: null,
};

describe('assignmentService.findAllByLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findUnique.mockResolvedValue(mockLesson);
    prismaMock.assignmentCompletion.findMany.mockResolvedValue([]);
  });

  it('returns assignments sorted by order', async () => {
    const assignments = [
      { ...ASSIGNMENT_WITH_RELATIONS, order: 1 },
      { ...ASSIGNMENT_WITH_RELATIONS, id: 'assignment-2', order: 2 },
    ];
    prismaMock.assignment.findMany.mockResolvedValue(assignments);

    const result = await assignmentService.findAllByLesson(LESSON_ID, null);

    expect(prismaMock.assignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { order: 'asc' } }),
    );
    expect(result.length).toBe(2);
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(null);

    await expect(assignmentService.findAllByLesson(LESSON_ID, null)).rejects.toThrow(NotFoundError);
  });

  it('includes completion status for each assignment when userId provided', async () => {
    prismaMock.assignment.findMany.mockResolvedValue([ASSIGNMENT_WITH_RELATIONS]);
    prismaMock.assignmentCompletion.findMany.mockResolvedValue([{ assignmentId: ASSIGNMENT_ID }]);

    const result = await assignmentService.findAllByLesson(LESSON_ID, USER_ID);

    expect(result[0].completed).toBe(true);
  });

  it('marks completed as false when no completion exists', async () => {
    prismaMock.assignment.findMany.mockResolvedValue([ASSIGNMENT_WITH_RELATIONS]);
    prismaMock.assignmentCompletion.findMany.mockResolvedValue([]);

    const result = await assignmentService.findAllByLesson(LESSON_ID, USER_ID);

    expect(result[0].completed).toBe(false);
  });

  it('skips completion query when userId is null', async () => {
    prismaMock.assignment.findMany.mockResolvedValue([ASSIGNMENT_WITH_RELATIONS]);

    await assignmentService.findAllByLesson(LESSON_ID, null);

    expect(prismaMock.assignmentCompletion.findMany).not.toHaveBeenCalled();
  });
});

describe('assignmentService.findById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assignmentCompletion.findUnique.mockResolvedValue(null);
  });

  it('returns assignment by id', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(ASSIGNMENT_WITH_RELATIONS);

    const result = await assignmentService.findById(ASSIGNMENT_ID, null);

    expect(result).toMatchObject({ id: ASSIGNMENT_ID });
  });

  it('throws NotFoundError when assignment does not exist', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    await expect(assignmentService.findById(ASSIGNMENT_ID, null)).rejects.toThrow(NotFoundError);
  });
});

describe('assignmentService.remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assignment.findUnique.mockResolvedValue(makeAssignment());
    // tx === prismaMock after mock fix; stub all ops inside the transaction
    prismaMock.assignment.delete.mockResolvedValue(makeAssignment());
    prismaMock.assignment.findMany.mockResolvedValue([]); // remaining after delete
  });

  it('soft-deletes the assignment via transaction when it exists', async () => {
    await expect(assignmentService.remove(ASSIGNMENT_ID)).resolves.toBeUndefined();

    expect(prismaMock.assignment.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ASSIGNMENT_ID } }),
    );
  });

  it('throws NotFoundError when assignment does not exist', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    await expect(assignmentService.remove(ASSIGNMENT_ID)).rejects.toThrow(NotFoundError);
  });
});

describe('assignmentService.markComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assignment.findUnique.mockResolvedValue(ASSIGNMENT_WITH_RELATIONS);
  });

  it('upserts a completion record', async () => {
    const completion = { id: 'comp-1', userId: USER_ID, assignmentId: ASSIGNMENT_ID, completedAt: new Date() };
    prismaMock.assignmentCompletion.upsert.mockResolvedValue(completion);

    const result = await assignmentService.markComplete(ASSIGNMENT_ID, USER_ID);

    expect(prismaMock.assignmentCompletion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_assignmentId: { userId: USER_ID, assignmentId: ASSIGNMENT_ID } },
      }),
    );
    expect(result).toEqual(completion);
  });

  it('throws NotFoundError when assignment does not exist', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    await expect(assignmentService.markComplete(ASSIGNMENT_ID, USER_ID)).rejects.toThrow(NotFoundError);
  });
});

describe('assignmentService.markIncomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assignment.findUnique.mockResolvedValue(ASSIGNMENT_WITH_RELATIONS);
  });

  it('deletes the completion record', async () => {
    const completion = { id: 'comp-1', userId: USER_ID, assignmentId: ASSIGNMENT_ID, completedAt: new Date() };
    prismaMock.assignmentCompletion.findUnique.mockResolvedValue(completion);
    prismaMock.assignmentCompletion.delete.mockResolvedValue(completion);

    await assignmentService.markIncomplete(ASSIGNMENT_ID, USER_ID);

    expect(prismaMock.assignmentCompletion.delete).toHaveBeenCalled();
  });

  it('throws NotFoundError when completion does not exist', async () => {
    prismaMock.assignmentCompletion.findUnique.mockResolvedValue(null);

    await expect(assignmentService.markIncomplete(ASSIGNMENT_ID, USER_ID)).rejects.toThrow(NotFoundError);
  });
});
