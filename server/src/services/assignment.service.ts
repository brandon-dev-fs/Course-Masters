import { randomUUID } from 'node:crypto';

import { AssignmentType } from '@prisma/client';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';

import prisma from '../lib/prisma.js';
import { s3Client, S3_BUCKET } from '../lib/s3.js';
import { logger } from '../lib/logger.js';
import { AppError, NotFoundError, ValidationError } from '../errors/index.js';
import { assertExists } from '../utils/assertExists.js';
import type { CreateAssignmentInput, UpdateAssignmentInput } from '../schemas/assignment.schema.js';

// ── Prisma include shape reused across queries ───────────────────────────────

function buildAssignmentInclude(userId: string | null) {
  return {
    noteAssignment: true,
    videoAssignment: true,
    readingAssignment: true,
    vocabAssignment: {
      include: {
        entries: { orderBy: { order: 'asc' as const } },
      },
    },
    practiceProblemAssignment: {
      include: {
        questions: { orderBy: { order: 'asc' as const } },
      },
    },
    fileAssignment: {
      select: {
        id: true,
        assignmentId: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
      },
    },
    ...(userId
      ? {
          bookmarks: {
            where: { userId },
            select: { id: true, note: true, updatedAt: true },
          },
        }
      : {}),
  } as const;
}

// Normalize the bookmarks array (filtered by userId) to a single bookmark or null
function normalizeBookmark(
  bookmarks: Array<{ id: string; note: string; updatedAt: Date }> | undefined,
) {
  return bookmarks && bookmarks.length > 0 ? bookmarks[0] : null;
}

// ── File upload helpers ───────────────────────────────────────────────────────

