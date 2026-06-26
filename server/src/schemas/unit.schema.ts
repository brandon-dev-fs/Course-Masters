import { z } from 'zod';

export const createUnitSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  order: z.number().int().min(0),
});

export const updateUnitSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;

