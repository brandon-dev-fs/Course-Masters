import { z } from 'zod';

// ── Question content sub-schemas ────────────────────────────────────────────

const multipleChoiceContentSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
});

const trueFalseContentSchema = z.object({
  question: z.string().min(1),
  correct: z.boolean(),
});

const matchingContentSchema = z.object({
  question: z.string().min(1),
  leftItems: z.array(z.string()).min(1),
  rightItems: z.array(z.string()).min(1),
  correctPairs: z.array(z.tuple([z.number().int(), z.number().int()])),
});

const fillInBlankContentSchema = z.object({
  question: z.string().min(1),
  blanks: z
    .array(
      z.object({
        answer: z.string().min(1),
        alternatives: z.array(z.string()).optional(),
      }),
    )
    .min(1),
});

const practiceQuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false', 'matching', 'fill_in_blank']),
  order: z.number().int().min(1),
  content: z.union([
    multipleChoiceContentSchema,
    trueFalseContentSchema,
    matchingContentSchema,
    fillInBlankContentSchema,
  ]),
});

// ── Shared base fields ───────────────────────────────────────────────────────

const baseAssignmentFields = {
  title: z.string().min(1).max(120),
  // min(1) prevents persisting an empty-string objective; use null to clear
  objective: z.string().min(1).optional(),
};

// ── Create schema (discriminated union by type) ──────────────────────────────

// URL validator — accepts empty string (placeholder on creation) or a valid http/https URL
const urlField = z.union([z.literal(''), z.string().url().refine(u => /^https?:\/\//i.test(u), { message: 'URL must use http or https' })]);

export const createAssignmentSchema = z.discriminatedUnion('type', [
  z.object({
    ...baseAssignmentFields,
    type: z.literal('note'),
    // Rich-text Json object (same structure as LessonResource note content)
    content: z.record(z.any()),
  }),
  z.object({
    ...baseAssignmentFields,
    type: z.literal('video'),
    url: urlField,
  }),
  z.object({
    ...baseAssignmentFields,
    type: z.literal('reading'),
    url: urlField,
    estimatedMinutes: z.number().int().min(1).optional(),
  }),
  z.object({
    ...baseAssignmentFields,
    type: z.literal('vocab'),
    // Allow empty array on creation — entries are added via the edit flow
    entries: z
      .array(
        z.object({
          term: z.string().min(1),
          definition: z.string().min(1),
          example: z.string().optional(),
        }),
      )
      .default([]),
  }),
  z.object({
    ...baseAssignmentFields,
    type: z.literal('practice_problem'),
    passingPercentage: z.number().int().min(0).max(100).optional(),
    // Allow empty array on creation — questions are added via the edit flow
    questions: z.array(practiceQuestionSchema).default([]),
  }),
]);

// ── Update schema (all type-specific fields optional, type is immutable) ────

export const updateAssignmentSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  // min(1) prevents persisting an empty-string objective; use null to clear
  objective: z.string().min(1).optional(),
  // note
  content: z.record(z.any()).optional(),
  // video / reading
  url: z.string().url().refine(u => /^https?:\/\//i.test(u), { message: 'URL must use http or https' }).optional(),
  // reading
  estimatedMinutes: z.number().int().min(1).optional(),
  // vocab — id is optional: present for existing entries, absent for new ones
  entries: z
    .array(
      z.object({
        id: z.string().optional(),
        term: z.string().min(1),
        definition: z.string().min(1),
        example: z.string().optional(),
      }),
    )
    .optional(),
  // practice_problem
  passingPercentage: z.number().int().min(0).max(100).nullable().optional(),
  questions: z.array(practiceQuestionSchema).optional(),
});

// ── Reorder schema ───────────────────────────────────────────────────────────

export const reorderAssignmentsSchema = z.object({
  assignmentIds: z.array(z.string().uuid()).min(1),
});

// ── Inferred types ───────────────────────────────────────────────────────────

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type ReorderAssignmentsInput = z.infer<typeof reorderAssignmentsSchema>;
export type PracticeQuestionInput = z.infer<typeof practiceQuestionSchema>;
