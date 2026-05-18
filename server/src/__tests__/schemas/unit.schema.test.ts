import { describe, it, expect } from 'vitest';
import { createUnitSchema, updateUnitSchema } from '../../schemas/unit.schema.js';

describe('createUnitSchema', () => {
  it('accepts valid input', () => {
    const result = createUnitSchema.safeParse({
      title: 'Unit 1',
      description: 'First unit',
      order: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = createUnitSchema.safeParse({ description: 'desc', order: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = createUnitSchema.safeParse({ title: '', description: 'desc', order: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const result = createUnitSchema.safeParse({ title: 'Unit 1', order: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects missing order', () => {
    const result = createUnitSchema.safeParse({ title: 'Unit 1', description: 'desc' });
    expect(result.success).toBe(false);
  });

  it('rejects negative order', () => {
    const result = createUnitSchema.safeParse({ title: 'Unit 1', description: 'desc', order: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer order', () => {
    const result = createUnitSchema.safeParse({ title: 'Unit 1', description: 'desc', order: 1.5 });
    expect(result.success).toBe(false);
  });

  it('accepts order of 0', () => {
    const result = createUnitSchema.safeParse({ title: 'Unit 1', description: 'desc', order: 0 });
    expect(result.success).toBe(true);
  });
});

describe('updateUnitSchema', () => {
  it('accepts partial input — only title', () => {
    const result = updateUnitSchema.safeParse({ title: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('accepts partial input — only order', () => {
    const result = updateUnitSchema.safeParse({ order: 2 });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateUnitSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects empty title when provided', () => {
    const result = updateUnitSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});
