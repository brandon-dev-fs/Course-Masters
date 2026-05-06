import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';

export const completionService = {
  async markLessonComplete(lessonId: string, userId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');

    const completion = await prisma.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId },
      update: {},
    });
    return completion;
  },

  async removeLessonComplete(lessonId: string, userId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');

    await prisma.lessonCompletion.deleteMany({ where: { userId, lessonId } });
  },

  async markUnitComplete(unitId: string, userId: string) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundError('Unit not found');

    const completion = await prisma.unitCompletion.upsert({
      where: { userId_unitId: { userId, unitId } },
      create: { userId, unitId },
      update: {},
    });
    return completion;
  },

  async removeUnitComplete(unitId: string, userId: string) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundError('Unit not found');

    await prisma.unitCompletion.deleteMany({ where: { userId, unitId } });
  },
};
