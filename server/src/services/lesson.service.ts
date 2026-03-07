import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateLessonInput, UpdateLessonInput } from '../schemas/lesson.schema.js';

export const lessonService = {
  async findAllByUnit(unitId: string) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundError('Unit not found');
    return prisma.lesson.findMany({
      where: { unitId },
      orderBy: { order: 'asc' },
    });
  },

  async findById(id: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return lesson;
  },

  async create(unitId: string, data: CreateLessonInput) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundError('Unit not found');
    return prisma.lesson.create({ data: { ...data, unitId } });
  },

  async update(id: string, data: UpdateLessonInput) {
    await this.findById(id);
    return prisma.lesson.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.findById(id);
    await prisma.lesson.delete({ where: { id } });
  },
};
