import { z } from 'zod';

export const createLessonResourceSchema = z.object({
  type: z.enum(['note', 'video', 'lecture']),
  title: z.string().min(1, 'Title is required'),
  content: z.record(z.any()),
  order: z.number().int().min(0),
});

export const updateLessonResourceSchema = createLessonResourceSchema.partial().extend({
  isRequired: z.boolean().optional(),
});

export type CreateLessonResourceInput = z.infer<typeof createLessonResourceSchema>;
export type UpdateLessonResourceInput = z.infer<typeof updateLessonResourceSchema>;
