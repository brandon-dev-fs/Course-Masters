import { z } from 'zod';

export const createVocabSchema = z.object({
  term: z.string().min(1, 'Term is required'),
  definition: z.string().min(1, 'Definition is required'),
  order: z.number().int().min(0),
});

export const updateVocabSchema = createVocabSchema.partial();

export type CreateVocabInput = z.infer<typeof createVocabSchema>;
export type UpdateVocabInput = z.infer<typeof updateVocabSchema>;
