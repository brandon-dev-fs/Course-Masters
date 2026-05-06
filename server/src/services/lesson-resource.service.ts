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
    return prisma.lessonResource.create({ data: { ...data, lessonId } });
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
