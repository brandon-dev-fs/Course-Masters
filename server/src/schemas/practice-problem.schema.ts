import { z } from 'zod';

export const createPracticeProblemSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  options: z.array(z.string().min(1)).min(2, 'At least 2 options required'),
  correctIndex: z.number().int().min(0),
  order: z.number().int().min(0),
});

export const updatePracticeProblemSchema = createPracticeProblemSchema.partial();

export type CreatePracticeProblemInput = z.infer<typeof createPracticeProblemSchema>;
export type UpdatePracticeProblemInput = z.infer<typeof updatePracticeProblemSchema>;
