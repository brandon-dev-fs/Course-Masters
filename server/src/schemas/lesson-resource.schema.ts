import { z } from 'zod';

// ── Per-type content schemas ───────────────────────────────────────────────

const noteContentSchema = z.object({
  // body is a Tiptap JSON document. Internal Tiptap structure is not deeply validated
  // at the API boundary — Tiptap document internals are opaque to the server.
  // An empty document ({ type: "doc", content: [] }) is valid.
  // z.record(z.unknown()) preserves type safety (no implicit `any`) while remaining
  // type-agnostic; it produces a plain JS object that Prisma's Json column accepts.
  body: z.record(z.unknown()),
});

const lectureContentSchema = z.object({
  body: z.record(z.unknown()),
});

const videoContentSchema = z.object({
  url: z.string().min(1, 'url is required'),
});

// ── Create schema (discriminated union) ───────────────────────────────────

export const createLessonResourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('note'),
    title: z.string().min(1, 'Title is required'),
    content: noteContentSchema,
    order: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('lecture'),
    title: z.string().min(1, 'Title is required'),
    content: lectureContentSchema,
    order: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('video'),
    title: z.string().min(1, 'Title is required'),
    content: videoContentSchema,
    order: z.number().int().min(0),
  }),
]);

// ── Update schema ──────────────────────────────────────────────────────────
// NOTE: The client omits `type` from update requests (NoteEditor, VideoList,
// and other components send content without type). A discriminated union on
// `type` is therefore not applicable for updates — we cannot enforce per-type
// content shapes without a discriminator. The update schema accepts the existing
// optional fields. content uses z.record(z.any()) because without a `type`
// discriminator present in the request, a flat partial schema cannot branch on
// per-type shapes; content passes through loosely validated here until a future
// client change sends `type` on updates, enabling discriminated-union enforcement.
// Full discriminated-union enforcement on updates requires a client change to
// always include `type`, which is outside the scope of this spec (cm-0007).

export const updateLessonResourceSchema = z.object({
  type: z.enum(['note', 'video', 'lecture']).optional(),
  title: z.string().min(1).optional(),
  content: z.record(z.any()).optional(),
  order: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
});

export type CreateLessonResourceInput = z.infer<typeof createLessonResourceSchema>;
export type UpdateLessonResourceInput = z.infer<typeof updateLessonResourceSchema>;

export const lessonResourceQuerySchema = z.object({
  type: z.enum(['note', 'video', 'lecture']).optional(),
});
export type LessonResourceQuery = z.infer<typeof lessonResourceQuerySchema>;
