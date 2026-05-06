import { Router } from 'express';
import { resourceCompletionController } from '../controllers/resource-completion.controller.js';
import { toggleCompletionSchema } from '../schemas/resource-completion.schema.js';
import { validate } from '../middleware/validate.js';
import { requireSelf } from '../middleware/authorize-resource.js';

const lessonCompletionsRouter = Router({ mergeParams: true });
lessonCompletionsRouter.get('/', resourceCompletionController.getCompletions);
// requireSelf guards against a future body userId field bypassing self-scoping
// enforcement (FR-12). The controller currently stamps req.user!.id by
// construction, so this is a defence-in-depth guard.
lessonCompletionsRouter.post(
  '/',
  requireSelf((req) => req.body?.userId as string | undefined),
  validate(toggleCompletionSchema),
  resourceCompletionController.toggleCompletion,
);

export { lessonCompletionsRouter };
