import type { Prisma } from '@prisma/client';
import { ResourceType } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { assertExists } from '../utils/assertExists.js';
import type { CreateLessonResourceInput, UpdateLessonResourceInput } from '../schemas/lesson-resource.schema.js';

export const lessonResourceService = {
  async findAllByLesson(lessonId: string, type?: ResourceType) {
    return prisma.lessonResource.findMany({
      where: type ? { lessonId, type } : { lessonId },
      orderBy: { order: 'asc' },
    });
  },

  async create(lessonId: string, data: CreateLessonResourceInput) {
    await assertExists(prisma.lesson, lessonId, 'Lesson');
    // Cast content to InputJsonValue: Zod validates with z.record(z.unknown()) for type
    // safety; Prisma's InputJsonValue uses a narrower recursive type that does not accept
    // Record<string, unknown> structurally, so an explicit cast is required here.
    return prisma.lessonResource.create({
      data: { ...data, lessonId, content: data.content as Prisma.InputJsonValue },
    });
  },

  async update(id: string, data: UpdateLessonResourceInput) {
    await assertExists(prisma.lessonResource, id, 'Resource');
    return prisma.lessonResource.update({ where: { id }, data });
  },

  async remove(id: string) {
    await assertExists(prisma.lessonResource, id, 'Resource');
    await prisma.lessonResource.delete({ where: { id } });
  },
};
