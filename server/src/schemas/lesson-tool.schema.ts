import { z } from 'zod';

// ── Per-type content schemas ───────────────────────────────────────────────

const flashCardContentSchema = z.object({
  front: z.string().min(1, 'front is required'),
  back: z.string().min(1, 'back is required'),
});

const practiceProblemContentSchema = z.object({
  question: z.string().min(1, 'question is required'),
  options: z.array(z.string()).min(1, 'options must be a non-empty array'),
  correctIndex: z.number().int().min(0, 'correctIndex must be a non-negative integer'),
});

const vocabContentSchema = z.object({
  term: z.string().min(1, 'term is required'),
  definition: z.string().min(1, 'definition is required'),
});

// ── Create schema (discriminated union) ───────────────────────────────────

export const createLessonToolSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('flash_card'),
    title: z.string().min(1, 'Title is required'),
    content: flashCardContentSchema,
    order: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('practice_problem'),
    title: z.string().min(1, 'Title is required'),
    content: practiceProblemContentSchema,
    order: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('vocab'),
    title: z.string().min(1, 'Title is required'),
    content: vocabContentSchema,
    order: z.number().int().min(0),
  }),
]);

// ── Update schema ──────────────────────────────────────────────────────────
// NOTE: The client omits `type` from update requests (FlashCardList, VocabList,
// PracticeProblemList all send content without type). A discriminated union on
// `type` is therefore not applicable for updates — we cannot enforce per-type
// content shapes without a discriminator. The update schema accepts the existing
// optional fields. content uses z.record(z.any()) because without a `type`
// discriminator present in the request, a flat partial schema cannot branch on
// per-type shapes; content passes through loosely validated here until a future
// client change sends `type` on updates, enabling discriminated-union enforcement.
// Full discriminated-union enforcement on updates requires a client change to
// always include `type`, which is outside the scope of this spec (cm-0007).

export const updateLessonToolSchema = z.object({
  type: z.enum(['flash_card', 'practice_problem', 'vocab']).optional(),
  title: z.string().min(1).optional(),
  content: z.record(z.any()).optional(),
  order: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
});

export type CreateLessonToolInput = z.infer<typeof createLessonToolSchema>;
export type UpdateLessonToolInput = z.infer<typeof updateLessonToolSchema>;

export const lessonToolQuerySchema = z.object({
  type: z.enum(['flash_card', 'practice_problem', 'vocab']).optional(),
});
export type LessonToolQuery = z.infer<typeof lessonToolQuerySchema>;
