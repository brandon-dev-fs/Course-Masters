import prisma from '../lib/prisma.js';
import { assertExists } from '../utils/assertExists.js';

export const completionService = {
  async markLessonComplete(lessonId: string, userId: string) {
    await assertExists(prisma.lesson, lessonId, 'Lesson');

    const completion = await prisma.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId },
      update: {},
    });
    return completion;
  },

  async removeLessonComplete(lessonId: string, userId: string) {
    await assertExists(prisma.lesson, lessonId, 'Lesson');

    await prisma.lessonCompletion.deleteMany({ where: { userId, lessonId } });
  },

  async markUnitComplete(unitId: string, userId: string) {
    await assertExists(prisma.unit, unitId, 'Unit');

    const completion = await prisma.unitCompletion.upsert({
      where: { userId_unitId: { userId, unitId } },
      create: { userId, unitId },
      update: {},
    });
    return completion;
  },

  async removeUnitComplete(unitId: string, userId: string) {
    await assertExists(prisma.unit, unitId, 'Unit');

    await prisma.unitCompletion.deleteMany({ where: { userId, unitId } });
  },
};
