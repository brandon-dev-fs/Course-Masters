import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LessonChecklistItem } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { checklistService } from '../../services/checklist.service.js';
import { AppError, NotFoundError, ValidationError } from '../../errors/index.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const LESSON_ID = 'lesson-1';
const ITEM_ID = 'item-1';
const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

type ChecklistItemResult = {
  id: string;
  text: string;
  checked: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

function makeItemResult(overrides: Partial<ChecklistItemResult> = {}): ChecklistItemResult {
  return {
    id: ITEM_ID,
    text: 'Do something',
    checked: false,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeFullItem(overrides: Partial<LessonChecklistItem> = {}): LessonChecklistItem {
  return {
    id: ITEM_ID,
    lessonId: LESSON_ID,
    userId: USER_ID,
    text: 'Do something',
    checked: false,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const mockLesson = { id: LESSON_ID, title: 'Lesson 1', deletedAt: null };

// ---------------------------------------------------------------------------
// findAllByLesson
// ---------------------------------------------------------------------------

describe('checklistService.findAllByLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findFirst.mockResolvedValue(mockLesson);
  });

  it('returns items array ordered by order asc', async () => {
    const items = [makeItemResult({ order: 1 }), makeItemResult({ id: 'item-2', order: 2 })];
    prismaMock.lessonChecklistItem.findMany.mockResolvedValue(items);

    const result = await checklistService.findAllByLesson(LESSON_ID, USER_ID);

    expect(prismaMock.lessonChecklistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { order: 'asc' } }),
    );
    expect(result).toEqual(items);
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findFirst.mockResolvedValue(null);

    await expect(
      checklistService.findAllByLesson(LESSON_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('checklistService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findFirst.mockResolvedValue(mockLesson);
    prismaMock.lessonChecklistItem.aggregate.mockResolvedValue(
      { _max: { order: 0 } } as never,
    );
  });

  it('creates a checklist item with the next order value', async () => {
    const created = makeItemResult();
    prismaMock.lessonChecklistItem.create.mockResolvedValue(created);

    const result = await checklistService.create(LESSON_ID, USER_ID, { text: 'Do something' });

    expect(prismaMock.lessonChecklistItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ text: 'Do something', order: 1, checked: false }),
      }),
    );
    expect(result).toEqual(created);
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findFirst.mockResolvedValue(null);

    await expect(
      checklistService.create(LESSON_ID, USER_ID, { text: 'Do something' }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe('checklistService.update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates the item and returns result', async () => {
    prismaMock.lessonChecklistItem.findUnique.mockResolvedValue(makeFullItem());
    const updated = makeItemResult({ checked: true });
    prismaMock.lessonChecklistItem.update.mockResolvedValue(updated);

    const result = await checklistService.update(ITEM_ID, USER_ID, { checked: true });

    expect(prismaMock.lessonChecklistItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ITEM_ID },
        data: { checked: true },
      }),
    );
    expect(result).toEqual(updated);
  });

  it('throws NotFoundError when item does not exist', async () => {
    prismaMock.lessonChecklistItem.findUnique.mockResolvedValue(null);

    await expect(
      checklistService.update(ITEM_ID, USER_ID, { checked: true }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws AppError FORBIDDEN when item belongs to a different user', async () => {
    prismaMock.lessonChecklistItem.findUnique.mockResolvedValue(makeFullItem({ userId: OTHER_USER_ID }));

    await expect(
      checklistService.update(ITEM_ID, USER_ID, { checked: true }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });
});

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------

describe('checklistService.remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the item when it exists and belongs to the user', async () => {
    const item = makeFullItem();
    prismaMock.lessonChecklistItem.findUnique.mockResolvedValue(item);
    prismaMock.lessonChecklistItem.delete.mockResolvedValue(item);

    await checklistService.remove(ITEM_ID, USER_ID);

    expect(prismaMock.lessonChecklistItem.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ITEM_ID } }),
    );
  });

  it('throws NotFoundError when item does not exist', async () => {
    prismaMock.lessonChecklistItem.findUnique.mockResolvedValue(null);

    await expect(
      checklistService.remove(ITEM_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws AppError FORBIDDEN when item belongs to a different user', async () => {
    prismaMock.lessonChecklistItem.findUnique.mockResolvedValue(makeFullItem({ userId: OTHER_USER_ID }));

    await expect(
      checklistService.remove(ITEM_ID, USER_ID),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });
});

// ---------------------------------------------------------------------------
// reorder
// ---------------------------------------------------------------------------

describe('checklistService.reorder', () => {
  const ITEM_ID_2 = 'item-2';

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findFirst.mockResolvedValue(mockLesson);
    prismaMock.lessonChecklistItem.findMany.mockResolvedValue([
      { id: ITEM_ID },
      { id: ITEM_ID_2 },
    ]);
    prismaMock.lessonChecklistItem.update.mockResolvedValue(makeFullItem());
  });

  it('updates order values for all items in the provided order', async () => {
    // checklist.service.ts calls $transaction(array) — mock to resolve the array
    prismaMock.$transaction.mockImplementation(
      (ops: unknown) => Promise.all(ops as Array<Promise<unknown>>),
    );

    // After reorder, findAllByLesson calls findFirst (lesson) + findMany (items)
    prismaMock.lessonChecklistItem.findMany
      .mockResolvedValueOnce([{ id: ITEM_ID }, { id: ITEM_ID_2 }]) // reorder ownership check
      .mockResolvedValue([makeItemResult({ order: 1 }), makeItemResult({ id: ITEM_ID_2, order: 2 })]); // findAllByLesson

    await checklistService.reorder(LESSON_ID, USER_ID, [ITEM_ID, ITEM_ID_2]);

    expect(prismaMock.lessonChecklistItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { order: 1 } }),
    );
    expect(prismaMock.lessonChecklistItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { order: 2 } }),
    );
  });

  it('throws ValidationError when itemIds count does not match existing items', async () => {
    // Only provide 1 ID but 2 items exist
    await expect(
      checklistService.reorder(LESSON_ID, USER_ID, [ITEM_ID]),
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when an item ID does not belong to the user', async () => {
    // Existing items for this user only has ITEM_ID; ITEM_ID_2 is not theirs
    prismaMock.lessonChecklistItem.findMany.mockResolvedValue([{ id: ITEM_ID }]);

    await expect(
      checklistService.reorder(LESSON_ID, USER_ID, [ITEM_ID, 'foreign-item-id']),
    ).rejects.toThrow(ValidationError);
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findFirst.mockResolvedValue(null);

    await expect(
      checklistService.reorder(LESSON_ID, USER_ID, [ITEM_ID, ITEM_ID_2]),
    ).rejects.toThrow(NotFoundError);
  });
});
