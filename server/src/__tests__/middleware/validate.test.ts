import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validate, validateQuery } from '../../middleware/validate.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().optional(),
});

describe('validate', () => {
  let req: ReturnType<typeof makeReq>;
  let res: ReturnType<typeof makeRes>;
  let next: ReturnType<typeof makeNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = makeReq();
    res = makeRes();
    next = makeNext();
  });

  it('calls next() without error when body is valid', () => {
    req.body = { name: 'John', age: 30 };
    const middleware = validate(testSchema);

    middleware(
      req as Parameters<ReturnType<typeof validate>>[0],
      res as Parameters<ReturnType<typeof validate>>[1],
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('assigns the parsed body to req.body on success', () => {
    req.body = { name: 'Alice', age: 25 };
    const middleware = validate(testSchema);

    middleware(
      req as Parameters<ReturnType<typeof validate>>[0],
      res as Parameters<ReturnType<typeof validate>>[1],
      next,
    );

    expect(req.body).toEqual({ name: 'Alice', age: 25 });
  });

  it('calls next(ValidationError) when body is invalid', () => {
    req.body = { age: 30 }; // missing required name
    const middleware = validate(testSchema);

    middleware(
      req as Parameters<ReturnType<typeof validate>>[0],
      res as Parameters<ReturnType<typeof validate>>[1],
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('ValidationError has code VALIDATION_ERROR', () => {
    req.body = {};
    const middleware = validate(testSchema);

    middleware(
      req as Parameters<ReturnType<typeof validate>>[0],
      res as Parameters<ReturnType<typeof validate>>[1],
      next,
    );

    const error = next.mock.calls[0][0];
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('ValidationError details contain flattened field errors', () => {
    req.body = { name: '' }; // empty string fails min(1)
    const middleware = validate(testSchema);

    middleware(
      req as Parameters<ReturnType<typeof validate>>[0],
      res as Parameters<ReturnType<typeof validate>>[1],
      next,
    );

    const error = next.mock.calls[0][0];
    expect(error.details).toBeDefined();
  });

  it('strips extra fields not in schema', () => {
    req.body = { name: 'Bob', extra: 'should-be-stripped' };
    const middleware = validate(testSchema);

    middleware(
      req as Parameters<ReturnType<typeof validate>>[0],
      res as Parameters<ReturnType<typeof validate>>[1],
      next,
    );

    expect(req.body).not.toHaveProperty('extra');
  });
});

describe('validateQuery', () => {
  let req: ReturnType<typeof makeReq>;
  let res: ReturnType<typeof makeRes>;
  let next: ReturnType<typeof makeNext>;

  const querySchema = z.object({
    page: z.coerce.number().optional(),
    type: z.enum(['note', 'video']).optional(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    req = makeReq();
    res = makeRes();
    next = makeNext();
  });

  it('calls next() without error when query is valid', () => {
    req.query = { type: 'note' };
    const middleware = validateQuery(querySchema);

    middleware(
      req as Parameters<ReturnType<typeof validateQuery>>[0],
      res as Parameters<ReturnType<typeof validateQuery>>[1],
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('attaches parsed query to res.locals.validatedQuery', () => {
    req.query = { type: 'video' };
    const middleware = validateQuery(querySchema);

    middleware(
      req as Parameters<ReturnType<typeof validateQuery>>[0],
      res as Parameters<ReturnType<typeof validateQuery>>[1],
      next,
    );

    expect(res.locals['validatedQuery']).toEqual({ type: 'video' });
  });

  it('calls next(ValidationError) when query is invalid', () => {
    req.query = { type: 'invalid-type' };
    const middleware = validateQuery(querySchema);

    middleware(
      req as Parameters<ReturnType<typeof validateQuery>>[0],
      res as Parameters<ReturnType<typeof validateQuery>>[1],
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('ValidationError code is VALIDATION_ERROR for invalid query', () => {
    req.query = { type: 'bad-value' };
    const middleware = validateQuery(querySchema);

    middleware(
      req as Parameters<ReturnType<typeof validateQuery>>[0],
      res as Parameters<ReturnType<typeof validateQuery>>[1],
      next,
    );

    const error = next.mock.calls[0][0];
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('passes when query is empty (all fields optional)', () => {
    req.query = {};
    const middleware = validateQuery(querySchema);

    middleware(
      req as Parameters<ReturnType<typeof validateQuery>>[0],
      res as Parameters<ReturnType<typeof validateQuery>>[1],
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });
});
