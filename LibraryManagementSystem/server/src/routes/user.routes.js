import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateJWT } from '../middleware/jwtAuth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// All user management routes require JWT authentication
router.use(authenticateJWT);

// Admin & Librarian can view users
router.get('/', requireRole(ROLES.ADMIN, ROLES.LIBRARIAN), UserController.list);
router.get('/:id', requireRole(ROLES.ADMIN, ROLES.LIBRARIAN), UserController.getById);

// Admin only: change role or toggle account status
router.patch('/:id/role', requireRole(ROLES.ADMIN), UserController.updateRole);
router.patch('/:id/status', requireRole(ROLES.ADMIN), UserController.toggleStatus);

export default router;
