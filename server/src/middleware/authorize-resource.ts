import { Request, RequestHandler } from 'express';
import prisma from '../lib/prisma.js';
import { AppError, NotFoundError } from '../errors/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../lib/logger.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResourceOwnershipType =
  | 'assignment'
  | 'course'
  | 'unit'
  | 'lesson'
  | 'assessment'
  | 'lesson_assessment'
  | 'unit_assessment'
  | 'course_assessment';

// ---------------------------------------------------------------------------
// Internal: structured auth-failure logger
// ---------------------------------------------------------------------------

function logAuthFailure(userId: string, resourceId: string, action: string): void {
  logger.warn({ event: 'authorization_failure', userId, resourceId, action }, 'Authorization failure');
}

// ---------------------------------------------------------------------------
// Internal: resolve course authorId from any resource in the hierarchy
// ---------------------------------------------------------------------------

// Each case issues exactly ONE Prisma query (with nested selects compiled to a
// single JOIN). This satisfies NFR-01 (at most one additional DB query per
// request for ownership resolution).
async function resolveCourseOwner(
  resourceId: string,
  resourceType: ResourceOwnershipType,
): Promise<string | null> {
  switch (resourceType) {
    case 'course':
    case 'course_assessment': {
      const row = await prisma.course.findUnique({
        where: { id: resourceId },
        select: { authorId: true },
      });
      return row?.authorId ?? null;
    }

    case 'unit':
    case 'unit_assessment': {
      const row = await prisma.unit.findUnique({
        where: { id: resourceId },
        select: { course: { select: { authorId: true } } },
      });
      return row?.course.authorId ?? null;
    }

    case 'lesson':
    case 'lesson_assessment': {
      const row = await prisma.lesson.findUnique({
        where: { id: resourceId },
        select: { unit: { select: { course: { select: { authorId: true } } } } },
      });
      return row?.unit.course.authorId ?? null;
    }

    case 'assignment': {
      const row = await prisma.assignment.findFirst({
        where: { id: resourceId },
        select: {
          lesson: {
            select: {
              unit: {
                select: {
                  course: { select: { authorId: true } },
                },
              },
            },
          },
        },
      });
      return row?.lesson.unit.course.authorId ?? null;
    }

    case 'assessment': {
      // The Assessment record holds three optional FK branches (lessonId,
      // unitId, courseId). We select all three in one query and pick the
      // first non-null result.
      const row = await prisma.assessment.findUnique({
        where: { id: resourceId },
        select: {
          course: { select: { authorId: true } },
          unit: { select: { course: { select: { authorId: true } } } },
          lesson: {
            select: {
              unit: {
                select: {
                  course: { select: { authorId: true } },
                },
              },
            },
          },
        },
      });
      if (!row) return null;
      return (
        row.course?.authorId ??
        row.unit?.course.authorId ??
        row.lesson?.unit.course.authorId ??
        null
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Exported middleware factories
// ---------------------------------------------------------------------------

/**
 * requireCourseOwnership — middleware factory for teacher/admin course-level
 * ownership enforcement.
 *
 * Admin bypass: admins skip the DB query entirely (FR-15).
 * Non-teachers (students): skipped — student self-checks are handled
 *   separately via requireSelf or by construction in the controller.
 *
 * If the resource does not exist, throws NotFoundError (404) rather than 403
 * to prevent existence leaking.
 *
 * Designed for future enrollment extension: a future requireEnrollment()
 * factory can call resolveCourseOwner to get the courseId, then check an
 * enrollment table, without touching route handlers.
 */
export function requireCourseOwnership(
  resourceType: ResourceOwnershipType,
  getResourceId: (req: Request) => string,
): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    // Admin bypass — no DB query at all.
    if (req.user!.role === 'admin') return next();

    // Students are not subject to course ownership checks; their self-scoping
    // is handled by construction (controller stamps req.user.id) or via
    // requireStudentRole on attempt submission.
    if (req.user!.role === 'student') return next();

    // Defensive guard: if a new role is added to the system in the future,
    // it must not silently bypass ownership enforcement. The preceding
    // authorize('teacher', 'admin') middleware rejects unknown roles before
    // reaching here, but we assert the invariant explicitly so any future
    // role addition surfaces as an error rather than a silent passthrough.
    if (req.user!.role !== 'teacher') {
      throw new AppError(
        'FORBIDDEN',
        'You do not have permission to modify this resource',
        403,
      );
    }

    const resourceId = getResourceId(req);
    const authorId = await resolveCourseOwner(resourceId, resourceType);

    if (authorId === null) {
      throw new NotFoundError('Resource not found');
    }

    if (authorId !== req.user!.id) {
      logAuthFailure(req.user!.id, resourceId, `${req.method} ${req.path}`);
      throw new AppError('FORBIDDEN', 'You do not have permission to modify this resource', 403);
    }

    next();
  });
}

/**
 * requireSelf — middleware factory for student-owned records where a body or
 * param could name a different user.
 *
 * If getUserId returns undefined the record will be stamped with req.user.id
 * by the controller, which is safe by construction — no check needed.
 */
export function requireSelf(
  getUserId: (req: Request) => string | undefined,
): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const targetUserId = getUserId(req);
    if (targetUserId === undefined) return next();

    if (targetUserId !== req.user!.id && req.user!.role !== 'admin') {
      logAuthFailure(req.user!.id, targetUserId, `${req.method} ${req.path}`);
      throw new AppError('FORBIDDEN', 'You do not have permission to modify this resource', 403);
    }

    next();
  });
}

/**
 * requireStudentRole — gate that allows only students through.
 *
 * Used on POST /assessments/:assessmentId/attempts (FR-13). Teachers and
 * admins must not be able to submit assessment attempts.
 */
export function requireStudentRole(): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    if (req.user!.role !== 'student') {
      const resourceId = (req.params['assessmentId'] as string) ?? '';
      logAuthFailure(req.user!.id, resourceId, `${req.method} ${req.path}`);
      throw new AppError('FORBIDDEN', 'Only students can submit assessment attempts', 403);
    }
    next();
  });
}

// Export the internal helper for use in tests.
export { logAuthFailure };
