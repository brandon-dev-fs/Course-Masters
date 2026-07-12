import prisma from '../lib/prisma.js';

import { NotFoundError, AppError } from '../errors/index.js';
import type { ReorderItem } from '../schemas/builder.schema.js';

export const builderService = {
  async getOutline(courseId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        assessment: {
          where: { deletedAt: null },
          select: {
            id: true,
            type: true,
            _count: { select: { questions: true } },
          },
        },
        units: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            assessment: {
              where: { deletedAt: null },
              select: {
                id: true,
                type: true,
                _count: { select: { questions: true } },
              },
            },
            lessons: {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                objective: true,
                planContent: true,
                assignments: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    type: true,
                    order: true,
                  },
                },
                assessment: {
                  where: { deletedAt: null },
                  select: {
                    id: true,
                    type: true,
                    _count: { select: { questions: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) throw new NotFoundError('Course not found');

    // Transform to response shape
    const units = course.units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      description: unit.description,
      order: unit.order,
      lessons: unit.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        hasLessonPlan: (lesson.objective ?? '') !== '' || Object.keys((lesson.planContent as object) ?? {}).length > 0,
        assignments: lesson.assignments.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          order: a.order,
        })),
        assessment: lesson.assessment
          ? {
              id: lesson.assessment.id,
              type: lesson.assessment.type,
              questionCount: lesson.assessment._count.questions,
            }
          : null,
      })),
      assessment: unit.assessment
        ? {
            id: unit.assessment.id,
            type: unit.assessment.type,
            questionCount: unit.assessment._count.questions,
          }
        : null,
    }));

    const courseAssessment = course.assessment
      ? {
          id: course.assessment.id,
          type: course.assessment.type,
          questionCount: course.assessment._count.questions,
        }
      : null;

    return {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
      },
      units,
      courseAssessment,
    };
  },

  async reorderUnits(courseId: string, items: ReorderItem[]) {
    const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
    if (!course) throw new NotFoundError('Course not found');

    await prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM "unit"
          WHERE "courseId" = ${courseId} AND "deletedAt" IS NULL
          FOR UPDATE
        `;

        const lockedIds = new Set(locked.map((r) => r.id));
        const itemIds = new Set(items.map((item) => item.id));

        if (
          items.length !== locked.length ||
          items.some((item) => !lockedIds.has(item.id)) ||
          locked.some((r) => !itemIds.has(r.id))
        ) {
          throw new AppError(
            'VALIDATION_ERROR',
            'Provided unit IDs do not match course units',
            400,
          );
        }

        await Promise.all(
          items.map((item) =>
            tx.unit.update({
              where: { id: item.id },
              data: { order: item.order },
            }),
          ),
        );
      },
      { isolationLevel: 'Serializable' },
    );
  },

  async reorderLessons(unitId: string, items: ReorderItem[]) {
    const unit = await prisma.unit.findFirst({ where: { id: unitId, deletedAt: null } });
    if (!unit) throw new NotFoundError('Unit not found');

    await prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM "lesson"
          WHERE "unitId" = ${unitId} AND "deletedAt" IS NULL
          FOR UPDATE
        `;

        const lockedIds = new Set(locked.map((r) => r.id));
        const itemIds = new Set(items.map((item) => item.id));

        if (
          items.length !== locked.length ||
          items.some((item) => !lockedIds.has(item.id)) ||
          locked.some((r) => !itemIds.has(r.id))
        ) {
          throw new AppError(
            'VALIDATION_ERROR',
            'Provided lesson IDs do not match unit lessons',
            400,
          );
        }

        await Promise.all(
          items.map((item) =>
            tx.lesson.update({
              where: { id: item.id },
              data: { order: item.order },
            }),
          ),
        );
      },
      { isolationLevel: 'Serializable' },
    );
  },
};
