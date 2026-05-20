import { describe, it, expect } from 'vitest';
import { AppError } from '../../errors/AppError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { ConflictError } from '../../errors/ConflictError.js';

describe('AppError', () => {
  it('sets code, message, and statusCode from constructor args', () => {
    const err = new AppError('FORBIDDEN', 'Access denied', 403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.message).toBe('Access denied');
    expect(err.statusCode).toBe(403);
  });

  it('sets optional details when provided', () => {
    const details = { field: 'name', issue: 'required' };
    const err = new AppError('VALIDATION_ERROR', 'Validation failed', 400, details);
    expect(err.details).toEqual(details);
  });

  it('details is undefined when not provided', () => {
    const err = new AppError('FORBIDDEN', 'Access denied', 403);
    expect(err.details).toBeUndefined();
  });

  it('is an instance of Error', () => {
    const err = new AppError('FORBIDDEN', 'Access denied', 403);
    expect(err).toBeInstanceOf(Error);
  });

  it('sets name to AppError', () => {
    const err = new AppError('SOME_CODE', 'Some message', 500);
    expect(err.name).toBe('AppError');
  });
});

describe('NotFoundError', () => {
  it('has code NOT_FOUND', () => {
    const err = new NotFoundError();
    expect(err.code).toBe('NOT_FOUND');
  });

  it('has statusCode 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });

  it('uses default message when none provided', () => {
    const err = new NotFoundError();
    expect(err.message).toBe('Resource not found');
  });

  it('uses custom message when provided', () => {
    const err = new NotFoundError('Course not found');
    expect(err.message).toBe('Course not found');
  });

  it('extends AppError', () => {
    const err = new NotFoundError();
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('ValidationError', () => {
  it('has code VALIDATION_ERROR', () => {
    const err = new ValidationError();
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('has statusCode 400', () => {
    const err = new ValidationError();
    expect(err.statusCode).toBe(400);
  });

  it('uses default message when none provided', () => {
    const err = new ValidationError();
    expect(err.message).toBe('Validation failed');
  });

  it('carries details field', () => {
    const details = { name: ['Name is required'] };
    const err = new ValidationError('Validation failed', details);
    expect(err.details).toEqual(details);
  });

  it('extends AppError', () => {
    const err = new ValidationError();
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('ConflictError', () => {
  it('has code CONFLICT', () => {
    const err = new ConflictError();
    expect(err.code).toBe('CONFLICT');
  });

  it('has statusCode 409', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
  });

  it('uses default message when none provided', () => {
    const err = new ConflictError();
    expect(err.message).toBe('Conflict');
  });

  it('uses custom message when provided', () => {
    const err = new ConflictError('Resource already exists');
    expect(err.message).toBe('Resource already exists');
  });

  it('extends AppError', () => {
    const err = new ConflictError();
    expect(err).toBeInstanceOf(AppError);
  });
});
