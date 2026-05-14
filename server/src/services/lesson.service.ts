import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import { softDeleteLesson } from '../utils/softDelete.js';
import type { CreateLessonInput, UpdateLessonInput } from '../schemas/lesson.schema.js';

export const lessonService = {
  async findAllByUnit(unitId: string) {
    // Treat soft-deleted parent Unit as non-existent
    const unit = await prisma.unit.findFirst({ where: { id: unitId, deletedAt: null } });
    if (!unit) throw new NotFoundError('Unit not found');

    return prisma.lesson.findMany({
      where: { unitId, deletedAt: null },
      orderBy: { order: 'asc' },
    });
  },

  async findById(id: string) {
    const lesson = await prisma.lesson.findFirst({ where: { id, deletedAt: null } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return lesson;
  },

  async create(unitId: string, data: CreateLessonInput) {
    // Treat soft-deleted parent Unit as non-existent
    const unit = await prisma.unit.findFirst({ where: { id: unitId, deletedAt: null } });
    if (!unit) throw new NotFoundError('Unit not found');

    return prisma.lesson.create({ data: { ...data, unitId } });
  },

  async update(id: string, data: UpdateLessonInput) {
    await this.findById(id);
    return prisma.lesson.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.findById(id);
    await prisma.$transaction(async tx => {
      await softDeleteLesson(tx, id);
    });
  },
};
