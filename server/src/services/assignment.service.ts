import { AssignmentType } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { AppError, NotFoundError } from '../errors/index.js';
import type { CreateAssignmentInput, UpdateAssignmentInput } from '../schemas/assignment.schema.js';

// ── Prisma include shape reused across queries ───────────────────────────────

const ASSIGNMENT_INCLUDE = {
  noteAssignment: true,
  videoAssignment: true,
  readingAssignment: true,
  vocabAssignment: true,
  practiceProblemAssignment: {
    include: {
      questions: { orderBy: { order: 'asc' as const } },
    },
  },
} as const;

// ── Service ──────────────────────────────────────────────────────────────────

export const assignmentService = {
  async findAllByLesson(lessonId: string, userId: string | null) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');

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
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');

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
          // videoTitle is the display title for the video — separate from the shared assignment title
          data: { assignmentId: assignment.id, url: data.url, title: data.videoTitle ?? null },
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
        await tx.vocabAssignment.create({
          data: { assignmentId: assignment.id, entries: data.entries },
        });
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
        // videoTitle is the display title for the video — separate from the shared assignment title
        if (data.videoTitle !== undefined) videoUpdates.title = data.videoTitle;
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
        await tx.vocabAssignment.update({
          where: { assignmentId },
          data: { entries: data.entries },
        });
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
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundError('Assignment not found');

    const { lessonId } = assignment;

    // Delete assignment (cascade handles all children and completions)
    await prisma.assignment.delete({ where: { id: assignmentId } });

    // Recalculate order for remaining assignments in the same lesson
    const remaining = await prisma.assignment.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
    });

    if (remaining.length > 0) {
      await prisma.$transaction(
        remaining.map((a, index) =>
          prisma.assignment.update({
            where: { id: a.id },
            data: { order: index + 1 },
          }),
        ),
      );
    }
  },

  async reorder(lessonId: string, assignmentIds: string[]) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');

    const existing = await prisma.assignment.findMany({
      where: { lessonId },
      select: { id: true },
    });

    const existingIds = new Set(existing.map((a) => a.id));

    // Validate: provided IDs must match the lesson's assignment set exactly
    if (
      assignmentIds.length !== existing.length ||
      assignmentIds.some((id) => !existingIds.has(id))
    ) {
      throw new AppError('INVALID_REORDER', 'Provided assignment IDs do not match lesson assignments', 400);
    }

    // Atomically update all order values
    await prisma.$transaction(
      assignmentIds.map((id, index) =>
        prisma.assignment.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    );

    return this.findAllByLesson(lessonId, null);
  },

  async markComplete(assignmentId: string, userId: string) {
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundError('Assignment not found');

    const completion = await prisma.assignmentCompletion.upsert({
      where: { userId_assignmentId: { userId, assignmentId } },
      create: { userId, assignmentId, completedAt: new Date() },
      update: { completedAt: new Date() },
    });

    return completion;
  },

  async markIncomplete(assignmentId: string, userId: string) {
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundError('Assignment not found');

    const completion = await prisma.assignmentCompletion.findUnique({
      where: { userId_assignmentId: { userId, assignmentId } },
    });
    if (!completion) throw new NotFoundError('Completion not found');

    await prisma.assignmentCompletion.delete({
      where: { userId_assignmentId: { userId, assignmentId } },
    });
  },
};
