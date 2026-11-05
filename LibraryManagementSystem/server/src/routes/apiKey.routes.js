import { Router } from 'express';
import { ApiKeyController } from '../controllers/apiKey.controller.js';
import { validate } from '../middleware/validator.js';
import { createApiKeySchema } from '../validators/apiKey.validator.js';
import { authenticateJWT } from '../middleware/jwtAuth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// API Key management is restricted to Admin users
router.use(authenticateJWT);
router.use(requireRole(ROLES.ADMIN));

router.post('/', validate({ body: createApiKeySchema }), ApiKeyController.create);
router.get('/', ApiKeyController.list);
router.delete('/:id', ApiKeyController.revoke);

export default router;
