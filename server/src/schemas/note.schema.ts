import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.record(z.any()),
  order: z.number().int().min(0),
});

export const updateNoteSchema = createNoteSchema.partial();

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
