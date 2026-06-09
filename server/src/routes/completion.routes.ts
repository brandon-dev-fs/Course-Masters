import { Router } from 'express';
import { completionController } from '../controllers/completion.controller.js';

// ── /lessons/:lessonId/complete ───────────────────────────────────────────────
// Self-scoped: userId is always stamped from req.user!.id in the controller.
// No body userId field exists, so no requireSelf middleware is needed —
// self-scoping is enforced by construction (FR-10).

export const lessonCompleteRouter = Router({ mergeParams: true });
lessonCompleteRouter.post('/', completionController.markLessonComplete);
lessonCompleteRouter.delete('/', completionController.removeLessonComplete);

// ── /units/:unitId/complete ───────────────────────────────────────────────────
// Self-scoped: userId is always stamped from req.user!.id in the controller.
// No body userId field exists, so no requireSelf middleware is needed —
// self-scoping is enforced by construction (FR-11).

export const unitCompleteRouter = Router({ mergeParams: true });
unitCompleteRouter.post('/', completionController.markUnitComplete);
unitCompleteRouter.delete('/', completionController.removeUnitComplete);
