import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';

interface CompletionItem {
  type: 'resource' | 'tool';
  targetId: string;
  completedAt: Date;
}

interface RequiredItem {
  type: 'resource' | 'tool';
  targetId: string;
  isRequired: boolean;
  completed: boolean;
}

interface CompletionResult {
  completions: CompletionItem[];
  requiredItems: RequiredItem[];
}

export const resourceCompletionService = {
  async getByLesson(lessonId: string, userId: string): Promise<CompletionResult> {
    const [resourceCompletions, toolCompletions, resources, tools] = await Promise.all([
      prisma.lessonResourceCompletion.findMany({
        where: { resource: { lessonId }, userId },
        select: { resourceId: true, completedAt: true },
      }),
      prisma.lessonToolCompletion.findMany({
        where: { tool: { lessonId }, userId },
        select: { toolId: true, completedAt: true },
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

    const completedResourceIds = new Set(resourceCompletions.map(c => c.resourceId));
    const completedToolIds = new Set(toolCompletions.map(c => c.toolId));

    const completions: CompletionItem[] = [
      ...resourceCompletions.map(c => ({
        type: 'resource' as const,
        targetId: c.resourceId,
        completedAt: c.completedAt,
      })),
      ...toolCompletions.map(c => ({
        type: 'tool' as const,
        targetId: c.toolId,
        completedAt: c.completedAt,
      })),
    ];

    const requiredItems: RequiredItem[] = [
      ...resources.map(r => ({
        type: 'resource' as const,
        targetId: r.id,
        isRequired: r.isRequired,
        completed: completedResourceIds.has(r.id),
      })),
      ...tools.map(t => ({
        type: 'tool' as const,
        targetId: t.id,
        isRequired: t.isRequired,
        completed: completedToolIds.has(t.id),
      })),
    ];

    return { completions, requiredItems };
  },

  async toggle(
    lessonId: string,
    userId: string,
    type: 'resource' | 'tool',
    targetId: string,
  ): Promise<CompletionResult> {
    if (type === 'resource') {
      const resource = await prisma.lessonResource.findUnique({ where: { id: targetId } });
      if (!resource || resource.lessonId !== lessonId) {
        throw new NotFoundError('Resource not found in this lesson');
      }

      const existing = await prisma.lessonResourceCompletion.findUnique({
        where: { userId_resourceId: { userId, resourceId: targetId } },
      });

      if (existing) {
        await prisma.lessonResourceCompletion.delete({ where: { id: existing.id } });
      } else {
        await prisma.lessonResourceCompletion.create({
          data: { userId, resourceId: targetId },
        });
      }
    } else if (type === 'tool') {
      const tool = await prisma.lessonTool.findUnique({ where: { id: targetId } });
      if (!tool || tool.lessonId !== lessonId) {
        throw new NotFoundError('Tool not found in this lesson');
      }

      const existing = await prisma.lessonToolCompletion.findUnique({
        where: { userId_toolId: { userId, toolId: targetId } },
      });

      if (existing) {
        await prisma.lessonToolCompletion.delete({ where: { id: existing.id } });
      } else {
        await prisma.lessonToolCompletion.create({
          data: { userId, toolId: targetId },
        });
      }
    }

    return this.getByLesson(lessonId, userId);
  },
};
