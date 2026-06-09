import { describe, it, expect } from 'vitest';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  reorderAssignmentsSchema,
} from '../../schemas/assignment.schema.js';

// ── createAssignmentSchema ────────────────────────────────────────────────────

describe('createAssignmentSchema — note', () => {
  it('accepts valid note assignment', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'note',
      title: 'Study Notes',
      content: { type: 'doc', content: [] },
    });
    expect(result.success).toBe(true);
  });

  it('accepts note with optional objective', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'note',
      title: 'Study Notes',
      content: { type: 'doc', content: [] },
      objective: 'Understand the topic',
    });
    expect(result.success).toBe(true);
  });

  it('rejects note with empty title', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'note',
      title: '',
      content: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects note missing content', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'note',
      title: 'Notes',
    });
    expect(result.success).toBe(false);
  });
});

describe('createAssignmentSchema — video', () => {
  it('accepts valid video assignment', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'video',
      title: 'Watch this video',
      url: 'https://youtube.com/watch?v=abc123',
    });
    expect(result.success).toBe(true);
  });

  it('accepts video with optional displayTitle', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'video',
      title: 'Watch this',
      url: 'https://vimeo.com/123456',
      displayTitle: 'Introduction to React',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'video',
      title: 'Watch this',
      url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing URL', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'video',
      title: 'Watch this',
    });
    expect(result.success).toBe(false);
  });
});

describe('createAssignmentSchema — reading', () => {
  it('accepts valid reading assignment', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'reading',
      title: 'Read this article',
      url: 'https://example.com/article',
    });
    expect(result.success).toBe(true);
  });

  it('accepts reading with optional fields', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'reading',
      title: 'Read this',
      url: 'https://example.com/article',
      description: 'An important article',
      estimatedMinutes: 15,
    });
    expect(result.success).toBe(true);
  });

  it('rejects estimatedMinutes less than 1', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'reading',
      title: 'Read this',
      url: 'https://example.com/article',
      estimatedMinutes: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('createAssignmentSchema — vocab', () => {
  it('accepts valid vocab assignment', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'vocab',
      title: 'Vocabulary List',
      entries: [
        { term: 'React', definition: 'A JavaScript library' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty entries array', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'vocab',
      title: 'Vocab',
      entries: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects entry with empty term', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'vocab',
      title: 'Vocab',
      entries: [{ term: '', definition: 'Some definition' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects entry with empty definition', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'vocab',
      title: 'Vocab',
      entries: [{ term: 'Term', definition: '' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('createAssignmentSchema — practice_problem', () => {
  it('accepts valid practice_problem with multiple_choice question', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'practice_problem',
      title: 'Practice Quiz',
      questions: [
        {
          type: 'multiple_choice',
          order: 1,
          content: { question: 'What is 2+2?', options: ['3', '4'], correctIndex: 1 },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts practice_problem with optional passingPercentage', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'practice_problem',
      title: 'Practice Quiz',
      passingPercentage: 80,
      questions: [
        {
          type: 'true_false',
          order: 1,
          content: { question: 'Is this true?', correct: true },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty questions array', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'practice_problem',
      title: 'Practice Quiz',
      questions: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects passingPercentage above 100', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'practice_problem',
      title: 'Practice Quiz',
      passingPercentage: 101,
      questions: [
        {
          type: 'true_false',
          order: 1,
          content: { question: 'Q?', correct: false },
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown assignment type', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'unknown_type',
      title: 'Assignment',
    });
    expect(result.success).toBe(false);
  });
});

// ── updateAssignmentSchema ────────────────────────────────────────────────────

describe('updateAssignmentSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updateAssignmentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only title', () => {
    const result = updateAssignmentSchema.safeParse({ title: 'New Title' });
    expect(result.success).toBe(true);
  });

  it('accepts update with URL and estimatedMinutes', () => {
    const result = updateAssignmentSchema.safeParse({
      url: 'https://example.com',
      estimatedMinutes: 20,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title string', () => {
    const result = updateAssignmentSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid URL', () => {
    const result = updateAssignmentSchema.safeParse({ url: 'not-a-valid-url' });
    expect(result.success).toBe(false);
  });

  it('accepts nullable passingPercentage (clearing the field)', () => {
    const result = updateAssignmentSchema.safeParse({ passingPercentage: null });
    expect(result.success).toBe(true);
  });
});

// ── reorderAssignmentsSchema ──────────────────────────────────────────────────

describe('reorderAssignmentsSchema', () => {
  it('accepts valid UUID array', () => {
    const result = reorderAssignmentsSchema.safeParse({
      assignmentIds: ['550e8400-e29b-41d4-a716-446655440000'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts multiple UUIDs', () => {
    const result = reorderAssignmentsSchema.safeParse({
      assignmentIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty array', () => {
    const result = reorderAssignmentsSchema.safeParse({ assignmentIds: [] });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID strings', () => {
    const result = reorderAssignmentsSchema.safeParse({ assignmentIds: ['not-a-uuid'] });
    expect(result.success).toBe(false);
  });

  it('rejects missing assignmentIds', () => {
    const result = reorderAssignmentsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
