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

  it('rejects missing objective', () => {
    const { objective: _ob, ...rest } = valid;
    expect(createLessonSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects empty objective', () => {
    expect(createLessonSchema.safeParse({ ...valid, objective: '' }).success).toBe(false);
  });

  it('rejects missing planContent', () => {
    const { planContent: _pc, ...rest } = valid;
    expect(createLessonSchema.safeParse(rest).success).toBe(false);
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

  it('rejects empty objective when provided', () => {
    expect(updateLessonSchema.safeParse({ objective: '' }).success).toBe(false);
  });
});
