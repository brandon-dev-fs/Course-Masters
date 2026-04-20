import { z } from 'zod';

export const questionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false', 'matching', 'fill_in_blank']).default('multiple_choice'),
  question: z.string().min(1, 'Question is required'),
  content: z.record(z.any()),
  order: z.number().int().min(0),
  calculatorEnabled: z.boolean().default(false),
});

export const createAssessmentSchema = z.object({
  questions: z.array(questionSchema).min(1, 'At least 1 question required'),
});

export const submitAttemptSchema = z.object({
  answers: z.array(z.any()),
});

export const bulkUpdateCalculatorSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1, 'At least one question ID required'),
  calculatorEnabled: z.boolean(),
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type BulkUpdateCalculatorInput = z.infer<typeof bulkUpdateCalculatorSchema>;
