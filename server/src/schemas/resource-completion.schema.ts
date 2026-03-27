import { z } from 'zod';

export const toggleCompletionSchema = z.object({
  resourceType: z.enum(['lessonPlan', 'note', 'video', 'lecture', 'flash_card', 'practice_problem', 'vocab']),
  resourceId: z.string().uuid(),
});

export type ToggleCompletionInput = z.infer<typeof toggleCompletionSchema>;
