import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateFlashCardInput, UpdateFlashCardInput } from '../schemas/flashcard.schema.js';

export const flashCardService = {
  async findAllByLesson(lessonId: string) {
    return prisma.flashCard.findMany({ where: { lessonId }, orderBy: { order: 'asc' } });
  },

  async create(lessonId: string, data: CreateFlashCardInput) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return prisma.flashCard.create({ data: { ...data, lessonId } });
  },

  async update(id: string, data: UpdateFlashCardInput) {
    const card = await prisma.flashCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundError('Flash card not found');
    return prisma.flashCard.update({ where: { id }, data });
  },

  async remove(id: string) {
    const card = await prisma.flashCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundError('Flash card not found');
    await prisma.flashCard.delete({ where: { id } });
  },
};
