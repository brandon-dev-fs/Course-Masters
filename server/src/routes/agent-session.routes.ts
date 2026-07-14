import { Router } from 'express';

import { agentSessionController } from '../controllers/agent-session.controller.js';

const router = Router();

router.post('/', agentSessionController.create);
router.get('/', agentSessionController.list);
router.get('/:sessionId', agentSessionController.getById);
router.delete('/:sessionId', agentSessionController.abandon);

export default router;
