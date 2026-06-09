import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

import { bookmarkService } from '../../services/bookmark.service.js';
import { NotFoundError } from '../../errors/index.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ASSIGNMENT_ID = 'assignment-1';
const USER_ID = 'user-1';
const BOOKMARK_ID = 'bookmark-1';

type BookmarkResult = {
  id: string;
  assignmentId: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
};

function makeBookmark(overrides: Partial<BookmarkResult> = {}): BookmarkResult {
  return {
    id: BOOKMARK_ID,
    assignmentId: ASSIGNMENT_ID,
    note: 'My bookmark note',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getByAssignment
// ---------------------------------------------------------------------------

describe('bookmarkService.getByAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the bookmark when found', async () => {
    const bookmark = makeBookmark();
    prismaMock.activityBookmark.findFirst.mockResolvedValue(bookmark);

    const result = await bookmarkService.getByAssignment(ASSIGNMENT_ID, USER_ID);

    expect(prismaMock.activityBookmark.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assignmentId: ASSIGNMENT_ID, userId: USER_ID },
      }),
    );
    expect(result).toEqual(bookmark);
  });

  it('throws NotFoundError when bookmark does not exist', async () => {
    prismaMock.activityBookmark.findFirst.mockResolvedValue(null);

    await expect(
      bookmarkService.getByAssignment(ASSIGNMENT_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('bookmarkService.create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assignment.findUnique.mockResolvedValue({ id: ASSIGNMENT_ID });
  });

  it('returns the created bookmark on success', async () => {
    const bookmark = makeBookmark();
    prismaMock.activityBookmark.create.mockResolvedValue(bookmark);

    const result = await bookmarkService.create(ASSIGNMENT_ID, USER_ID, { note: 'My bookmark note' });

    expect(prismaMock.activityBookmark.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { assignmentId: ASSIGNMENT_ID, userId: USER_ID, note: 'My bookmark note' },
      }),
    );
    expect(result).toEqual(bookmark);
  });

  it('propagates Prisma P2002 unique constraint error without converting it', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });
    prismaMock.activityBookmark.create.mockRejectedValue(p2002);

    await expect(
      bookmarkService.create(ASSIGNMENT_ID, USER_ID, { note: 'dup' }),
    ).rejects.toThrow(p2002);
  });
});

// ---------------------------------------------------------------------------
// upsert
// ---------------------------------------------------------------------------

describe('bookmarkService.upsert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assignment.findUnique.mockResolvedValue({ id: ASSIGNMENT_ID });
  });

  it('updates an existing bookmark', async () => {
    const updated = makeBookmark({ note: 'updated note' });
    prismaMock.activityBookmark.upsert.mockResolvedValue(updated);

    const result = await bookmarkService.upsert(ASSIGNMENT_ID, USER_ID, { note: 'updated note' });

    expect(prismaMock.activityBookmark.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_assignmentId: { userId: USER_ID, assignmentId: ASSIGNMENT_ID } },
        update: { note: 'updated note' },
      }),
    );
    expect(result.note).toBe('updated note');
  });

  it('creates a new bookmark when none exists', async () => {
    const created = makeBookmark({ note: 'new note' });
    prismaMock.activityBookmark.upsert.mockResolvedValue(created);

    const result = await bookmarkService.upsert(ASSIGNMENT_ID, USER_ID, { note: 'new note' });

    expect(prismaMock.activityBookmark.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { userId: USER_ID, assignmentId: ASSIGNMENT_ID, note: 'new note' },
      }),
    );
    expect(result.note).toBe('new note');
  });
});

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------

describe('bookmarkService.remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the bookmark when it exists', async () => {
    const record = { id: BOOKMARK_ID, assignmentId: ASSIGNMENT_ID, userId: USER_ID };
    prismaMock.activityBookmark.findFirst.mockResolvedValue(record);
    prismaMock.activityBookmark.delete.mockResolvedValue(record);

    await bookmarkService.remove(ASSIGNMENT_ID, USER_ID);

    expect(prismaMock.activityBookmark.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: BOOKMARK_ID } }),
    );
  });

  it('throws NotFoundError when bookmark does not exist', async () => {
    prismaMock.activityBookmark.findFirst.mockResolvedValue(null);

    await expect(
      bookmarkService.remove(ASSIGNMENT_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });
});
