import { z } from 'zod';

export const createLessonToolSchema = z.object({
  type: z.enum(['flash_card', 'practice_problem', 'vocab']),
  title: z.string().min(1, 'Title is required'),
  content: z.record(z.any()),
  order: z.number().int().min(0),
});

export const updateLessonToolSchema = createLessonToolSchema.partial().extend({
  isRequired: z.boolean().optional(),
});

export type CreateLessonToolInput = z.infer<typeof createLessonToolSchema>;
export type UpdateLessonToolInput = z.infer<typeof updateLessonToolSchema>;
