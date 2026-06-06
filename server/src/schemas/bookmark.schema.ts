import { z } from 'zod';

export const createBookmarkSchema = z.object({
  note: z.string().max(500).optional(),
});

export const updateBookmarkSchema = z.object({
  note: z.string().max(500).optional(),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
