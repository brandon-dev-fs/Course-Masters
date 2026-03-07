import { z } from 'zod';

export const createFlashCardSchema = z.object({
  front: z.string().min(1, 'Front is required'),
  back: z.string().min(1, 'Back is required'),
  order: z.number().int().min(0),
});

export const updateFlashCardSchema = createFlashCardSchema.partial();

export type CreateFlashCardInput = z.infer<typeof createFlashCardSchema>;
export type UpdateFlashCardInput = z.infer<typeof updateFlashCardSchema>;
