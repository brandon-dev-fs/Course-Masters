import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Assignment, Prisma } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));
vi.mock('../../lib/s3.js', () => ({ s3Client: null, S3_BUCKET: null }));
vi.mock('../../lib/logger.js', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

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
    fileAssignment: { select: { id: true; assignmentId: true; filename: true; mimeType: true; sizeBytes: true } };
  };
}>;

const ASSIGNMENT_WITH_RELATIONS: AssignmentWithRelations = {
  ...makeAssignment(),
  noteAssignment: null,
  videoAssignment: null,
  readingAssignment: null,
  vocabAssignment: null,
  practiceProblemAssignment: null,
  fileAssignment: null,
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
    prismaMock.assignment.aggregate.mockResolvedValue({ _max: { order: 0 } } as never);
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
      type: 'video', title: 'Video', url: 'https://youtube.com/watch?v=1',
    });
    expect(prismaMock.videoAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ url: 'https://youtube.com/watch?v=1' }) }),
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
    prismaMock.vocabAssignment.create.mockResolvedValue({ id: 'va-1' } as never);
    prismaMock.vocabAssignmentEntry.createMany.mockResolvedValue({ count: 1 });
    await assignmentService.create(LESSON_ID, {
      type: 'vocab', title: 'Vocab', entries: [{ term: 'cat', definition: 'animal' }],
    });
    expect(prismaMock.vocabAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ assignmentId: ASSIGNMENT_ID }) }),
    );
    expect(prismaMock.vocabAssignmentEntry.createMany).toHaveBeenCalled();
  });

  it('creates a practice_problem assignment with questions', async () => {
    prismaMock.practiceProblemAssignment.create.mockResolvedValue({ id: 'ppa-1' } as never);
    prismaMock.practiceProblemQuestion.createMany.mockResolvedValue({ count: 1 });
    await assignmentService.create(LESSON_ID, {
      type: 'practice_problem',
      title: 'Practice',
      questions: [{ type: 'multiple_choice', order: 0, content: { question: 'Test question?', options: ['A'], correctIndex: 0 } }],
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
    prismaMock.assignment.aggregate.mockResolvedValue({ _max: { order: null } } as never);

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

  it('updates video assignment url', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...ASSIGNMENT_WITH_RELATIONS, type: 'video' });
    prismaMock.videoAssignment.update.mockResolvedValue({} as never);

    await assignmentService.update(ASSIGNMENT_ID, { url: 'https://new.com' });

    expect(prismaMock.videoAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ url: 'https://new.com' }) }),
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
    prismaMock.vocabAssignment.findUnique.mockResolvedValue({ id: 'va-1' } as never);
    prismaMock.vocabAssignmentEntry.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.vocabAssignmentEntry.create.mockResolvedValue({} as never);

    await assignmentService.update(ASSIGNMENT_ID, { entries: [{ term: 'dog', definition: 'animal' }] });

    expect(prismaMock.vocabAssignmentEntry.deleteMany).toHaveBeenCalled();
    expect(prismaMock.vocabAssignmentEntry.create).toHaveBeenCalled();
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
      questions: [{ type: 'multiple_choice', order: 0, content: { question: 'Test?', options: ['a', 'b'], correctIndex: 0 } }],
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
      cb({ ...prismaMock, $queryRaw: vi.fn().mockResolvedValue([{ id: ASSIGNMENT_ID }]) } as unknown as typeof prismaMock),
    );

    await assignmentService.reorder(LESSON_ID, [ASSIGNMENT_ID]);

    expect(prismaMock.assignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { order: 1 } }),
    );
  });

  it('throws AppError when provided IDs do not match lesson assignments', async () => {
    prismaMock.$transaction.mockImplementation((cb: (tx: typeof prismaMock) => Promise<unknown>) =>
      cb({ ...prismaMock, $queryRaw: vi.fn().mockResolvedValue([{ id: 'other-id' }]) } as unknown as typeof prismaMock),
    );

    await expect(
      assignmentService.reorder(LESSON_ID, [ASSIGNMENT_ID]),
    ).rejects.toMatchObject({ code: 'INVALID_REORDER' });
  });
});

// ---------------------------------------------------------------------------
// remove — remaining assignments reorder branch
// ---------------------------------------------------------------------------

describe('assignmentService.remove — remaining assignments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reorders remaining assignments after deletion', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(makeAssignment());
    prismaMock.assignment.delete.mockResolvedValue(makeAssignment());
    prismaMock.assignment.findMany.mockResolvedValue([makeAssignment({ id: 'assignment-2', order: 2 })]);
    prismaMock.assignment.update.mockResolvedValue({} as never);

    await assignmentService.remove(ASSIGNMENT_ID);

    expect(prismaMock.assignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'assignment-2' }, data: { order: 1 } }),
    );
  });
});

