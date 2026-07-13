import { Router } from 'express';

import { trustedSourceController } from '../controllers/trusted-source.controller.js';
import { authorize } from '../middleware/authorize.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { createTrustedSourceSchema, updateTrustedSourceSchema, trustedSourceQuerySchema } from '../schemas/trusted-source.schema.js';

const router = Router();

router.use(authorize('admin'));

router.get('/', validateQuery(trustedSourceQuerySchema), trustedSourceController.list);
router.post('/', validate(createTrustedSourceSchema), trustedSourceController.create);
router.put('/:sourceId', validate(updateTrustedSourceSchema), trustedSourceController.update);
router.delete('/:sourceId', trustedSourceController.deactivate);

export default router;
