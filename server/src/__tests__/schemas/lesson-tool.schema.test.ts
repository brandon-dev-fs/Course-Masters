import { describe, it, expect } from 'vitest';
import {
  createLessonToolSchema,
  updateLessonToolSchema,
  lessonToolQuerySchema,
} from '../../schemas/lesson-tool.schema.js';

// ── createLessonToolSchema ────────────────────────────────────────────────────

describe('createLessonToolSchema — flash_card', () => {
  it('accepts valid flash_card', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'flash_card',
      title: 'Flashcard 1',
      content: { front: 'What is React?', back: 'A JavaScript library' },
      order: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects flash_card with empty front', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'flash_card',
      title: 'Flashcard',
      content: { front: '', back: 'Back text' },
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects flash_card with empty back', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'flash_card',
      title: 'Flashcard',
      content: { front: 'Front text', back: '' },
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects flash_card with empty title', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'flash_card',
      title: '',
      content: { front: 'Front', back: 'Back' },
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects flash_card with missing content fields', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'flash_card',
      title: 'Card',
      content: {},
      order: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('createLessonToolSchema — practice_problem', () => {
  it('accepts valid practice_problem', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'practice_problem',
      title: 'Practice 1',
      content: { question: 'What is 2+2?', options: ['3', '4', '5'], correctIndex: 1 },
      order: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects practice_problem with empty options', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'practice_problem',
      title: 'Practice',
      content: { question: 'Q?', options: [], correctIndex: 0 },
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects practice_problem with negative correctIndex', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'practice_problem',
      title: 'Practice',
      content: { question: 'Q?', options: ['A'], correctIndex: -1 },
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects practice_problem with empty question', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'practice_problem',
      title: 'Practice',
      content: { question: '', options: ['A', 'B'], correctIndex: 0 },
      order: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('createLessonToolSchema — vocab', () => {
  it('accepts valid vocab tool', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'vocab',
      title: 'Vocab 1',
      content: { term: 'React', definition: 'A JavaScript library for building UIs' },
      order: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects vocab with empty term', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'vocab',
      title: 'Vocab',
      content: { term: '', definition: 'A definition' },
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects vocab with empty definition', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'vocab',
      title: 'Vocab',
      content: { term: 'Term', definition: '' },
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown tool type', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'unknown_type',
      title: 'Tool',
      content: {},
      order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative order', () => {
    const result = createLessonToolSchema.safeParse({
      type: 'vocab',
      title: 'Vocab',
      content: { term: 'Term', definition: 'Def' },
      order: -1,
    });
    expect(result.success).toBe(false);
  });
});

// ── updateLessonToolSchema ────────────────────────────────────────────────────

describe('updateLessonToolSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updateLessonToolSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only title', () => {
    const result = updateLessonToolSchema.safeParse({ title: 'New Title' });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with type', () => {
    const result = updateLessonToolSchema.safeParse({ type: 'flash_card' });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with content', () => {
    const result = updateLessonToolSchema.safeParse({ content: { front: 'New front', back: 'New back' } });
    expect(result.success).toBe(true);
  });

  it('accepts update with order and isRequired', () => {
    const result = updateLessonToolSchema.safeParse({ order: 5, isRequired: true });
    expect(result.success).toBe(true);
  });

  it('rejects empty title string', () => {
    const result = updateLessonToolSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type enum value', () => {
    const result = updateLessonToolSchema.safeParse({ type: 'invalid_type' });
    expect(result.success).toBe(false);
  });

  it('rejects negative order', () => {
    const result = updateLessonToolSchema.safeParse({ order: -1 });
    expect(result.success).toBe(false);
  });
});

// ── lessonToolQuerySchema ─────────────────────────────────────────────────────

describe('lessonToolQuerySchema', () => {
  it('accepts empty object (type is optional)', () => {
    const result = lessonToolQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts type=flash_card', () => {
    const result = lessonToolQuerySchema.safeParse({ type: 'flash_card' });
    expect(result.success).toBe(true);
  });

  it('accepts type=practice_problem', () => {
    const result = lessonToolQuerySchema.safeParse({ type: 'practice_problem' });
    expect(result.success).toBe(true);
  });

  it('accepts type=vocab', () => {
    const result = lessonToolQuerySchema.safeParse({ type: 'vocab' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type value', () => {
    const result = lessonToolQuerySchema.safeParse({ type: 'invalid' });
    expect(result.success).toBe(false);
  });
});
