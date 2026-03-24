import { Router } from 'express';
import { resourceCompletionController } from '../controllers/resource-completion.controller.js';
import { toggleCompletionSchema } from '../schemas/resource-completion.schema.js';
import { validate } from '../middleware/validate.js';

const lessonCompletionsRouter = Router({ mergeParams: true });
lessonCompletionsRouter.get('/', resourceCompletionController.getCompletions);
lessonCompletionsRouter.post('/', validate(toggleCompletionSchema), resourceCompletionController.toggleCompletion);

export { lessonCompletionsRouter };
