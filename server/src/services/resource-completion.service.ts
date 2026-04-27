import prisma from '../lib/prisma.js';

export const resourceCompletionService = {
  async getByLesson(lessonId: string, userId: string) {
    const [rawCompletions, resources, tools] = await Promise.all([
      prisma.lessonResourceCompletion.findMany({
        where: { lessonId, userId },
        select: { resourceType: true, resourceId: true },
      }),
      prisma.lessonResource.findMany({
        where: { lessonId },
        select: { id: true, isRequired: true },
      }),
      prisma.lessonTool.findMany({
        where: { lessonId },
        select: { id: true, isRequired: true },
      }),
    ]);

    const requiredMap = new Map<string, boolean>();
    for (const r of resources) requiredMap.set(r.id, r.isRequired);
    for (const t of tools) requiredMap.set(t.id, t.isRequired);

    const completions = rawCompletions.map(c => ({
      resourceType: c.resourceType,
      resourceId: c.resourceId,
      isRequired: requiredMap.get(c.resourceId) ?? true,
    }));

    const requiredItems = [
      ...resources.map(r => ({ resourceType: 'resource' as const, resourceId: r.id, isRequired: r.isRequired })),
      ...tools.map(t => ({ resourceType: 'tool' as const, resourceId: t.id, isRequired: t.isRequired })),
    ];

    return { completions, requiredItems };
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
