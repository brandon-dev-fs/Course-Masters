import { Router } from 'express';
import { vocabController } from '../controllers/vocab.controller.js';
import { validate } from '../middleware/validate.js';
import { createVocabSchema, updateVocabSchema } from '../schemas/vocab.schema.js';

// Mounted at /lessons/:lessonId/vocab and /vocab
const lessonVocabRouter = Router({ mergeParams: true });
lessonVocabRouter.get('/', vocabController.getAll);
lessonVocabRouter.post('/', validate(createVocabSchema), vocabController.create);

const vocabRouter = Router();
vocabRouter.put('/:vocabId', validate(updateVocabSchema), vocabController.update);
vocabRouter.delete('/:vocabId', vocabController.remove);

export { lessonVocabRouter, vocabRouter };
