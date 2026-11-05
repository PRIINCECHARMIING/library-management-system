import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { authenticateJWT } from '../middleware/jwtAuth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.get('/', CategoryController.list);
router.get('/:id', CategoryController.getById);

router.post(
  '/',
  authenticateJWT,
  requireRole(ROLES.ADMIN, ROLES.LIBRARIAN),
  CategoryController.create
);

router.put(
  '/:id',
  authenticateJWT,
  requireRole(ROLES.ADMIN, ROLES.LIBRARIAN),
  CategoryController.update
);

router.delete(
  '/:id',
  authenticateJWT,
  requireRole(ROLES.ADMIN),
  CategoryController.delete
);

export default router;
