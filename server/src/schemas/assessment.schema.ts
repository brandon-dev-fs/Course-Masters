import { z } from 'zod';

export const questionSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  options: z.array(z.string().min(1)).min(2, 'At least 2 options required'),
  correctIndex: z.number().int().min(0),
  order: z.number().int().min(0),
});

export const createAssessmentSchema = z.object({
  questions: z.array(questionSchema).min(1, 'At least 1 question required'),
});

export const submitAttemptSchema = z.object({
  answers: z.array(z.number().int().min(0)),
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
