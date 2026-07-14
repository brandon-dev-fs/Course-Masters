import { z } from 'zod';

export const createTrustedSourceSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().min(1).max(255),
  contentTypes: z.array(z.string()).optional().default([]),
  categories: z.array(z.string()).optional().default([]),
  active: z.boolean().optional().default(true),
});

export const updateTrustedSourceSchema = createTrustedSourceSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const trustedSourceQuerySchema = z.object({
  active: z.enum(['true', 'false']).optional(),
});

export type CreateTrustedSourceInput = z.infer<typeof createTrustedSourceSchema>;
export type UpdateTrustedSourceInput = z.infer<typeof updateTrustedSourceSchema>;
export type TrustedSourceQuery = z.infer<typeof trustedSourceQuerySchema>;
