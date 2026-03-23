import { videoService } from '../services/video.service.js';
import { createLessonContentController } from './factories/createLessonContentController.js';

export const videoController = createLessonContentController(videoService, 'videoId');
