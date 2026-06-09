import { describe, it, expect } from 'vitest';
import { toggleCompletionSchema } from '../../schemas/resource-completion.schema.js';

describe('toggleCompletionSchema', () => {
  it('accepts valid resource toggle', () => {
    const result = toggleCompletionSchema.safeParse({
      type: 'resource',
      targetId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid tool toggle', () => {
    const result = toggleCompletionSchema.safeParse({
      type: 'tool',
      targetId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type value', () => {
    const result = toggleCompletionSchema.safeParse({
      type: 'assignment',
      targetId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing type', () => {
    const result = toggleCompletionSchema.safeParse({
      targetId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID targetId', () => {
    const result = toggleCompletionSchema.safeParse({
      type: 'resource',
      targetId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing targetId', () => {
    const result = toggleCompletionSchema.safeParse({
      type: 'resource',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty object', () => {
    const result = toggleCompletionSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
