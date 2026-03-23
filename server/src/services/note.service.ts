import prisma from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '../errors/index.js';

export const noteService = {
  async findByLesson(lessonId: string) {
    return prisma.note.findUnique({ where: { lessonId } });
  },

  async upsert(lessonId: string, content: Prisma.InputJsonValue) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return prisma.note.upsert({
      where: { lessonId },
      create: { content, lessonId },
      update: { content },
    });
  },
};
