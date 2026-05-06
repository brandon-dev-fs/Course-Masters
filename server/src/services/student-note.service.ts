import prisma from '../lib/prisma.js';
import { AppError } from '../errors/index.js';
import { assertExists } from '../utils/assertExists.js';
import type { UpsertStudentNoteInput } from '../schemas/student-note.schema.js';
import { logAuthFailure } from '../middleware/authorize-resource.js';

export const studentNoteService = {
  /**
   * Fetch notes for a lesson, scoped by role (FR-07).
   *
   * - student: returns the single note belonging to `userId` (or null)
   * - teacher / admin: returns all notes for the lesson
   */
  async findByLesson(
    lessonId: string,
    userId: string,
    userRole: 'student' | 'teacher' | 'admin',
  ): Promise<import('@prisma/client').StudentNote | import('@prisma/client').StudentNote[] | null> {
    await assertExists(prisma.lesson, lessonId, 'Lesson');

    if (userRole === 'student') {
      return prisma.studentNote.findUnique({ where: { lessonId_userId: { lessonId, userId } } });
    }

    return prisma.studentNote.findMany({ where: { lessonId } });
  },

  async upsert(lessonId: string, data: UpsertStudentNoteInput, userId: string) {
    await assertExists(prisma.lesson, lessonId, 'Lesson');
    return prisma.studentNote.upsert({
      where: { lessonId_userId: { lessonId, userId } },
      create: { content: data.content, lessonId, userId },
      update: { content: data.content },
    });
  },

  /**
   * Delete a student note.
   *
   * Ownership is enforced here (FR-09):
   * - admin: bypass (can delete any note)
   * - anyone else: must own the note
   *
   * Authorization failures are logged per NFR-03.
   */
  async remove(id: string, userId: string, userRole: 'student' | 'teacher' | 'admin' = 'student') {
    const note = await assertExists(prisma.studentNote, id, 'Student note');

    if (userRole !== 'admin' && note.userId !== userId) {
      logAuthFailure(userId, id, 'DELETE student-note');
      throw new AppError('FORBIDDEN', 'You can only delete your own notes', 403);
    }

    await prisma.studentNote.delete({ where: { id } });
  },
};
