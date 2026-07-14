import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestIdMiddleware } from '../../middleware/requestId.js';
import { makeReq, makeNext } from '../mocks/express.js';
import type { Response } from 'express';

function makeResWithSetHeader() {
  return {
    statusCode: 200,
    locals: {} as Record<string, unknown>,
    setHeader: vi.fn(),
  } as unknown as Response;
}

describe('requestIdMiddleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets req.requestId to a non-empty string', () => {
    const req = makeReq();
    const res = makeResWithSetHeader();
    const next = makeNext();
    requestIdMiddleware(req, res, next);
    expect(typeof req.requestId).toBe('string');
    expect(req.requestId.length).toBeGreaterThan(0);
  });

  it('sets X-Request-Id response header', () => {
    const req = makeReq();
    const res = makeResWithSetHeader();
    const next = makeNext();
    requestIdMiddleware(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', expect.any(String));
  });

  it('sets X-Request-Id to the same value as req.requestId', () => {
    const req = makeReq();
    let capturedHeader: string | undefined;
    const res = makeResWithSetHeader();
    (res.setHeader as ReturnType<typeof vi.fn>).mockImplementation(
      (_name: string, value: string) => {
        capturedHeader = value;
      },
    );
    const next = makeNext();
    requestIdMiddleware(req, res, next);
    expect(capturedHeader).toBe(req.requestId);
  });

  it('calls next()', () => {
    const req = makeReq();
    const res = makeResWithSetHeader();
    const next = makeNext();
    requestIdMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('generates a unique requestId for each invocation', () => {
    const req1 = makeReq();
    const req2 = makeReq();
    const next = makeNext();
    requestIdMiddleware(req1, makeResWithSetHeader(), next);
    requestIdMiddleware(req2, makeResWithSetHeader(), next);
    expect(req1.requestId).not.toBe(req2.requestId);
  });

  it('sets requestId that matches UUID v4 format', () => {
    const req = makeReq();
    const next = makeNext();
    requestIdMiddleware(req, makeResWithSetHeader(), next);
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidV4Regex.test(req.requestId)).toBe(true);
  });
});
