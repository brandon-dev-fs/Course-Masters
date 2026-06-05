import prisma from '../lib/prisma.js';
import { AppError, NotFoundError, ValidationError } from '../errors/index.js';
import type {
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
} from '../schemas/checklist.schema.js';

const ITEM_SELECT = {
  id: true,
  text: true,
  checked: true,
  order: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function assertLessonExists(lessonId: string) {
  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, deletedAt: null } });
  if (!lesson) throw new NotFoundError('Lesson not found');
  return lesson;
}

export const checklistService = {
  async findAllByLesson(lessonId: string, userId: string) {
    await assertLessonExists(lessonId);
    return prisma.lessonChecklistItem.findMany({
      where: { lessonId, userId },
      orderBy: { order: 'asc' },
      select: ITEM_SELECT,
    });
  },

  async create(lessonId: string, userId: string, data: CreateChecklistItemInput) {
    await assertLessonExists(lessonId);
    const agg = await prisma.lessonChecklistItem.aggregate({
      where: { lessonId, userId },
      _max: { order: true },
    });
    const nextOrder = (agg._max.order ?? 0) + 1;
    return prisma.lessonChecklistItem.create({
      data: { lessonId, userId, text: data.text, order: nextOrder, checked: false },
      select: ITEM_SELECT,
    });
  },

  async update(itemId: string, userId: string, data: UpdateChecklistItemInput) {
    const item = await prisma.lessonChecklistItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundError('Checklist item not found');
    if (item.userId !== userId) throw new AppError('FORBIDDEN', 'Not your checklist item', 403);
    return prisma.lessonChecklistItem.update({
      where: { id: itemId },
      data: { ...data },
      select: ITEM_SELECT,
    });
  },

  async remove(itemId: string, userId: string) {
    const item = await prisma.lessonChecklistItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundError('Checklist item not found');
    if (item.userId !== userId) throw new AppError('FORBIDDEN', 'Not your checklist item', 403);
    await prisma.lessonChecklistItem.delete({ where: { id: itemId } });
  },

  async reorder(lessonId: string, userId: string, itemIds: string[]) {
    await assertLessonExists(lessonId);

    const existing = await prisma.lessonChecklistItem.findMany({
      where: { lessonId, userId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((i) => i.id));

    if (itemIds.some((id) => !existingIds.has(id))) {
      throw new ValidationError('One or more item IDs do not belong to you', {});
    }
    if (itemIds.length !== existing.length) {
      throw new ValidationError('itemIds must include all checklist items for this lesson', {});
    }

    await prisma.$transaction(
      itemIds.map((id, index) =>
        prisma.lessonChecklistItem.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    );

    return checklistService.findAllByLesson(lessonId, userId);
  },
};