/**
 * Validates that the file buffer's magic bytes match the declared MIME type.
 * This prevents clients from bypassing the MIME type filter by spoofing the
 * Content-Type header on the multipart upload.
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const header = buffer.subarray(0, 8);

  const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
  // OOXML formats (DOCX, PPTX) are ZIP archives
  const isOoxmlZip = header[0] === 0x50 && header[1] === 0x4B && header[2] === 0x03 && header[3] === 0x04;
  // Legacy OLE2 compound document format (PPT)
  const isOle2 = header[0] === 0xD0 && header[1] === 0xCF && header[2] === 0x11 && header[3] === 0xE0;

  switch (mimeType) {
    case 'application/pdf':
      return isPdf;
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return isOoxmlZip;
    case 'application/vnd.ms-powerpoint':
      return isOle2;
    case 'text/plain':
      // No magic bytes for plain text — reject if null bytes are present (binary heuristic)
      return !buffer.includes(0x00);
    default:
      return false;
  }
}

// ── Service ──────────────────────────────────────────────────────────────────

export const assignmentService = {
  async findAllByLesson(lessonId: string, userId: string | null) {
    await assertExists(prisma.lesson, lessonId, 'Lesson');

    const assignments = await prisma.assignment.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
      include: buildAssignmentInclude(userId),
    });

    const completedSet = new Set<string>();
    if (userId) {
      const completions = await prisma.assignmentCompletion.findMany({
        where: {
          assignmentId: { in: assignments.map((a) => a.id) },
          userId,
        },
        select: { assignmentId: true },
      });
      completions.forEach((c) => completedSet.add(c.assignmentId));
    }

    return assignments.map((a) => {
      const { bookmarks, ...rest } = a as typeof a & { bookmarks?: Array<{ id: string; note: string; updatedAt: Date }> };
      return {
        ...rest,
        completed: completedSet.has(a.id),
        bookmark: normalizeBookmark(bookmarks),
      };
    });
  },

  async findById(assignmentId: string, userId: string | null) {
    // Inline check retained: findUnique with include cannot be expressed
    // through the assertExists delegate without losing the typed return shape.
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: buildAssignmentInclude(userId),
    });
    if (!assignment) throw new NotFoundError('Assignment not found');

    let completed = false;
    if (userId) {
      const completion = await prisma.assignmentCompletion.findUnique({
        where: { userId_assignmentId: { userId, assignmentId } },
      });
      completed = !!completion;
    }

    const { bookmarks, ...rest } = assignment as typeof assignment & { bookmarks?: Array<{ id: string; note: string; updatedAt: Date }> };
    return {
      ...rest,
      completed,
      bookmark: normalizeBookmark(bookmarks),
    };
  },

  async create(lessonId: string, data: CreateAssignmentInput) {
    await assertExists(prisma.lesson, lessonId, 'Lesson');

    const result = await prisma.$transaction(async (tx) => {
      // Determine next order value
      const agg = await tx.assignment.aggregate({
        where: { lessonId },
        _max: { order: true },
      });
      const nextOrder = (agg._max.order ?? 0) + 1;

      // Create parent Assignment
      // data.title is guaranteed by all union branches (baseAssignmentFields)
      const parentTitle = data.title as string;
      const assignment = await tx.assignment.create({
        data: {
          lessonId,
          order: nextOrder,
          title: parentTitle,
          objective: data.objective,
          type: data.type as AssignmentType,
        },
      });

      // Create type-specific child record
      if (data.type === 'note') {
        await tx.noteAssignment.create({
          data: { assignmentId: assignment.id, content: data.content },
        });
      } else if (data.type === 'video') {
        await tx.videoAssignment.create({
          data: { assignmentId: assignment.id, url: data.url },
        });
      } else if (data.type === 'reading') {
        await tx.readingAssignment.create({
          data: {
            assignmentId: assignment.id,
            url: data.url,
            estimatedMinutes: data.estimatedMinutes ?? null,
          },
        });
      } else if (data.type === 'vocab') {
        const va = await tx.vocabAssignment.create({
          data: { assignmentId: assignment.id },
        });
        if (data.entries.length > 0) {
          await tx.vocabAssignmentEntry.createMany({
            data: data.entries.map((e, i) => ({
              vocabAssignmentId: va.id,
              term: e.term,
              definition: e.definition,
              example: e.example ?? null,
              order: i + 1,
            })),
          });
        }
      } else if (data.type === 'practice_problem') {
        const ppa = await tx.practiceProblemAssignment.create({
          data: {
            assignmentId: assignment.id,
            passingPercentage: data.passingPercentage ?? null,
          },
        });
        if (data.questions && data.questions.length > 0) {
          await tx.practiceProblemQuestion.createMany({
            data: data.questions.map((q) => ({
              practiceProblemAssignmentId: ppa.id,
              order: q.order,
              type: q.type,
              content: q.content,
            })),
          });
        }
      }

      return assignment;
    });

    return this.findById(result.id, null);
  },

  async update(assignmentId: string, data: UpdateAssignmentInput) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { practiceProblemAssignment: true },
    });
    if (!assignment) throw new NotFoundError('Assignment not found');

    await prisma.$transaction(async (tx) => {
      // Update shared fields if provided
      const sharedUpdates: { title?: string; objective?: string } = {};
      if (data.title !== undefined) sharedUpdates.title = data.title;
      if (data.objective !== undefined) sharedUpdates.objective = data.objective;
      if (Object.keys(sharedUpdates).length > 0) {
        await tx.assignment.update({ where: { id: assignmentId }, data: sharedUpdates });
      }

      // Update type-specific child record
      if (assignment.type === AssignmentType.note && data.content !== undefined) {
        await tx.noteAssignment.update({
          where: { assignmentId },
          data: { content: data.content },
        });
      } else if (assignment.type === AssignmentType.video) {
        const videoUpdates: { url?: string } = {};
        if (data.url !== undefined) videoUpdates.url = data.url;
        if (Object.keys(videoUpdates).length > 0) {
          await tx.videoAssignment.update({ where: { assignmentId }, data: videoUpdates });
        }
      } else if (assignment.type === AssignmentType.reading) {
        const readingUpdates: { url?: string; estimatedMinutes?: number | null } = {};
        if (data.url !== undefined) readingUpdates.url = data.url;
        if (data.estimatedMinutes !== undefined) readingUpdates.estimatedMinutes = data.estimatedMinutes;
        if (Object.keys(readingUpdates).length > 0) {
          await tx.readingAssignment.update({ where: { assignmentId }, data: readingUpdates });
        }
      } else if (assignment.type === AssignmentType.vocab && data.entries !== undefined) {
        const va = await tx.vocabAssignment.findUnique({ where: { assignmentId } });
        if (va) {
          const incomingIds = data.entries.filter(e => e.id).map(e => e.id!);
          // Delete entries not present in the incoming list
          await tx.vocabAssignmentEntry.deleteMany({
            where: { vocabAssignmentId: va.id, id: { notIn: incomingIds } },
          });
          // Update existing or create new entries
          for (let i = 0; i < data.entries.length; i++) {
            const e = data.entries[i];
            if (e.id) {
              await tx.vocabAssignmentEntry.update({
                where: { id: e.id, vocabAssignmentId: va.id },
                data: { term: e.term, definition: e.definition, example: e.example ?? null, order: i + 1 },
              });
            } else {
              await tx.vocabAssignmentEntry.create({
                data: { vocabAssignmentId: va.id, term: e.term, definition: e.definition, example: e.example ?? null, order: i + 1 },
              });
            }
          }
        }
      } else if (assignment.type === AssignmentType.practice_problem) {
        const ppaUpdates: { passingPercentage?: number | null } = {};
        if (data.passingPercentage !== undefined) ppaUpdates.passingPercentage = data.passingPercentage;
        if (Object.keys(ppaUpdates).length > 0) {
          await tx.practiceProblemAssignment.update({ where: { assignmentId }, data: ppaUpdates });
        }

        // Full replace of questions if provided
        if (data.questions !== undefined && assignment.practiceProblemAssignment) {
          await tx.practiceProblemQuestion.deleteMany({
            where: { practiceProblemAssignmentId: assignment.practiceProblemAssignment.id },
          });
          if (data.questions.length > 0) {
            await tx.practiceProblemQuestion.createMany({
              data: data.questions.map((q) => ({
                practiceProblemAssignmentId: assignment.practiceProblemAssignment!.id,
                order: q.order,
                type: q.type,
                content: q.content,
              })),
            });
          }
        }
      }
    });

    return this.findById(assignmentId, null);
  },

  async remove(assignmentId: string) {
    // Inline check retained: we need lessonId + type from the record for order
    // recalculation and S3 cleanup.
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { fileAssignment: { select: { storageKey: true } } },
    });
    if (!assignment) throw new NotFoundError('Assignment not found');

    const { lessonId } = assignment;
    const storageKey =
      assignment.type === AssignmentType.file ? assignment.fileAssignment?.storageKey ?? null : null;

    // Delete + order recalculation run atomically to prevent gaps under concurrency
    await prisma.$transaction(async (tx) => {
      // Delete the assignment (cascade handles all children and completions)
      await tx.assignment.delete({ where: { id: assignmentId } });

      // Recalculate order for remaining assignments in the same lesson
      const remaining = await tx.assignment.findMany({
        where: { lessonId },
        orderBy: { order: 'asc' },
      });

      if (remaining.length > 0) {
        await Promise.all(
          remaining.map((a, index) =>
            tx.assignment.update({
              where: { id: a.id },
              data: { order: index + 1 },
            }),
          ),
        );
      }
    });

    // After successful DB commit, clean up S3 object (best-effort)
    if (storageKey && s3Client && S3_BUCKET) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: storageKey }));
      } catch (err) {
        logger.warn({ assignmentId, storageKey, err }, 'Failed to delete S3 object after assignment removal');
      }
    }
  },

  async createFileAssignment(
    lessonId: string,
    data: { title: string; objective?: string; file: Express.Multer.File },
  ) {
    await assertExists(prisma.lesson, lessonId, 'Lesson');

    if (!s3Client || !S3_BUCKET) {
      throw new AppError('S3_NOT_CONFIGURED', 'File storage is not configured', 500);
    }

    // Validate file content against declared MIME type using magic bytes
    if (!validateMagicBytes(data.file.buffer, data.file.mimetype)) {
      throw new ValidationError('File content does not match the declared file type', {
        file: ['File content does not match the declared file type'],
      });
    }

    // Sanitize filename: keep only safe characters, truncate to 255 chars
    const safeFilename = (data.file.originalname
      .replace(/[^\w.\-]/g, '_')
      .slice(0, 255)) || 'upload';

    const storageKey = `assignments/${randomUUID()}/${safeFilename}`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: storageKey,
          Body: data.file.buffer,
          ContentType: data.file.mimetype,
          ContentLength: data.file.size,
        }),
      );
    } catch (err) {
      logger.error({ lessonId, storageKey, err }, 'S3 upload failed');
      throw new AppError('UPLOAD_FAILED', 'Failed to upload file to storage', 500);
    }

    let assignmentId: string;
    try {
      const result = await prisma.$transaction(async (tx) => {
        const agg = await tx.assignment.aggregate({
          where: { lessonId },
          _max: { order: true },
        });
        const nextOrder = (agg._max.order ?? 0) + 1;

        const assignment = await tx.assignment.create({
          data: {
            lessonId,
            order: nextOrder,
            title: data.title,
            objective: data.objective,
            type: AssignmentType.file,
          },
        });

        await tx.fileAssignment.create({
          data: {
            assignmentId: assignment.id,
            filename: safeFilename,
            mimeType: data.file.mimetype,
            sizeBytes: data.file.size,
            storageKey,
          },
        });

        return assignment;
      });
      assignmentId = result.id;
    } catch (err) {
      // Transaction failed — clean up orphaned S3 object before re-throwing
      if (s3Client && S3_BUCKET) {
        try {
          await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: storageKey }));
        } catch (cleanupErr) {
          logger.warn({ storageKey, cleanupErr }, 'S3 compensating delete failed — orphan object may exist');
        }
      }
      throw err;
    }

    return this.findById(assignmentId, null);
  },

  async getFileStream(assignmentId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        fileAssignment: {
          select: { filename: true, mimeType: true, sizeBytes: true, storageKey: true },
        },
      },
    });

    if (!assignment || assignment.type !== AssignmentType.file || !assignment.fileAssignment) {
      throw new NotFoundError('File assignment not found');
    }

    if (!s3Client || !S3_BUCKET) {
      throw new AppError('S3_NOT_CONFIGURED', 'File storage is not configured', 500);
    }

    const { filename, mimeType, sizeBytes, storageKey } = assignment.fileAssignment;

    let response;
    try {
      response = await s3Client.send(
        new GetObjectCommand({ Bucket: S3_BUCKET, Key: storageKey }),
      );
    } catch (err) {
      logger.error({ assignmentId, storageKey, err }, 'S3 download failed');
      throw new AppError('DOWNLOAD_FAILED', 'Failed to retrieve file from storage', 500);
    }

    return {
      stream: response.Body as Readable,
      filename,
      mimeType,
      sizeBytes,
    };
  },

  async reorder(lessonId: string, assignmentIds: string[]) {
    await assertExists(prisma.lesson, lessonId, 'Lesson');

    await prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM "Assignment"
          WHERE "lessonId" = ${lessonId}
          FOR UPDATE
        `;

        const lockedIds = new Set(locked.map((r) => r.id));
        if (
          assignmentIds.length !== locked.length ||
          assignmentIds.some((id) => !lockedIds.has(id))
        ) {
          throw new AppError('INVALID_REORDER', 'Provided assignment IDs do not match lesson assignments', 400);
        }

        await Promise.all(
          assignmentIds.map((id, index) =>
            tx.assignment.update({
              where: { id },
              data: { order: index + 1 },
            }),
          ),
        );
      },
      { isolationLevel: 'Serializable' },
    );

    return this.findAllByLesson(lessonId, null);
  },

  async markComplete(assignmentId: string, userId: string) {
    await assertExists(prisma.assignment, assignmentId, 'Assignment');

    const completion = await prisma.assignmentCompletion.upsert({
      where: { userId_assignmentId: { userId, assignmentId } },
      create: { userId, assignmentId, completedAt: new Date() },
      update: { completedAt: new Date() },
    });

    return completion;
  },

  async markIncomplete(assignmentId: string, userId: string) {
    await assertExists(prisma.assignment, assignmentId, 'Assignment');

    const completion = await prisma.assignmentCompletion.findUnique({
      where: { userId_assignmentId: { userId, assignmentId } },
    });
    if (!completion) throw new NotFoundError('Completion not found');

    await prisma.assignmentCompletion.delete({
      where: { userId_assignmentId: { userId, assignmentId } },
    });
  },

  async getSavedVocabEntryFlashCards(lessonId: string, userId: string) {
    const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, deletedAt: null } });
    if (!lesson) throw new NotFoundError('Lesson not found');

    const saved = await prisma.studentVocabAssignmentFlashCard.findMany({
      where: { userId, entry: { vocabAssignment: { assignment: { lessonId } } } },
      orderBy: { entry: { order: 'asc' } },
      select: {
        entry: {
          select: { id: true, term: true, definition: true, example: true, order: true },
        },
      },
    });
    return saved.map(s => s.entry);
  },

  async saveVocabEntryFlashCard(entryId: string, userId: string) {
    const entry = await prisma.vocabAssignmentEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundError('Vocab entry not found');
    return prisma.studentVocabAssignmentFlashCard.create({
      data: { userId, entryId },
      select: { id: true, entryId: true, createdAt: true },
    });
  },

  async removeVocabEntryFlashCard(entryId: string, userId: string) {
    const record = await prisma.studentVocabAssignmentFlashCard.findUnique({
      where: { userId_entryId: { userId, entryId } },
    });
    if (!record) throw new NotFoundError('Saved vocab entry not found');
    await prisma.studentVocabAssignmentFlashCard.delete({ where: { userId_entryId: { userId, entryId } } });
  },
};
