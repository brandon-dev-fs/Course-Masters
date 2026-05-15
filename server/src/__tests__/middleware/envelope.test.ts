import { describe, it, expect, vi, beforeEach } from 'vitest';
import { envelopeMiddleware } from '../../middleware/envelope.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

describe('envelopeMiddleware', () => {
  let req: ReturnType<typeof makeReq>;
  let res: ReturnType<typeof makeRes>;
  let next: ReturnType<typeof makeNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = makeReq();
    res = makeRes();
    next = makeNext();
  });

  it('calls next() to continue the middleware chain', () => {
    envelopeMiddleware(
      req as Parameters<typeof envelopeMiddleware>[0],
      res as Parameters<typeof envelopeMiddleware>[1],
      next,
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it('wraps payload in { data: payload } for 200 responses', () => {
    const captured: unknown[] = [];
    const originalJson = vi.fn().mockImplementation((payload: unknown) => {
      captured.push(payload);
      return res;
    });
    // Create a fresh res with a real json tracking
    const freshRes = makeRes();
    freshRes.statusCode = 200;
    freshRes.json = originalJson;

    envelopeMiddleware(
      req as Parameters<typeof envelopeMiddleware>[0],
      freshRes as Parameters<typeof envelopeMiddleware>[1],
      next,
    );

    // The middleware replaced res.json; now call it
    freshRes.json({ id: '123', name: 'Test' });

    expect(captured[0]).toEqual({ data: { id: '123', name: 'Test' } });
  });

  it('does not wrap payload for responses with statusCode >= 400', () => {
    const captured: unknown[] = [];
    const originalJson = vi.fn().mockImplementation((payload: unknown) => {
      captured.push(payload);
      return res;
    });
    const freshRes = makeRes();
    freshRes.statusCode = 404;
    freshRes.json = originalJson;

    envelopeMiddleware(
      req as Parameters<typeof envelopeMiddleware>[0],
      freshRes as Parameters<typeof envelopeMiddleware>[1],
      next,
    );

    const errorPayload = { error: { code: 'NOT_FOUND', message: 'Not found' } };
    freshRes.json(errorPayload);

    expect(captured[0]).toEqual(errorPayload);
    expect(captured[0]).not.toHaveProperty('data');
  });

  it('does not wrap null payload', () => {
    const captured: unknown[] = [];
    const originalJson = vi.fn().mockImplementation((payload: unknown) => {
      captured.push(payload);
      return res;
    });
    const freshRes = makeRes();
    freshRes.statusCode = 200;
    freshRes.json = originalJson;

    envelopeMiddleware(
      req as Parameters<typeof envelopeMiddleware>[0],
      freshRes as Parameters<typeof envelopeMiddleware>[1],
      next,
    );

    freshRes.json(null);

    expect(captured[0]).toEqual({ data: null });
  });

  it('does not wrap for 500 status codes', () => {
    const captured: unknown[] = [];
    const originalJson = vi.fn().mockImplementation((payload: unknown) => {
      captured.push(payload);
      return res;
    });
    const freshRes = makeRes();
    freshRes.statusCode = 500;
    freshRes.json = originalJson;

    envelopeMiddleware(
      req as Parameters<typeof envelopeMiddleware>[0],
      freshRes as Parameters<typeof envelopeMiddleware>[1],
      next,
    );

    const errorPayload = { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } };
    freshRes.json(errorPayload);

    expect(captured[0]).toEqual(errorPayload);
  });
});
