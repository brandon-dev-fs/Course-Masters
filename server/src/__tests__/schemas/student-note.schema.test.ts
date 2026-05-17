import { describe, it, expect } from 'vitest';
import { upsertStudentNoteSchema } from '../../schemas/student-note.schema.js';

describe('upsertStudentNoteSchema', () => {
  it('accepts valid content string', () => {
    const result = upsertStudentNoteSchema.safeParse({
      content: 'This is my note about the lesson.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts content with markdown formatting', () => {
    const result = upsertStudentNoteSchema.safeParse({
      content: '# Heading\n\n- Item 1\n- Item 2',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content string', () => {
    const result = upsertStudentNoteSchema.safeParse({
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing content field', () => {
    const result = upsertStudentNoteSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-string content', () => {
    const result = upsertStudentNoteSchema.safeParse({
      content: 123,
    });
    expect(result.success).toBe(false);
  });

  it('rejects null content', () => {
    const result = upsertStudentNoteSchema.safeParse({
      content: null,
    });
    expect(result.success).toBe(false);
  });
});
