import { describe, it, expect } from 'vitest';
import { createCourseSchema, updateCourseSchema } from '../../schemas/course.schema.js';

describe('createCourseSchema', () => {
  it('accepts valid input', () => {
    const result = createCourseSchema.safeParse({
      title: 'My Course',
      description: 'A great course',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional syllabus field', () => {
    const result = createCourseSchema.safeParse({
      title: 'My Course',
      description: 'A great course',
      syllabus: { sections: ['Introduction'] },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = createCourseSchema.safeParse({
      description: 'A great course',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = createCourseSchema.safeParse({
      title: '',
      description: 'A great course',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const result = createCourseSchema.safeParse({
      title: 'My Course',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = createCourseSchema.safeParse({
      title: 'My Course',
      description: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateCourseSchema', () => {
  it('accepts partial input — only title', () => {
    const result = updateCourseSchema.safeParse({ title: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('accepts partial input — only description', () => {
    const result = updateCourseSchema.safeParse({ description: 'Updated description' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no fields required)', () => {
    const result = updateCourseSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects empty string for title when provided', () => {
    const result = updateCourseSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});
