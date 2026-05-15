import { describe, it, expect, vi, beforeEach } from 'vitest';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

describe('asyncHandler', () => {
  let req: ReturnType<typeof makeReq>;
  let res: ReturnType<typeof makeRes>;
  let next: ReturnType<typeof makeNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = makeReq();
    res = makeRes();
    next = makeNext();
  });

  it('does not call next() with an error when handler resolves successfully', async () => {
    const handler = vi.fn().mockImplementation(async (_req, _res, n) => {
      n(); // call next() as a successful middleware would
    });
    const wrapped = asyncHandler(handler as Parameters<typeof asyncHandler>[0]);

    wrapped(req as Parameters<typeof wrapped>[0], res as Parameters<typeof wrapped>[1], next);

    // Wait for the promise to resolve
    await new Promise(resolve => setImmediate(resolve));

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('forwards thrown errors to next(err) when handler rejects', async () => {
    const error = new Error('Something went wrong');
    const handler = vi.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(handler as Parameters<typeof asyncHandler>[0]);

    wrapped(req as Parameters<typeof wrapped>[0], res as Parameters<typeof wrapped>[1], next);

    await new Promise(resolve => setImmediate(resolve));

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(error);
  });

  it('passes req, res, next into the wrapped handler', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler as Parameters<typeof asyncHandler>[0]);

    wrapped(req as Parameters<typeof wrapped>[0], res as Parameters<typeof wrapped>[1], next);

    await new Promise(resolve => setImmediate(resolve));

    expect(handler).toHaveBeenCalledWith(req, res, next);
  });

  it('forwards thrown errors from within async handler to next(err)', async () => {
    const customError = new Error('Custom async error');
    const handler = vi.fn().mockImplementation(async () => {
      throw customError;
    });
    const wrapped = asyncHandler(handler as Parameters<typeof asyncHandler>[0]);

    wrapped(req as Parameters<typeof wrapped>[0], res as Parameters<typeof wrapped>[1], next);

    await new Promise(resolve => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(customError);
  });
});
