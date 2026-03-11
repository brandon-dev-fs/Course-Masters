import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateVocabInput, UpdateVocabInput } from '../schemas/vocab.schema.js';

export const vocabService = {
  async findAllByLesson(lessonId: string) {
    return prisma.vocab.findMany({ where: { lessonId }, orderBy: { order: 'asc' } });
  },

  async create(lessonId: string, data: CreateVocabInput) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return prisma.vocab.create({ data: { ...data, lessonId } });
  },

  async update(id: string, data: UpdateVocabInput) {
    const vocab = await prisma.vocab.findUnique({ where: { id } });
    if (!vocab) throw new NotFoundError('Vocab not found');
    return prisma.vocab.update({ where: { id }, data });
  },

  async remove(id: string) {
    const vocab = await prisma.vocab.findUnique({ where: { id } });
    if (!vocab) throw new NotFoundError('Vocab not found');
    await prisma.vocab.delete({ where: { id } });
  },
};
