import { z } from 'zod';

export const createChecklistItemSchema = z.object({
  text: z.string().min(1).max(200),
});

export const updateChecklistItemSchema = z
  .object({
    text: z.string().min(1).max(200).optional(),
    checked: z.boolean().optional(),
  })
  .refine((d) => d.text !== undefined || d.checked !== undefined, {
    message: 'At least one of text or checked must be provided',
  });

export const reorderChecklistSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
});

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
export type ReorderChecklistInput = z.infer<typeof reorderChecklistSchema>;
