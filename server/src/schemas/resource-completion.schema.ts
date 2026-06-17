import { z } from 'zod';

export const toggleCompletionSchema = z.object({
  assignmentId: z.string().uuid(),
});

export type ToggleCompletionInput = z.infer<typeof toggleCompletionSchema>;
