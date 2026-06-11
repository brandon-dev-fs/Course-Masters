import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { resourceCompletionService } from '../../services/resource-completion.service.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

const LESSON_ID = 'lesson-1';
const USER_ID = 'user-1';
const ASSIGNMENT_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('resourceCompletionService.getByLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assignmentCompletion.findMany.mockResolvedValue([]);
  });

  it('returns empty completions when nothing exists', async () => {
    const result = await resourceCompletionService.getByLesson(LESSON_ID, USER_ID);

    expect(result.completions).toEqual([]);
  });

  it('returns assignment completions mapped to completion items', async () => {
    const completedAt = new Date();
    prismaMock.assignmentCompletion.findMany.mockResolvedValue([
      { assignmentId: ASSIGNMENT_ID, completedAt },
    ]);

    const result = await resourceCompletionService.getByLesson(LESSON_ID, USER_ID);

    expect(result.completions).toEqual([
      { assignmentId: ASSIGNMENT_ID, completedAt },
    ]);
  });

  it('queries assignmentCompletion with lesson and user filters', async () => {
    await resourceCompletionService.getByLesson(LESSON_ID, USER_ID);

    expect(prismaMock.assignmentCompletion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assignment: { lessonId: LESSON_ID }, userId: USER_ID },
        select: { assignmentId: true, completedAt: true },
      }),
    );
  });
});

describe('resourceCompletionService.toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assignmentCompletion.findMany.mockResolvedValue([]);
  });

  it('creates assignment completion when none exists', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ id: ASSIGNMENT_ID, lessonId: LESSON_ID });
    prismaMock.assignmentCompletion.findUnique.mockResolvedValue(null);
    prismaMock.assignmentCompletion.create.mockResolvedValue({ id: 'comp-1' });

    await resourceCompletionService.toggle(LESSON_ID, USER_ID, ASSIGNMENT_ID);

    expect(prismaMock.assignmentCompletion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: USER_ID, assignmentId: ASSIGNMENT_ID } }),
    );
  });

  it('deletes assignment completion when one exists (toggle off)', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ id: ASSIGNMENT_ID, lessonId: LESSON_ID });
    prismaMock.assignmentCompletion.findUnique.mockResolvedValue({ id: 'comp-1' });
    prismaMock.assignmentCompletion.delete.mockResolvedValue({ id: 'comp-1' });

    await resourceCompletionService.toggle(LESSON_ID, USER_ID, ASSIGNMENT_ID);

    expect(prismaMock.assignmentCompletion.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'comp-1' } }),
    );
  });

  it('throws NotFoundError when assignment is not found', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    await expect(
      resourceCompletionService.toggle(LESSON_ID, USER_ID, ASSIGNMENT_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when assignment belongs to a different lesson', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ id: ASSIGNMENT_ID, lessonId: 'other-lesson' });

    await expect(
      resourceCompletionService.toggle(LESSON_ID, USER_ID, ASSIGNMENT_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it('returns updated completions list after toggling', async () => {
    const completedAt = new Date();
    prismaMock.assignment.findUnique.mockResolvedValue({ id: ASSIGNMENT_ID, lessonId: LESSON_ID });
    prismaMock.assignmentCompletion.findUnique.mockResolvedValue(null);
    prismaMock.assignmentCompletion.create.mockResolvedValue({ id: 'comp-1' });
    prismaMock.assignmentCompletion.findMany.mockResolvedValue([
      { assignmentId: ASSIGNMENT_ID, completedAt },
    ]);

    const result = await resourceCompletionService.toggle(LESSON_ID, USER_ID, ASSIGNMENT_ID);

    expect(result.completions).toEqual([{ assignmentId: ASSIGNMENT_ID, completedAt }]);
  });
});
