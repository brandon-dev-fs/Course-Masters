import { z } from 'zod';

export const createUnitSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  order: z.number().int().min(0),
});

export const updateUnitSchema = createUnitSchema.partial();

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
