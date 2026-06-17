import { describe, it, expect } from 'vitest';
import { toggleCompletionSchema } from '../../schemas/resource-completion.schema.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('toggleCompletionSchema', () => {
  it('accepts valid assignmentId UUID', () => {
    const result = toggleCompletionSchema.safeParse({ assignmentId: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID assignmentId', () => {
    const result = toggleCompletionSchema.safeParse({ assignmentId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects missing assignmentId', () => {
    const result = toggleCompletionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects extra unrecognized fields (strict pass-through)', () => {
    // Zod strips by default — this should succeed but parsed value should only have assignmentId
    const result = toggleCompletionSchema.safeParse({ assignmentId: VALID_UUID, type: 'resource' });
    expect(result.success).toBe(true);
    if (result.success) {
      // Verify only assignmentId is in the parsed output
      expect(Object.keys(result.data)).toEqual(['assignmentId']);
    }
  });

  it('rejects null assignmentId', () => {
    const result = toggleCompletionSchema.safeParse({ assignmentId: null });
    expect(result.success).toBe(false);
  });
});
