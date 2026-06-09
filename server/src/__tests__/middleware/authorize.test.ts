import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authorize } from '../../middleware/authorize.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

describe('authorize', () => {
  let res: ReturnType<typeof makeRes>;
  let next: ReturnType<typeof makeNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    res = makeRes();
    next = makeNext();
  });

  it('calls next() when user role matches a single allowed role', () => {
    const req = makeReq({ user: { id: 'u-1', role: 'teacher' } });
    const middleware = authorize('teacher');

    middleware(
      req as Parameters<ReturnType<typeof authorize>>[0],
      res as unknown as Parameters<ReturnType<typeof authorize>>[1],
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when user role is in the allowed roles list', () => {
    const req = makeReq({ user: { id: 'u-1', role: 'admin' } });
    const middleware = authorize('teacher', 'admin');

    middleware(
      req as Parameters<ReturnType<typeof authorize>>[0],
      res as unknown as Parameters<ReturnType<typeof authorize>>[1],
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 403 FORBIDDEN when user role is not in allowed roles', () => {
    const req = makeReq({ user: { id: 'u-1', role: 'student' } });
    const middleware = authorize('teacher', 'admin');

    middleware(
      req as Parameters<ReturnType<typeof authorize>>[0],
      res as unknown as Parameters<ReturnType<typeof authorize>>[1],
      next,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'FORBIDDEN' }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 UNAUTHENTICATED when req.user is null', () => {
    const req = makeReq({ user: null });
    const middleware = authorize('teacher');

    middleware(
      req as Parameters<ReturnType<typeof authorize>>[0],
      res as unknown as Parameters<ReturnType<typeof authorize>>[1],
      next,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'UNAUTHENTICATED' }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('allows student role when student is in allowed list', () => {
    const req = makeReq({ user: { id: 'u-1', role: 'student' } });
    const middleware = authorize('student', 'teacher', 'admin');

    middleware(
      req as Parameters<ReturnType<typeof authorize>>[0],
      res as unknown as Parameters<ReturnType<typeof authorize>>[1],
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('blocks teacher role when only student is allowed', () => {
    const req = makeReq({ user: { id: 'u-1', role: 'teacher' } });
    const middleware = authorize('student');

    middleware(
      req as Parameters<ReturnType<typeof authorize>>[0],
      res as unknown as Parameters<ReturnType<typeof authorize>>[1],
      next,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
