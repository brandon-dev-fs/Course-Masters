import prisma from '../lib/prisma.js';
import { assertExists } from '../utils/assertExists.js';
import type { CreateLessonInput, UpdateLessonInput } from '../schemas/lesson.schema.js';

export const lessonService = {
  async findAllByUnit(unitId: string) {
    await assertExists(prisma.unit, unitId, 'Unit');
    return prisma.lesson.findMany({
      where: { unitId },
      orderBy: { order: 'asc' },
    });
  },

  async findById(id: string) {
    return assertExists(prisma.lesson, id, 'Lesson');
  },

  async create(unitId: string, data: CreateLessonInput) {
    await assertExists(prisma.unit, unitId, 'Unit');
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
