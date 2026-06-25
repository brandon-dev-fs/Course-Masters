import { z } from 'zod';

const reorderItemSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().min(1),
});

export const reorderItemsSchema = z.object({
  items: z.array(reorderItemSchema).min(1),
});

export type ReorderItem = z.infer<typeof reorderItemSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
