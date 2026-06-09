import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma.js';

vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }));

vi.mock('../../lib/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import {
  requireCourseOwnership,
  requireSelf,
  requireStudentRole,
} from '../../middleware/authorize-resource.js';
import { AppError } from '../../errors/AppError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const OWNER_ID = 'user-owner';
const OTHER_USER_ID = 'user-other';
const ADMIN_ID = 'user-admin';
const COURSE_ID = 'course-1';

describe('requireCourseOwnership', () => {
  let res: ReturnType<typeof makeRes>;
  let next: ReturnType<typeof makeNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    res = makeRes();
    next = makeNext();
  });

  // requireCourseOwnership wraps asyncHandler, which returns void — not a Promise.
  // resolveCourseOwner has its own internal await (the prisma call), so next() fires
  // two microtask levels deep. Calling middleware synchronously then flushing three
  // times ensures all pending microtasks (prisma resolve → fn continue → .catch fire)
  // have run before the assertion.
  async function flushMiddleware(
    mw: ReturnType<typeof requireCourseOwnership>,
    req: ReturnType<typeof makeReq>,
  ) {
    mw(
      req as Parameters<ReturnType<typeof requireCourseOwnership>>[0],
      res as unknown as Parameters<ReturnType<typeof requireCourseOwnership>>[1],
      next,
    );
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }

  it('calls next() when teacher owns the course', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ authorId: OWNER_ID });
    const req = makeReq({
      user: { id: OWNER_ID, role: 'teacher' },
      params: { courseId: COURSE_ID },
    });

    await flushMiddleware(
      requireCourseOwnership('course', (r) => r.params['courseId'] as string),
      req,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('throws NotFoundError when course does not exist (authorId null)', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);
    const req = makeReq({
      user: { id: OWNER_ID, role: 'teacher' },
      params: { courseId: COURSE_ID },
    });

    await flushMiddleware(
      requireCourseOwnership('course', (r) => r.params['courseId'] as string),
      req,
    );

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it('throws FORBIDDEN when teacher does not own the resource', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ authorId: OTHER_USER_ID });
    const req = makeReq({
      user: { id: OWNER_ID, role: 'teacher' },
      params: { courseId: COURSE_ID },
    });

    await flushMiddleware(
      requireCourseOwnership('course', (r) => r.params['courseId'] as string),
      req,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'FORBIDDEN', statusCode: 403 }),
    );
  });

  it('bypasses DB query and calls next() for admin role', async () => {
    const req = makeReq({
      user: { id: ADMIN_ID, role: 'admin' },
      params: { courseId: COURSE_ID },
    });

    const middleware = requireCourseOwnership('course', (r) => r.params['courseId'] as string);
    await middleware(
      req as Parameters<ReturnType<typeof requireCourseOwnership>>[0],
      res as unknown as Parameters<ReturnType<typeof requireCourseOwnership>>[1],
      next,
    );

    expect(prismaMock.course.findUnique).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('bypasses ownership check and calls next() for student role', async () => {
    const req = makeReq({
      user: { id: 'student-1', role: 'student' },
      params: { courseId: COURSE_ID },
    });

    const middleware = requireCourseOwnership('course', (r) => r.params['courseId'] as string);
    await middleware(
      req as Parameters<ReturnType<typeof requireCourseOwnership>>[0],
      res as unknown as Parameters<ReturnType<typeof requireCourseOwnership>>[1],
      next,
    );

    expect(prismaMock.course.findUnique).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('throws FORBIDDEN for unknown role that is not admin/teacher/student', async () => {
    const req = makeReq({
      user: { id: 'user-unknown', role: 'moderator' },
      params: { courseId: COURSE_ID },
    });

    const middleware = requireCourseOwnership('course', (r) => r.params['courseId'] as string);
    await middleware(
      req as Parameters<ReturnType<typeof requireCourseOwnership>>[0],
      res as unknown as Parameters<ReturnType<typeof requireCourseOwnership>>[1],
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'FORBIDDEN' }));
  });
});

describe('requireSelf', () => {
  let res: ReturnType<typeof makeRes>;
  let next: ReturnType<typeof makeNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    res = makeRes();
    next = makeNext();
  });

  it('calls next() when target userId matches req.user.id', async () => {
    const req = makeReq({
      user: { id: 'user-1', role: 'student' },
      params: { userId: 'user-1' },
    });

    const middleware = requireSelf((r) => r.params['userId'] as string);
    await middleware(
      req as Parameters<ReturnType<typeof requireSelf>>[0],
      res as unknown as Parameters<ReturnType<typeof requireSelf>>[1],
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('throws FORBIDDEN when target userId does not match req.user.id', async () => {
    const req = makeReq({
      user: { id: 'user-1', role: 'student' },
      params: { userId: 'user-2' },
    });

    const middleware = requireSelf((r) => r.params['userId'] as string);
    await middleware(
      req as Parameters<ReturnType<typeof requireSelf>>[0],
      res as unknown as Parameters<ReturnType<typeof requireSelf>>[1],
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'FORBIDDEN', statusCode: 403 }),
    );
  });

  it('admin bypasses self-check and calls next()', async () => {
    const req = makeReq({
      user: { id: ADMIN_ID, role: 'admin' },
      params: { userId: 'user-2' },
    });

    const middleware = requireSelf((r) => r.params['userId'] as string);
    await middleware(
      req as Parameters<ReturnType<typeof requireSelf>>[0],
      res as unknown as Parameters<ReturnType<typeof requireSelf>>[1],
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when getUserId returns undefined (no check needed)', async () => {
    const req = makeReq({
      user: { id: 'user-1', role: 'student' },
    });

    const middleware = requireSelf(() => undefined);
    await middleware(
      req as Parameters<ReturnType<typeof requireSelf>>[0],
      res as unknown as Parameters<ReturnType<typeof requireSelf>>[1],
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });
});

describe('requireStudentRole', () => {
  let res: ReturnType<typeof makeRes>;
  let next: ReturnType<typeof makeNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    res = makeRes();
    next = makeNext();
  });

  it('calls next() for student role', async () => {
    const req = makeReq({
      user: { id: 'student-1', role: 'student' },
      params: { assessmentId: 'a-1' },
      method: 'POST',
      path: '/assessments/a-1/attempts',
    });

    const middleware = requireStudentRole();
    await middleware(
      req as Parameters<ReturnType<typeof requireStudentRole>>[0],
      res as unknown as Parameters<ReturnType<typeof requireStudentRole>>[1],
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('throws FORBIDDEN for teacher role', async () => {
    const req = makeReq({
      user: { id: 'teacher-1', role: 'teacher' },
      params: { assessmentId: 'a-1' },
      method: 'POST',
      path: '/assessments/a-1/attempts',
    });

    const middleware = requireStudentRole();
    await middleware(
      req as Parameters<ReturnType<typeof requireStudentRole>>[0],
      res as unknown as Parameters<ReturnType<typeof requireStudentRole>>[1],
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'FORBIDDEN', statusCode: 403 }),
    );
  });

  it('throws FORBIDDEN for admin role', async () => {
    const req = makeReq({
      user: { id: ADMIN_ID, role: 'admin' },
      params: { assessmentId: 'a-1' },
      method: 'POST',
      path: '/assessments/a-1/attempts',
    });

    const middleware = requireStudentRole();
    await middleware(
      req as Parameters<ReturnType<typeof requireStudentRole>>[0],
      res as unknown as Parameters<ReturnType<typeof requireStudentRole>>[1],
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'FORBIDDEN', statusCode: 403 }),
    );
  });
});