// ---------------------------------------------------------------------------
// findAllByLesson — normalizeBookmark true branch
// ---------------------------------------------------------------------------

describe('assignmentService.findAllByLesson — bookmark normalization', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the first bookmark when assignment has bookmarks', async () => {
    prismaMock.lesson.findUnique.mockResolvedValue({ id: LESSON_ID });
    prismaMock.assignmentCompletion.findMany.mockResolvedValue([]);
    const bookmark = { id: 'bm-1', note: 'my note', updatedAt: new Date() };
    prismaMock.assignment.findMany.mockResolvedValue([
      { ...ASSIGNMENT_WITH_RELATIONS, bookmarks: [bookmark] },
    ] as never);

    const result = await assignmentService.findAllByLesson(LESSON_ID, USER_ID);

    expect(result[0].bookmark).toEqual(bookmark);
  });
});

// ---------------------------------------------------------------------------
// createFileAssignment — S3 not configured
// ---------------------------------------------------------------------------

describe('assignmentService.createFileAssignment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws AppError when S3 is not configured', async () => {
    prismaMock.lesson.findUnique.mockResolvedValue({ id: LESSON_ID });
    const file = {
      buffer: Buffer.from('%PDF-test'),
      mimetype: 'application/pdf',
      originalname: 'test.pdf',
      size: 100,
    } as Express.Multer.File;

    await expect(
      assignmentService.createFileAssignment(LESSON_ID, { title: 'File', file }),
    ).rejects.toMatchObject({ code: 'S3_NOT_CONFIGURED' });
  });
});

// ---------------------------------------------------------------------------
// getFileStream — not found / wrong type / S3 not configured
// ---------------------------------------------------------------------------

describe('assignmentService.getFileStream', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws NotFoundError when assignment not found', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);
    await expect(assignmentService.getFileStream(ASSIGNMENT_ID)).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when assignment type is not file', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...makeAssignment({ type: 'note' }), fileAssignment: null } as never);
    await expect(assignmentService.getFileStream(ASSIGNMENT_ID)).rejects.toThrow(NotFoundError);
  });

  it('throws AppError when S3 is not configured for file stream', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      ...makeAssignment({ type: 'file' }),
      fileAssignment: {
        id: 'fa-1',
        assignmentId: ASSIGNMENT_ID,
        storageKey: 'key',
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as never);
    await expect(assignmentService.getFileStream(ASSIGNMENT_ID)).rejects.toMatchObject({ code: 'S3_NOT_CONFIGURED' });
  });
});

// ---------------------------------------------------------------------------
// update — uncovered type-specific branches
// ---------------------------------------------------------------------------

