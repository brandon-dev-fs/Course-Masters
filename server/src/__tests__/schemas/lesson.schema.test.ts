import { describe, it, expect } from 'vitest';
import { createLessonSchema, updateLessonSchema } from '../../schemas/lesson.schema.js';

describe('createLessonSchema', () => {
  const valid = {
    title: 'Lesson 1',
    description: 'A lesson',
    order: 0,
    objective: 'Learn something',
    planContent: { type: 'doc', content: [] },
  };

  it('accepts valid input', () => {
    const result = createLessonSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const { title: _t, ...rest } = valid;
    expect(createLessonSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects empty title', () => {
    expect(createLessonSchema.safeParse({ ...valid, title: '' }).success).toBe(false);
  });

  it('rejects missing description', () => {
    const { description: _d, ...rest } = valid;
    expect(createLessonSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing order', () => {
    const { order: _o, ...rest } = valid;
    expect(createLessonSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects negative order', () => {
    expect(createLessonSchema.safeParse({ ...valid, order: -1 }).success).toBe(false);
  });

  it('accepts missing objective (optional with default)', () => {
    const { objective: _ob, ...rest } = valid;
    const result = createLessonSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.objective).toBe('');
  });

  it('accepts empty objective (optional — no min length constraint)', () => {
    const result = createLessonSchema.safeParse({ ...valid, objective: '' });
    expect(result.success).toBe(true);
  });

  it('accepts missing planContent (optional with default)', () => {
    const { planContent: _pc, ...rest } = valid;
    const result = createLessonSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.planContent).toEqual({});
  });

  it('accepts planContent as any record', () => {
    const result = createLessonSchema.safeParse({ ...valid, planContent: { arbitrary: true } });
    expect(result.success).toBe(true);
  });
});

describe('updateLessonSchema', () => {
  it('accepts partial input — only title', () => {
    expect(updateLessonSchema.safeParse({ title: 'Updated' }).success).toBe(true);
  });

  it('accepts empty object', () => {
    expect(updateLessonSchema.safeParse({}).success).toBe(true);
  });

  it('rejects empty title when provided', () => {
    expect(updateLessonSchema.safeParse({ title: '' }).success).toBe(false);
  });

  it('accepts empty objective when provided (no min length on objective)', () => {
    expect(updateLessonSchema.safeParse({ objective: '' }).success).toBe(true);
  });
});
