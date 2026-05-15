import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must mock before importing the middleware
vi.mock('../../lib/auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn().mockReturnValue({}),
}));

import { auth } from '../../lib/auth.js';
import { authenticate } from '../../middleware/authenticate.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>;

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'student',
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSession = {
  id: 'session-1',
  userId: 'user-1',
  token: 'tok-abc',
  expiresAt: new Date(Date.now() + 3600 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ipAddress: null,
  userAgent: null,
};

describe('authenticate', () => {
  let req: ReturnType<typeof makeReq>;
  let res: ReturnType<typeof makeRes>;
  let next: ReturnType<typeof makeNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = makeReq();
    res = makeRes();
    next = makeNext();
  });

  it('injects req.user and req.session when session is valid', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: mockSession });
    const middleware = authenticate();

    await middleware(
      req as Parameters<ReturnType<typeof authenticate>>[0],
      res as Parameters<ReturnType<typeof authenticate>>[1],
      next,
    );

    expect(req.user).toMatchObject({ id: 'user-1', role: 'student' });
    expect(req.session).toBe(mockSession);
  });

  it('calls next() without error when session is valid', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: mockSession });
    const middleware = authenticate();

    await middleware(
      req as Parameters<ReturnType<typeof authenticate>>[0],
      res as Parameters<ReturnType<typeof authenticate>>[1],
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 401 UNAUTHENTICATED when getSession returns null', async () => {
    mockGetSession.mockResolvedValue(null);
    const middleware = authenticate();

    await middleware(
      req as Parameters<ReturnType<typeof authenticate>>[0],
      res as Parameters<ReturnType<typeof authenticate>>[1],
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

  it('returns 401 UNAUTHENTICATED when getSession returns undefined', async () => {
    mockGetSession.mockResolvedValue(undefined);
    const middleware = authenticate();

    await middleware(
      req as Parameters<ReturnType<typeof authenticate>>[0],
      res as Parameters<ReturnType<typeof authenticate>>[1],
      next,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('does not call next() when session is missing', async () => {
    mockGetSession.mockResolvedValue(null);
    const middleware = authenticate();

    await middleware(
      req as Parameters<ReturnType<typeof authenticate>>[0],
      res as Parameters<ReturnType<typeof authenticate>>[1],
      next,
    );

    expect(next).not.toHaveBeenCalled();
  });
});
