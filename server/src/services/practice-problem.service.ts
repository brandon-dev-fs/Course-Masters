import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreatePracticeProblemInput, UpdatePracticeProblemInput } from '../schemas/practice-problem.schema.js';

export const practiceProblemService = {
  async findAllByLesson(lessonId: string) {
    return prisma.practiceProblem.findMany({ where: { lessonId }, orderBy: { order: 'asc' } });
  },

  async create(lessonId: string, data: CreatePracticeProblemInput) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return prisma.practiceProblem.create({ data: { ...data, lessonId } });
  },

  async update(id: string, data: UpdatePracticeProblemInput) {
    const prob = await prisma.practiceProblem.findUnique({ where: { id } });
    if (!prob) throw new NotFoundError('Practice problem not found');
    return prisma.practiceProblem.update({ where: { id }, data });
  },

  async remove(id: string) {
    const prob = await prisma.practiceProblem.findUnique({ where: { id } });
    if (!prob) throw new NotFoundError('Practice problem not found');
    await prisma.practiceProblem.delete({ where: { id } });
  },
};