describe('assignmentService.update — additional branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assignment.update.mockResolvedValue(makeAssignment());
    prismaMock.assignment.findUnique.mockResolvedValue(ASSIGNMENT_WITH_RELATIONS);
  });

  it('skips videoAssignment.update when no video fields provided', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...ASSIGNMENT_WITH_RELATIONS, type: 'video' });
    // Pass only title — no url or displayTitle — for a video assignment
    await assignmentService.update(ASSIGNMENT_ID, { title: 'New Title' });
    expect(prismaMock.videoAssignment.update).not.toHaveBeenCalled();
  });

  it('skips readingAssignment.update when no reading fields provided', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...ASSIGNMENT_WITH_RELATIONS, type: 'reading' });
    await assignmentService.update(ASSIGNMENT_ID, { title: 'New Title' });
    expect(prismaMock.readingAssignment.update).not.toHaveBeenCalled();
  });

  it('skips vocab entry updates when vocabAssignment not found', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...ASSIGNMENT_WITH_RELATIONS, type: 'vocab' });
    prismaMock.vocabAssignment.findUnique.mockResolvedValue(null);

    await assignmentService.update(ASSIGNMENT_ID, { entries: [{ term: 'cat', definition: 'animal' }] });

    expect(prismaMock.vocabAssignmentEntry.deleteMany).not.toHaveBeenCalled();
  });

  it('updates existing vocab entry when entry has an id', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...ASSIGNMENT_WITH_RELATIONS, type: 'vocab' });
    prismaMock.vocabAssignment.findUnique.mockResolvedValue({ id: 'va-1' } as never);
    prismaMock.vocabAssignmentEntry.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.vocabAssignmentEntry.update.mockResolvedValue({} as never);

    await assignmentService.update(ASSIGNMENT_ID, {
      entries: [{ id: 'entry-1', term: 'dog', definition: 'canine' }],
    });

    expect(prismaMock.vocabAssignmentEntry.update).toHaveBeenCalled();
    expect(prismaMock.vocabAssignmentEntry.create).not.toHaveBeenCalled();
  });

  it('skips practiceProblemQuestion.createMany when questions array is empty', async () => {
    const ppa = { id: 'ppa-1', questions: [] };
    prismaMock.assignment.findUnique.mockResolvedValue({
      ...ASSIGNMENT_WITH_RELATIONS,
      type: 'practice_problem',
      practiceProblemAssignment: ppa,
    });
    prismaMock.practiceProblemQuestion.deleteMany.mockResolvedValue({ count: 0 });

    await assignmentService.update(ASSIGNMENT_ID, { questions: [] });

    expect(prismaMock.practiceProblemQuestion.deleteMany).toHaveBeenCalled();
    expect(prismaMock.practiceProblemQuestion.createMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getSavedVocabEntryFlashCards
// ---------------------------------------------------------------------------

describe('assignmentService.getSavedVocabEntryFlashCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findFirst.mockResolvedValue(null);

    await expect(
      assignmentService.getSavedVocabEntryFlashCards(LESSON_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it('returns mapped entry objects from saved flash cards', async () => {
    prismaMock.lesson.findFirst.mockResolvedValue(mockLesson);

    const savedFlashCards = [
      {
        entry: { id: 'entry-1', term: 'cat', definition: 'a small animal', example: null, order: 1 },
      },
      {
        entry: { id: 'entry-2', term: 'dog', definition: 'a large animal', example: 'The dog barked.', order: 2 },
      },
    ];
    prismaMock.studentVocabAssignmentFlashCard.findMany.mockResolvedValue(savedFlashCards);

    const result = await assignmentService.getSavedVocabEntryFlashCards(LESSON_ID, USER_ID);

    expect(prismaMock.studentVocabAssignmentFlashCard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, entry: { vocabAssignment: { assignment: { lessonId: LESSON_ID } } } },
      }),
    );
    expect(result).toEqual([
      { id: 'entry-1', term: 'cat', definition: 'a small animal', example: null, order: 1 },
      { id: 'entry-2', term: 'dog', definition: 'a large animal', example: 'The dog barked.', order: 2 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// saveVocabEntryFlashCard
// ---------------------------------------------------------------------------

describe('assignmentService.saveVocabEntryFlashCard', () => {
  const ENTRY_ID = 'entry-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NotFoundError when vocab entry does not exist', async () => {
    prismaMock.vocabAssignmentEntry.findUnique.mockResolvedValue(null);

    await expect(
      assignmentService.saveVocabEntryFlashCard(ENTRY_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it('creates and returns the flash card record with id, entryId, and createdAt only', async () => {
    prismaMock.vocabAssignmentEntry.findUnique.mockResolvedValue({ id: ENTRY_ID } as never);
    const created = { id: 'fc-1', entryId: ENTRY_ID, createdAt: new Date() };
    prismaMock.studentVocabAssignmentFlashCard.create.mockResolvedValue(created);

    const result = await assignmentService.saveVocabEntryFlashCard(ENTRY_ID, USER_ID);

    expect(prismaMock.studentVocabAssignmentFlashCard.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: USER_ID, entryId: ENTRY_ID },
        select: { id: true, entryId: true, createdAt: true },
      }),
    );
    expect(result).toEqual(created);
    // userId must NOT be present in the returned shape
    expect(result).not.toHaveProperty('userId');
  });
});

// ---------------------------------------------------------------------------
// removeVocabEntryFlashCard
// ---------------------------------------------------------------------------

describe('assignmentService.removeVocabEntryFlashCard', () => {
  const ENTRY_ID = 'entry-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NotFoundError when saved flash card record does not exist', async () => {
    prismaMock.studentVocabAssignmentFlashCard.findUnique.mockResolvedValue(null);

    await expect(
      assignmentService.removeVocabEntryFlashCard(ENTRY_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it('deletes the record when it exists', async () => {
    const record = { id: 'fc-1', userId: USER_ID, entryId: ENTRY_ID, createdAt: new Date() };
    prismaMock.studentVocabAssignmentFlashCard.findUnique.mockResolvedValue(record);
    prismaMock.studentVocabAssignmentFlashCard.delete.mockResolvedValue(record);

    await assignmentService.removeVocabEntryFlashCard(ENTRY_ID, USER_ID);

    expect(prismaMock.studentVocabAssignmentFlashCard.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_entryId: { userId: USER_ID, entryId: ENTRY_ID } },
      }),
    );
  });
});
