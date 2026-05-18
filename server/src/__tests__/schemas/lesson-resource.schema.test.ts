import { describe, it, expect } from 'vitest';
import {
  createLessonResourceSchema,
  updateLessonResourceSchema,
  lessonResourceQuerySchema,
} from '../../schemas/lesson-resource.schema.js';

describe('createLessonResourceSchema — note', () => {
  it('accepts valid note', () => {
    const result = createLessonResourceSchema.safeParse({
      type: 'note',
      title: 'My Note',
      content: { body: { type: 'doc', content: [] } },
      order: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects note with missing body', () => {
    const result = createLessonResourceSchema.safeParse({
      type: 'note',
      title: 'My Note',
      content: {},
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects note with empty title', () => {
    const result = createLessonResourceSchema.safeParse({
      type: 'note',
      title: '',
      content: { body: {} },
      order: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('createLessonResourceSchema — lecture', () => {
  it('accepts valid lecture', () => {
    const result = createLessonResourceSchema.safeParse({
      type: 'lecture',
      title: 'Lecture 1',
      content: { body: { type: 'doc', content: [] } },
      order: 1,
    });
    expect(result.success).toBe(true);
  });
});

describe('createLessonResourceSchema — video', () => {
  it('accepts valid video', () => {
    const result = createLessonResourceSchema.safeParse({
      type: 'video',
      title: 'Video 1',
      content: { url: 'https://example.com/video' },
      order: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects video with empty url', () => {
    const result = createLessonResourceSchema.safeParse({
      type: 'video',
      title: 'Video 1',
      content: { url: '' },
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects video with missing url', () => {
    const result = createLessonResourceSchema.safeParse({
      type: 'video',
      title: 'Video 1',
      content: {},
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown type', () => {
    const result = createLessonResourceSchema.safeParse({
      type: 'audio',
      title: 'Audio 1',
      content: {},
      order: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('updateLessonResourceSchema', () => {
  it('accepts empty object', () => {
    expect(updateLessonResourceSchema.safeParse({}).success).toBe(true);
  });

  it('accepts valid partial update', () => {
    expect(updateLessonResourceSchema.safeParse({ title: 'New Title' }).success).toBe(true);
  });

  it('accepts isRequired field', () => {
    expect(updateLessonResourceSchema.safeParse({ isRequired: true }).success).toBe(true);
  });

  it('rejects invalid type enum value', () => {
    expect(updateLessonResourceSchema.safeParse({ type: 'audio' }).success).toBe(false);
  });

  it('rejects negative order', () => {
    expect(updateLessonResourceSchema.safeParse({ order: -1 }).success).toBe(false);
  });
});

describe('lessonResourceQuerySchema', () => {
  it('accepts empty query', () => {
    expect(lessonResourceQuerySchema.safeParse({}).success).toBe(true);
  });

  it('accepts valid type', () => {
    expect(lessonResourceQuerySchema.safeParse({ type: 'note' }).success).toBe(true);
    expect(lessonResourceQuerySchema.safeParse({ type: 'video' }).success).toBe(true);
    expect(lessonResourceQuerySchema.safeParse({ type: 'lecture' }).success).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(lessonResourceQuerySchema.safeParse({ type: 'audio' }).success).toBe(false);
  });
});
