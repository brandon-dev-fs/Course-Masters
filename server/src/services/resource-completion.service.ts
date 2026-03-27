import prisma from '../lib/prisma.js';

export const resourceCompletionService = {
  async getByLesson(lessonId: string, userId: string) {
    const completions = await prisma.lessonResourceCompletion.findMany({
      where: { lessonId, userId },
      select: { resourceType: true, resourceId: true },
    });
    return completions;
  },

  async toggle(lessonId: string, userId: string, resourceType: string, resourceId: string) {
    const existing = await prisma.lessonResourceCompletion.findUnique({
      where: { userId_resourceType_resourceId: { userId, resourceType, resourceId } },
    });

    if (existing) {
      await prisma.lessonResourceCompletion.delete({ where: { id: existing.id } });
    } else {
      await prisma.lessonResourceCompletion.create({
        data: { userId, lessonId, resourceType, resourceId },
      });
    }

    return this.getByLesson(lessonId, userId);
  },
};
