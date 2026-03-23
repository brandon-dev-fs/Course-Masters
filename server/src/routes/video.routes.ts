import { videoController } from '../controllers/video.controller.js';
import { createVideoSchema, updateVideoSchema } from '../schemas/video.schema.js';
import { createLessonContentRoutes } from './factories/createLessonContentRoutes.js';

const { lessonRouter: lessonVideosRouter, standaloneRouter: videosRouter } =
  createLessonContentRoutes(videoController, createVideoSchema, updateVideoSchema, 'videoId');

export { lessonVideosRouter, videosRouter };
