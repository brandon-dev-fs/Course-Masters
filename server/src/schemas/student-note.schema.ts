import { z } from 'zod';

export const upsertStudentNoteSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

export type UpsertStudentNoteInput = z.infer<typeof upsertStudentNoteSchema>;
