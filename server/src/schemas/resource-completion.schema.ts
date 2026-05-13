import { z } from 'zod';

export const toggleCompletionSchema = z.object({
  type: z.enum(['resource', 'tool']),
  targetId: z.string().uuid(),
});

export type ToggleCompletionInput = z.infer<typeof toggleCompletionSchema>;
