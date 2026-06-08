import { z } from 'zod';

export const createBookmarkSchema = z.object({
  note: z.string().min(1).max(500),
});

export const updateBookmarkSchema = z.object({
  note: z.string().min(1).max(500),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
