import { AssignmentType } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { AppError, NotFoundError } from '../errors/index.js';
import { assertExists } from '../utils/assertExists.js';
import type { CreateAssignmentInput, UpdateAssignmentInput } from '../schemas/assignment.schema.js';

// ── Prisma include shape reused across queries ───────────────────────────────

const ASSIGNMENT_INCLUDE = {
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
} as const;

// ── Service ──────────────────────────────────────────────────────────────────

export const assignmentService = {
  async findAllByLesson(lessonId: string, userId: string | null) {
    await assertExists(prisma.lesson, lessonId, 'Lesson');

    const assignments = await prisma.assignment.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
      include: ASSIGNMENT_INCLUDE,
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

    return assignments.map((a) => ({ ...a, completed: completedSet.has(a.id) }));
  },

  async findById(assignmentId: string, userId: string | null) {
    // Inline check retained: findUnique with include cannot be expressed
    // through the assertExists delegate without losing the typed return shape.
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: ASSIGNMENT_INCLUDE,
    });
    if (!assignment) throw new NotFoundError('Assignment not found');

    let completed = false;
    if (userId) {
      const completion = await prisma.assignmentCompletion.findUnique({
        where: { userId_assignmentId: { userId, assignmentId } },
      });
      completed = !!completion;
    }

    return { ...assignment, completed };
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
          // displayTitle maps to VideoAssignment.title — separate from the shared assignment title
          data: { assignmentId: assignment.id, url: data.url, title: data.displayTitle ?? null },
        });
      } else if (data.type === 'reading') {
        await tx.readingAssignment.create({
          data: {
            assignmentId: assignment.id,
            url: data.url,
            description: data.description ?? null,
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
        const videoUpdates: { url?: string; title?: string } = {};
        if (data.url !== undefined) videoUpdates.url = data.url;
        // displayTitle maps to VideoAssignment.title — separate from the shared assignment title
        if (data.displayTitle !== undefined) videoUpdates.title = data.displayTitle;
        if (Object.keys(videoUpdates).length > 0) {
          await tx.videoAssignment.update({ where: { assignmentId }, data: videoUpdates });
        }
      } else if (assignment.type === AssignmentType.reading) {
        const readingUpdates: { url?: string; description?: string | null; estimatedMinutes?: number | null } = {};
        if (data.url !== undefined) readingUpdates.url = data.url;
        if (data.description !== undefined) readingUpdates.description = data.description;
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
                where: { id: e.id },
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
    // Inline check retained: we need lessonId from the record for order recalculation.
    // assertExists would require a second query to retrieve the same record.
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundError('Assignment not found');

    const { lessonId } = assignment;

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
    const saved = await prisma.studentVocabAssignmentFlashCard.findMany({
      where: { userId, entry: { vocabAssignment: { assignment: { lessonId } } } },
      include: { entry: true },
    });
    return saved.map(s => s.entry);
  },

  async saveVocabEntryFlashCard(entryId: string, userId: string) {
    const entry = await prisma.vocabAssignmentEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundError('Vocab entry not found');
    return prisma.studentVocabAssignmentFlashCard.create({ data: { userId, entryId } });
  },

  async removeVocabEntryFlashCard(entryId: string, userId: string) {
    const record = await prisma.studentVocabAssignmentFlashCard.findUnique({
      where: { userId_entryId: { userId, entryId } },
    });
    if (!record) throw new NotFoundError('Saved vocab entry not found');
    await prisma.studentVocabAssignmentFlashCard.delete({ where: { userId_entryId: { userId, entryId } } });
  },
};
