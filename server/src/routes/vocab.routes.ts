import { vocabController } from '../controllers/vocab.controller.js';
import { createVocabSchema, updateVocabSchema } from '../schemas/vocab.schema.js';
import { createLessonContentRoutes } from './factories/createLessonContentRoutes.js';

const { lessonRouter: lessonVocabRouter, standaloneRouter: vocabRouter } =
  createLessonContentRoutes(vocabController, createVocabSchema, updateVocabSchema, 'vocabId');

export { lessonVocabRouter, vocabRouter };
