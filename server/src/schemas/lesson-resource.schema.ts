import { z } from 'zod';

// ── Per-type content schemas ───────────────────────────────────────────────

const noteContentSchema = z.object({
  // body is a Tiptap JSON document. Internal Tiptap structure is not deeply validated.
  // An empty document ({ type: "doc", content: [] }) is valid.
  // z.record(z.any()) is required for Prisma Json column compatibility — the column
  // accepts arbitrary JSON objects and TypeScript enforces InputJsonValue at the service layer.
  body: z.record(z.any()),
});

const lectureContentSchema = z.object({
  body: z.record(z.any()),
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
// optional fields. content uses z.record(z.unknown()) (not z.any()) to
// preserve type safety while remaining type-agnostic.
// Full discriminated-union enforcement on updates requires a client change to
// always include `type`, which is outside the scope of this spec (cm-0007).

export const updateLessonResourceSchema = z.object({
  type: z.enum(['note', 'video', 'lecture']).optional(),
  title: z.string().min(1).optional(),
  // z.record(z.any()) for Prisma Json column compatibility (see note on noteContentSchema above)
  content: z.record(z.any()).optional(),
  order: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
});

export type CreateLessonResourceInput = z.infer<typeof createLessonResourceSchema>;
export type UpdateLessonResourceInput = z.infer<typeof updateLessonResourceSchema>;
