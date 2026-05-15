import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StudentNote } from '@prisma/client';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

vi.mock('../../lib/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { studentNoteService } from '../../services/student-note.service.js';
import { AppError } from '../../errors/AppError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

function makeNote(overrides: Partial<StudentNote> = {}): StudentNote {
  return {
    id: 'note-1',
    lessonId: 'lesson-1',
    userId: 'user-1',
    content: 'Test note content',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const LESSON_ID = 'lesson-1';
const USER_ID = 'user-1';
const NOTE_ID = 'note-1';

const mockLesson = { id: LESSON_ID, title: 'Lesson 1' };

describe('studentNoteService.findByLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findUnique.mockResolvedValue(mockLesson);
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(null);

    await expect(
      studentNoteService.findByLesson(LESSON_ID, USER_ID, 'student'),
    ).rejects.toThrow(NotFoundError);
  });

  it('returns student note for student role', async () => {
    const note = makeNote();
    prismaMock.studentNote.findUnique.mockResolvedValue(note);

    const result = await studentNoteService.findByLesson(LESSON_ID, USER_ID, 'student');

    expect(prismaMock.studentNote.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { lessonId_userId: { lessonId: LESSON_ID, userId: USER_ID } } }),
    );
    expect(result).toEqual(note);
  });

  it('returns all notes for teacher role', async () => {
    const notes = [makeNote(), makeNote({ id: 'note-2', userId: 'user-2' })];
    prismaMock.studentNote.findMany.mockResolvedValue(notes);

    const result = await studentNoteService.findByLesson(LESSON_ID, USER_ID, 'teacher');

    expect(prismaMock.studentNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { lessonId: LESSON_ID } }),
    );
    expect(result).toEqual(notes);
  });

  it('returns all notes for admin role', async () => {
    const notes = [makeNote()];
    prismaMock.studentNote.findMany.mockResolvedValue(notes);

    await studentNoteService.findByLesson(LESSON_ID, USER_ID, 'admin');

    expect(prismaMock.studentNote.findMany).toHaveBeenCalled();
  });
});

describe('studentNoteService.upsert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.lesson.findUnique.mockResolvedValue(mockLesson);
  });

  it('creates or updates student note via upsert', async () => {
    const note = makeNote({ content: 'Updated content' });
    prismaMock.studentNote.upsert.mockResolvedValue(note);

    const result = await studentNoteService.upsert(LESSON_ID, { content: 'Updated content' }, USER_ID);

    expect(prismaMock.studentNote.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { lessonId_userId: { lessonId: LESSON_ID, userId: USER_ID } },
        create: expect.objectContaining({ content: 'Updated content', lessonId: LESSON_ID, userId: USER_ID }),
        update: expect.objectContaining({ content: 'Updated content' }),
      }),
    );
    expect(result).toEqual(note);
  });

  it('throws NotFoundError when lesson does not exist', async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(null);

    await expect(
      studentNoteService.upsert(LESSON_ID, { content: 'Content' }, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });
});

describe('studentNoteService.remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the note when user owns it', async () => {
    const note = makeNote({ userId: USER_ID });
    prismaMock.studentNote.findUnique.mockResolvedValue(note);
    prismaMock.studentNote.delete.mockResolvedValue(note);

    await studentNoteService.remove(NOTE_ID, USER_ID, 'student');

    expect(prismaMock.studentNote.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: NOTE_ID } }),
    );
  });

  it('throws NotFoundError when note does not exist', async () => {
    prismaMock.studentNote.findUnique.mockResolvedValue(null);

    await expect(studentNoteService.remove(NOTE_ID, USER_ID, 'student')).rejects.toThrow(NotFoundError);
  });

  it('throws FORBIDDEN when non-admin user tries to delete another user\'s note', async () => {
    const note = makeNote({ userId: 'other-user' });
    prismaMock.studentNote.findUnique.mockResolvedValue(note);

    await expect(
      studentNoteService.remove(NOTE_ID, USER_ID, 'student'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('admin can delete any note', async () => {
    const note = makeNote({ userId: 'other-user' });
    prismaMock.studentNote.findUnique.mockResolvedValue(note);
    prismaMock.studentNote.delete.mockResolvedValue(note);

    await studentNoteService.remove(NOTE_ID, 'admin-user', 'admin');

    expect(prismaMock.studentNote.delete).toHaveBeenCalled();
  });
});
