import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Assignment, Prisma } from '@prisma/client';
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

type AssignmentWithRelations = Prisma.AssignmentGetPayload<{
  include: {
    noteAssignment: true;
    videoAssignment: true;
    readingAssignment: true;
    vocabAssignment: true;
    practiceProblemAssignment: { include: { questions: true } };
  };
}>;

const ASSIGNMENT_WITH_RELATIONS: AssignmentWithRelations = {
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

// ---------------------------------------------------------------------------
// findById — userId branch
// ---------------------------------------------------------------------------

describe('assignmentService.findById with userId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assignment.findUnique.mockResolvedValue(ASSIGNMENT_WITH_RELATIONS);
  });

  it('marks completed true when completion record exists', async () => {
    prismaMock.assignmentCompletion.findUnique.mockResolvedValue(
      { id: 'comp-1', userId: USER_ID, assignmentId: ASSIGNMENT_ID, completedAt: new Date() },
    );
    const result = await assignmentService.findById(ASSIGNMENT_ID, USER_ID);
    expect(result.completed).toBe(true);
  });

  it('marks completed false when no completion record', async () => {
    prismaMock.assignmentCompletion.findUnique.mockResolvedValue(null);
    const result = await assignmentService.findById(ASSIGNMENT_ID, USER_ID);
    expect(result.completed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// create — all 5 type branches
// ---------------------------------------------------------------------------

describe('assignmentService.create', () => {
  const mockAssignment = makeAssignment();

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findUnique.mockResolvedValue(mockLesson);
    prismaMock.assignment.aggregate.mockResolvedValue({ _max: { order: 0 } } as unknown as Awaited<ReturnType<typeof prismaMock.assignment.aggregate>>);
    prismaMock.assignment.create.mockResolvedValue(mockAssignment);
    // findById at end of create
    prismaMock.assignment.findUnique.mockResolvedValue(ASSIGNMENT_WITH_RELATIONS);
    prismaMock.assignmentCompletion.findUnique.mockResolvedValue(null);
  });

  it('creates a note assignment', async () => {
    prismaMock.noteAssignment.create.mockResolvedValue({} as never);
    await assignmentService.create(LESSON_ID, {
      type: 'note', title: 'Note', content: { body: 'text' },
    });
    expect(prismaMock.noteAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ content: { body: 'text' } }) }),
    );
  });

  it('creates a video assignment', async () => {
    prismaMock.videoAssignment.create.mockResolvedValue({} as never);
    await assignmentService.create(LESSON_ID, {
      type: 'video', title: 'Video', url: 'https://youtube.com/watch?v=1', displayTitle: 'My Video',
    });
    expect(prismaMock.videoAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ url: 'https://youtube.com/watch?v=1', title: 'My Video' }) }),
    );
  });

  it('creates a video assignment with null displayTitle when not provided', async () => {
    prismaMock.videoAssignment.create.mockResolvedValue({} as never);
    await assignmentService.create(LESSON_ID, {
      type: 'video', title: 'Video', url: 'https://youtube.com/watch?v=1',
    });
    expect(prismaMock.videoAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: null }) }),
    );
  });

  it('creates a reading assignment', async () => {
    prismaMock.readingAssignment.create.mockResolvedValue({} as never);
    await assignmentService.create(LESSON_ID, {
      type: 'reading', title: 'Reading', url: 'https://example.com', estimatedMinutes: 10,
    });
    expect(prismaMock.readingAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ url: 'https://example.com', estimatedMinutes: 10 }) }),
    );
  });

  it('creates a vocab assignment', async () => {
    prismaMock.vocabAssignment.create.mockResolvedValue({} as never);
    await assignmentService.create(LESSON_ID, {
      type: 'vocab', title: 'Vocab', entries: [{ term: 'cat', definition: 'animal' }],
    });
    expect(prismaMock.vocabAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ entries: [{ term: 'cat', definition: 'animal' }] }) }),
    );
  });

  it('creates a practice_problem assignment with questions', async () => {
    prismaMock.practiceProblemAssignment.create.mockResolvedValue({ id: 'ppa-1' } as never);
    prismaMock.practiceProblemQuestion.createMany.mockResolvedValue({ count: 1 });
    await assignmentService.create(LESSON_ID, {
      type: 'practice_problem',
      title: 'Practice',
      questions: [{ type: 'multiple_choice', order: 0, content: { options: ['A'], correctIndex: 0 } }],
    });
    expect(prismaMock.practiceProblemAssignment.create).toHaveBeenCalled();
    expect(prismaMock.practiceProblemQuestion.createMany).toHaveBeenCalled();
  });

  it('creates practice_problem without questions when array is empty', async () => {
    prismaMock.practiceProblemAssignment.create.mockResolvedValue({ id: 'ppa-1' } as never);
    await assignmentService.create(LESSON_ID, {
      type: 'practice_problem', title: 'Practice', questions: [],
    });
    expect(prismaMock.practiceProblemAssignment.create).toHaveBeenCalled();
    expect(prismaMock.practiceProblemQuestion.createMany).not.toHaveBeenCalled();
  });

  it('uses nextOrder = 1 when no prior assignments exist', async () => {
    prismaMock.noteAssignment.create.mockResolvedValue({} as never);
    prismaMock.assignment.aggregate.mockResolvedValue({ _max: { order: null } } as unknown as Awaited<ReturnType<typeof prismaMock.assignment.aggregate>>);

    await assignmentService.create(LESSON_ID, { type: 'note', title: 'First', content: {} });

    expect(prismaMock.assignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 1 }) }),
    );
  });
});

