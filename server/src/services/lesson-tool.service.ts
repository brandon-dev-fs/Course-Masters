import { ToolType } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateLessonToolInput, UpdateLessonToolInput } from '../schemas/lesson-tool.schema.js';

export const lessonToolService = {
  async findAllByLesson(lessonId: string, type?: ToolType) {
    return prisma.lessonTool.findMany({
      where: type ? { lessonId, type } : { lessonId },
      orderBy: { order: 'asc' },
    });
  },

  async create(lessonId: string, data: CreateLessonToolInput) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return prisma.lessonTool.create({ data: { ...data, lessonId } });
  },

  async update(id: string, data: UpdateLessonToolInput) {
    const item = await prisma.lessonTool.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Tool not found');
    return prisma.lessonTool.update({ where: { id }, data });
  },

  async remove(id: string) {
    const item = await prisma.lessonTool.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Tool not found');
    await prisma.lessonTool.delete({ where: { id } });
  },
};
