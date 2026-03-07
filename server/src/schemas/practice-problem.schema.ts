import { z } from 'zod';

export const createPracticeProblemSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  order: z.number().int().min(0),
});

export const updatePracticeProblemSchema = createPracticeProblemSchema.partial();

export type CreatePracticeProblemInput = z.infer<typeof createPracticeProblemSchema>;
export type UpdatePracticeProblemInput = z.infer<typeof updatePracticeProblemSchema>;
