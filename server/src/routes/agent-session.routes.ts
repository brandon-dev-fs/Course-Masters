import { Router } from 'express';

import { agentSessionController } from '../controllers/agent-session.controller.js';
import { validate } from '../middleware/validate.js';
import { sendMessageSchema } from '../schemas/agent-session.schema.js';

const router = Router();

router.post('/', agentSessionController.create);
router.get('/', agentSessionController.list);
router.get('/:sessionId', agentSessionController.getById);
router.delete('/:sessionId', agentSessionController.abandon);
router.post('/:sessionId/message', validate(sendMessageSchema), agentSessionController.sendMessage);
router.post('/:sessionId/approve', agentSessionController.approvePhase);

export default router;
