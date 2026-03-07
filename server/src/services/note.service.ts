import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema.js';

export const noteService = {
  async findAllByLesson(lessonId: string) {
    return prisma.note.findMany({ where: { lessonId }, orderBy: { order: 'asc' } });
  },

  async create(lessonId: string, data: CreateNoteInput) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return prisma.note.create({ data: { ...data, lessonId } });
  },

  async update(id: string, data: UpdateNoteInput) {
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) throw new NotFoundError('Note not found');
    return prisma.note.update({ where: { id }, data });
  },

  async remove(id: string) {
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) throw new NotFoundError('Note not found');
    await prisma.note.delete({ where: { id } });
  },
};
