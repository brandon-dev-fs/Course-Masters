import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { AppError } from '../../errors/AppError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

// Mock the logger so error tests don't produce noise and don't fail
vi.mock('../../lib/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { errorHandler } from '../../middleware/errorHandler.js';

describe('errorHandler', () => {
  let req: ReturnType<typeof makeReq>;
  let res: ReturnType<typeof makeRes>;
  let next: ReturnType<typeof makeNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = makeReq();
    res = makeRes();
    next = makeNext();
  });

  function callHandler(err: unknown) {
    errorHandler(
      err,
      req as Parameters<typeof errorHandler>[1],
      res as Parameters<typeof errorHandler>[2],
      next,
    );
  }

  // ── AppError subclass handling ────────────────────────────────────────────

  it('uses the AppError statusCode for the HTTP response', () => {
    callHandler(new AppError('FORBIDDEN', 'Access denied', 403));
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('sends the AppError code in the response body', () => {
    callHandler(new AppError('FORBIDDEN', 'Access denied', 403));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'FORBIDDEN' }),
      }),
    );
  });

  it('sends the AppError message in the response body', () => {
    callHandler(new AppError('FORBIDDEN', 'Access denied', 403));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'Access denied' }),
      }),
    );
  });

  it('includes details in response body when AppError has details', () => {
    const details = { field: ['required'] };
    callHandler(new ValidationError('Validation failed', details));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ details }),
      }),
    );
  });

  it('omits details key when AppError has no details', () => {
    callHandler(new ConflictError('Already exists'));
    const call = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.error).not.toHaveProperty('details');
  });

  it('returns 404 for NotFoundError', () => {
    callHandler(new NotFoundError('Course not found'));
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'NOT_FOUND' }) }),
    );
  });

  it('returns 409 for ConflictError', () => {
    callHandler(new ConflictError());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  // ── Prisma known request errors ───────────────────────────────────────────

  it('returns 404 NOT_FOUND for Prisma P2025', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '6.0.0',
    });
    callHandler(err);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'NOT_FOUND' }) }),
    );
  });

  it('returns 409 CONFLICT for Prisma P2002', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '6.0.0',
    });
    callHandler(err);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'CONFLICT' }) }),
    );
  });

  it('returns 409 CONFLICT for Prisma P2003', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Foreign key constraint', {
      code: 'P2003',
      clientVersion: '6.0.0',
    });
    callHandler(err);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'CONFLICT' }) }),
    );
  });

  it('returns 409 CONFLICT for Prisma P2014', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Required relation violation', {
      code: 'P2014',
      clientVersion: '6.0.0',
    });
    callHandler(err);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'CONFLICT' }) }),
    );
  });

  it('returns 409 TRANSACTION_CONFLICT for Prisma P2034', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Transaction conflict', {
      code: 'P2034',
      clientVersion: '6.0.0',
    });
    callHandler(err);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'TRANSACTION_CONFLICT' }) }),
    );
  });

  // ── Prisma validation error ───────────────────────────────────────────────

  it('returns 400 VALIDATION_ERROR for PrismaClientValidationError', () => {
    const err = new Prisma.PrismaClientValidationError('Validation error', {
      clientVersion: '6.0.0',
    });
    callHandler(err);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'VALIDATION_ERROR' }) }),
    );
  });

  // ── Unknown errors ────────────────────────────────────────────────────────

  it('returns 500 INTERNAL_ERROR for unknown errors', () => {
    callHandler(new Error('Unknown error'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'INTERNAL_ERROR' }) }),
    );
  });

  it('returns 500 for non-Error thrown values', () => {
    callHandler('some string error');
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('never includes stack traces in the response body', () => {
    callHandler(new Error('Internal error'));
    const call = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(JSON.stringify(call)).not.toContain('stack');
    expect(JSON.stringify(call)).not.toContain('at ');
  });

  it('response body always has the error envelope shape', () => {
    callHandler(new NotFoundError());
    const call = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call).toHaveProperty('error');
    expect(call.error).toHaveProperty('code');
    expect(call.error).toHaveProperty('message');
  });
});
