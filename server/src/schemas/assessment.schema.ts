import { z } from 'zod';

// ── Per-type content schemas ───────────────────────────────────────────────

const multipleChoiceContentSchema = z.object({
  options: z.array(z.string()).min(1, 'options must be a non-empty array'),
  correctIndex: z.number().int().min(0, 'correctIndex must be a non-negative integer'),
});

const trueFalseContentSchema = z.object({
  correct: z.boolean(),
});

const fillInBlankBlankSchema = z.object({
  answer: z.string().min(1, 'Blank answer is required'),
  alternatives: z.array(z.string()).optional().default([]),
});

const fillInBlankContentSchema = z.object({
  blanks: z.array(fillInBlankBlankSchema).min(1, 'At least one blank required'),
});

const matchingPairSchema = z.object({
  left:  z.string().min(1, 'Left term is required'),
  right: z.string().min(1, 'Right term is required'),
});

const matchingContentSchema = z.object({
  pairs: z.array(matchingPairSchema).min(2, 'At least 2 pairs required'),
});

// ── Discriminated union (drives validate middleware) ───────────────────────

export const questionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('multiple_choice'),
    question: z.string().min(1, 'Question is required'),
    content: multipleChoiceContentSchema,
    order: z.number().int().min(0),
    calculatorEnabled: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('true_false'),
    question: z.string().min(1, 'Question is required'),
    content: trueFalseContentSchema,
    order: z.number().int().min(0),
    calculatorEnabled: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('fill_in_blank'),
    question: z.string().min(1, 'Question is required'),
    content: fillInBlankContentSchema,
    order: z.number().int().min(0),
    calculatorEnabled: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('matching'),
    question: z.string().min(1, 'Question is required'),
    content: matchingContentSchema,
    order: z.number().int().min(0),
    calculatorEnabled: z.boolean().default(false),
  }),
]);

export const createAssessmentSchema = z.object({
  questions: z.array(questionSchema).min(1, 'At least 1 question required'),
});

// submitAttemptSchema is unchanged — out of scope per spec
export const submitAttemptSchema = z.object({
  answers: z.array(z.any()),
});

export const bulkUpdateCalculatorSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1, 'At least one question ID required'),
  calculatorEnabled: z.boolean(),
});

export const attemptsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const importQuestionsSchema = z.object({
  practiceProblemAssignmentId: z.string().uuid(),
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type BulkUpdateCalculatorInput = z.infer<typeof bulkUpdateCalculatorSchema>;
export type AttemptsQuery = z.infer<typeof attemptsQuerySchema>;
export type ImportQuestionsInput = z.infer<typeof importQuestionsSchema>;
