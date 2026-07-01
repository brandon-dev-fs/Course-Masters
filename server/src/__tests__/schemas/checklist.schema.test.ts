import { describe, it, expect } from 'vitest';
import {
  createChecklistItemSchema,
  updateChecklistItemSchema,
  reorderChecklistSchema,
} from '../../schemas/checklist.schema.js';

describe('createChecklistItemSchema', () => {
  it('accepts valid text', () => {
    expect(createChecklistItemSchema.safeParse({ text: 'Read chapter 1' }).success).toBe(true);
  });

  it('rejects empty text', () => {
    expect(createChecklistItemSchema.safeParse({ text: '' }).success).toBe(false);
  });

  it('rejects text exceeding 200 characters', () => {
    expect(createChecklistItemSchema.safeParse({ text: 'a'.repeat(201) }).success).toBe(false);
  });
});

describe('updateChecklistItemSchema', () => {
  it('accepts update with text only', () => {
    expect(updateChecklistItemSchema.safeParse({ text: 'Updated text' }).success).toBe(true);
  });

  it('accepts update with checked only', () => {
    expect(updateChecklistItemSchema.safeParse({ checked: true }).success).toBe(true);
  });

  it('accepts update with both text and checked', () => {
    expect(updateChecklistItemSchema.safeParse({ text: 'Done', checked: true }).success).toBe(true);
  });

  it('rejects empty object (neither text nor checked provided)', () => {
    expect(updateChecklistItemSchema.safeParse({}).success).toBe(false);
  });
});

describe('reorderChecklistSchema', () => {
  it('accepts a valid UUID array', () => {
    expect(
      reorderChecklistSchema.safeParse({ itemIds: ['550e8400-e29b-41d4-a716-446655440000'] }).success,
    ).toBe(true);
  });

  it('rejects an empty array', () => {
    expect(reorderChecklistSchema.safeParse({ itemIds: [] }).success).toBe(false);
  });

  it('rejects non-UUID strings', () => {
    expect(reorderChecklistSchema.safeParse({ itemIds: ['not-a-uuid'] }).success).toBe(false);
  });
});
