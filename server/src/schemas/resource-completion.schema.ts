import { z } from 'zod';

export const toggleCompletionSchema = z.object({
  resourceType: z.enum(['lessonPlan', 'video', 'note', 'vocab']),
  resourceId: z.string().uuid(),
});

export type ToggleCompletionInput = z.infer<typeof toggleCompletionSchema>;
