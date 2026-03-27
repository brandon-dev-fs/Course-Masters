import { ResourceType } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateLessonResourceInput, UpdateLessonResourceInput } from '../schemas/lesson-resource.schema.js';

export const lessonResourceService = {
  async findAllByLesson(lessonId: string, type?: ResourceType) {
    return prisma.lessonResource.findMany({
      where: type ? { lessonId, type } : { lessonId },
      orderBy: { order: 'asc' },
    });
  },

  async create(lessonId: string, data: CreateLessonResourceInput) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return prisma.lessonResource.create({ data: { ...data, lessonId } });
  },

  async update(id: string, data: UpdateLessonResourceInput) {
    const item = await prisma.lessonResource.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Resource not found');
    return prisma.lessonResource.update({ where: { id }, data });
  },

  async remove(id: string) {
    const item = await prisma.lessonResource.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Resource not found');
    await prisma.lessonResource.delete({ where: { id } });
  },
};
