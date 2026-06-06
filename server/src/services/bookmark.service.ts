import prisma from '../lib/prisma.js';
import { assertExists } from '../utils/assertExists.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateBookmarkInput, UpdateBookmarkInput } from '../schemas/bookmark.schema.js';

const BOOKMARK_SELECT = {
  id: true,
  assignmentId: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const bookmarkService = {
  async getByAssignment(assignmentId: string, userId: string) {
    const record = await prisma.activityBookmark.findFirst({
      where: { assignmentId, userId },
      select: BOOKMARK_SELECT,
    });
    return record ?? null;
  },

  async create(assignmentId: string, userId: string, data: CreateBookmarkInput) {
    await assertExists(prisma.assignment, assignmentId, 'Assignment');
    // Let Prisma P2002 bubble to 409 via errorHandler if bookmark already exists
    return prisma.activityBookmark.create({
      data: { assignmentId, userId, note: data.note ?? null },
      select: BOOKMARK_SELECT,
    });
  },

  async upsert(assignmentId: string, userId: string, data: UpdateBookmarkInput) {
    await assertExists(prisma.assignment, assignmentId, 'Assignment');
    return prisma.activityBookmark.upsert({
      where: { userId_assignmentId: { userId, assignmentId } },
      create: { userId, assignmentId, note: data.note ?? null },
      update: { note: data.note ?? null },
      select: BOOKMARK_SELECT,
    });
  },

  async remove(assignmentId: string, userId: string) {
    const record = await prisma.activityBookmark.findFirst({
      where: { assignmentId, userId },
    });
    if (!record) throw new NotFoundError('Bookmark not found');
    await prisma.activityBookmark.delete({ where: { id: record.id } });
  },
};
