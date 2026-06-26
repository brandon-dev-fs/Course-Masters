import { z } from 'zod';

export const createLessonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  order: z.number().int().min(0),
  objective: z.string().optional().default(''),
  planContent: z.record(z.any()).optional().default({}),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
  objective: z.string().optional(),
  planContent: z.record(z.any()).optional(),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
