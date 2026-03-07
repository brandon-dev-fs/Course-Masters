import { z } from 'zod';

export const createNoteSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  order: z.number().int().min(0),
});

export const updateNoteSchema = createNoteSchema.partial();

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
