import { z } from 'zod';

export const upsertNoteSchema = z.object({
  content: z.record(z.any()),
});

export type UpsertNoteInput = z.infer<typeof upsertNoteSchema>;