// ---------------------------------------------------------------------------
// update — type-specific branches
// ---------------------------------------------------------------------------

describe('assignmentService.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assignment.findUnique.mockResolvedValue(ASSIGNMENT_WITH_RELATIONS);
    prismaMock.assignment.update.mockResolvedValue(makeAssignment());
  });

  it('updates shared title field for note assignment', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...ASSIGNMENT_WITH_RELATIONS, type: 'note' });
    prismaMock.noteAssignment.update.mockResolvedValue({} as never);

    await assignmentService.update(ASSIGNMENT_ID, { title: 'New Title', content: { body: 'new' } });

    expect(prismaMock.assignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'New Title' }) }),
    );
    expect(prismaMock.noteAssignment.update).toHaveBeenCalled();
  });

  it('skips shared-field update when no title or objective provided', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...ASSIGNMENT_WITH_RELATIONS, type: 'note' });
    prismaMock.noteAssignment.update.mockResolvedValue({} as never);

    await assignmentService.update(ASSIGNMENT_ID, { content: { body: 'body only' } });

    expect(prismaMock.assignment.update).not.toHaveBeenCalled();
  });

  it('updates video assignment url and displayTitle', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...ASSIGNMENT_WITH_RELATIONS, type: 'video' });
    prismaMock.videoAssignment.update.mockResolvedValue({} as never);

    await assignmentService.update(ASSIGNMENT_ID, { url: 'https://new.com', displayTitle: 'New Title' });

    expect(prismaMock.videoAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ url: 'https://new.com', title: 'New Title' }) }),
    );
  });

  it('updates reading assignment fields', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...ASSIGNMENT_WITH_RELATIONS, type: 'reading' });
    prismaMock.readingAssignment.update.mockResolvedValue({} as never);

    await assignmentService.update(ASSIGNMENT_ID, { url: 'https://new.com', estimatedMinutes: 5 });

    expect(prismaMock.readingAssignment.update).toHaveBeenCalled();
  });

  it('updates vocab entries', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...ASSIGNMENT_WITH_RELATIONS, type: 'vocab' });
    prismaMock.vocabAssignment.update.mockResolvedValue({} as never);

    await assignmentService.update(ASSIGNMENT_ID, { entries: [{ term: 'dog', definition: 'animal' }] });

    expect(prismaMock.vocabAssignment.update).toHaveBeenCalled();
  });

  it('updates practice_problem questions when provided', async () => {
    const ppa = { id: 'ppa-1' };
    prismaMock.assignment.findUnique.mockResolvedValue({
      ...ASSIGNMENT_WITH_RELATIONS,
      type: 'practice_problem',
      practiceProblemAssignment: { ...ppa, questions: [] },
    });
    prismaMock.practiceProblemAssignment.update.mockResolvedValue({} as never);
    prismaMock.practiceProblemQuestion.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.practiceProblemQuestion.createMany.mockResolvedValue({ count: 1 });

    await assignmentService.update(ASSIGNMENT_ID, {
      questions: [{ type: 'multiple_choice', order: 0, content: {} }],
    });

    expect(prismaMock.practiceProblemQuestion.deleteMany).toHaveBeenCalled();
    expect(prismaMock.practiceProblemQuestion.createMany).toHaveBeenCalled();
  });

  it('throws NotFoundError when assignment does not exist', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    await expect(assignmentService.update(ASSIGNMENT_ID, { title: 'X' })).rejects.toThrow(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// reorder
// ---------------------------------------------------------------------------

describe('assignmentService.reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findUnique.mockResolvedValue(mockLesson);
    prismaMock.assignment.findMany.mockResolvedValue([ASSIGNMENT_WITH_RELATIONS]);
    prismaMock.assignment.update.mockResolvedValue(makeAssignment());
  });

  it('updates order for each assignment', async () => {
    prismaMock.$transaction.mockImplementation((cb: (tx: typeof prismaMock) => Promise<unknown>) =>
      cb({ ...prismaMock, $queryRaw: vi.fn().mockResolvedValue([{ id: ASSIGNMENT_ID }]) } as typeof prismaMock),
    );

    await assignmentService.reorder(LESSON_ID, [ASSIGNMENT_ID]);

    expect(prismaMock.assignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { order: 1 } }),
    );
  });

  it('throws AppError when provided IDs do not match lesson assignments', async () => {
    prismaMock.$transaction.mockImplementation((cb: (tx: typeof prismaMock) => Promise<unknown>) =>
      cb({ ...prismaMock, $queryRaw: vi.fn().mockResolvedValue([{ id: 'other-id' }]) } as typeof prismaMock),
    );

    await expect(
      assignmentService.reorder(LESSON_ID, [ASSIGNMENT_ID]),
    ).rejects.toMatchObject({ code: 'INVALID_REORDER' });
  });
});
