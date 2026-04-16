import { z } from 'zod';

export const questionSchema = z
  .object({
    type: z.enum(['multiple_choice', 'true_false', 'matching', 'fill_in_blank']).default('multiple_choice'),
    question: z.string().min(1, 'Question is required'),
    content: z.record(z.any()),
    order: z.number().int().min(0),
  })
  .strict();

export const createAssessmentSchema = z
  .object({
    calculatorAllowed: z.boolean().optional(),
    questions: z.array(questionSchema).min(1, 'At least 1 question required'),
  })
  .strict();

export const updateAssessmentSchema = z
  .object({
    calculatorAllowed: z.boolean().optional(),
    questions: z.array(questionSchema).min(1, 'At least 1 question required'),
  })
  .strict();

export const submitAttemptSchema = z.object({
  answers: z.array(z.any()),
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
