import prisma from '../lib/prisma.js';
import { NotFoundError } from '../errors/index.js';
import type { UpsertStudentNoteInput } from '../schemas/student-note.schema.js';

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new NotFoundError('No users found — run seed first');
  return user.id;
}

export const studentNoteService = {
  async findByLesson(lessonId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    const userId = await getDefaultUserId();
    return prisma.studentNote.findUnique({ where: { lessonId_userId: { lessonId, userId } } });
  },

  async upsert(lessonId: string, data: UpsertStudentNoteInput) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');
    const userId = await getDefaultUserId();
    return prisma.studentNote.upsert({
      where: { lessonId_userId: { lessonId, userId } },
      create: { content: data.content, lessonId, userId },
      update: { content: data.content },
    });
  },

  async remove(id: string) {
    const note = await prisma.studentNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundError('Student note not found');
    await prisma.studentNote.delete({ where: { id } });
  },
};
