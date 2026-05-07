import { ToolType } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { assertExists } from '../utils/assertExists.js';
import type { CreateLessonToolInput, UpdateLessonToolInput } from '../schemas/lesson-tool.schema.js';

export const lessonToolService = {
  async findAllByLesson(lessonId: string, type?: ToolType) {
    return prisma.lessonTool.findMany({
      where: type ? { lessonId, type } : { lessonId },
      orderBy: { order: 'asc' },
    });
  },

  async create(lessonId: string, data: CreateLessonToolInput) {
    await assertExists(prisma.lesson, lessonId, 'Lesson');
    return prisma.lessonTool.create({ data: { ...data, lessonId } });
  },

  async update(id: string, data: UpdateLessonToolInput) {
    await assertExists(prisma.lessonTool, id, 'Tool');
    return prisma.lessonTool.update({ where: { id }, data });
  },

  async remove(id: string) {
    await assertExists(prisma.lessonTool, id, 'Tool');
    await prisma.lessonTool.delete({ where: { id } });
  },
};
