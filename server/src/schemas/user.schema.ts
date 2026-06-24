import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  themePreference: z.enum(['light', 'dark', 'system']),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
