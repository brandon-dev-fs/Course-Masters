import { practiceProblemService } from '../services/practice-problem.service.js';
import { createLessonContentController } from './factories/createLessonContentController.js';

export const practiceProblemController = createLessonContentController(practiceProblemService, 'id');
