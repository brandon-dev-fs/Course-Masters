import prisma from '../lib/prisma.js';
import { NotFoundError, AppError } from '../errors/index.js';
import type { UpsertStudentNoteInput } from '../schemas/student-note.schema.js';

export const studentNoteService = {
  async findByLesson(lessonId: string, userId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return prisma.studentNote.findUnique({ where: { lessonId_userId: { lessonId, userId } } });
  },

  async upsert(lessonId: string, data: UpsertStudentNoteInput, userId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return prisma.studentNote.upsert({
      where: { lessonId_userId: { lessonId, userId } },
      create: { content: data.content, lessonId, userId },
      update: { content: data.content },
    });
  },

  async remove(id: string, userId: string) {
    const note = await prisma.studentNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundError('Student note not found');
    if (note.userId !== userId) throw new AppError('FORBIDDEN', 'You can only delete your own notes', 403);
    await prisma.studentNote.delete({ where: { id } });
  },
};
