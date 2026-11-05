import { Router } from 'express';
import { BookController } from '../controllers/book.controller.js';
import { validate } from '../middleware/validator.js';
import { createBookSchema, updateBookSchema, bookQuerySchema } from '../validators/book.validator.js';
import { authenticateJWT } from '../middleware/jwtAuth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Publicly readable with search, filter, pagination
router.get('/', validate({ query: bookQuerySchema }), BookController.list);
router.get('/stats', BookController.stats);
router.get('/:id', BookController.getById);

// Protected routes (Librarian and Admin only)
router.post(
  '/',
  authenticateJWT,
  requireRole(ROLES.ADMIN, ROLES.LIBRARIAN),
  validate({ body: createBookSchema }),
  BookController.create
);

router.put(
  '/:id',
  authenticateJWT,
  requireRole(ROLES.ADMIN, ROLES.LIBRARIAN),
  validate({ body: updateBookSchema }),
  BookController.update
);

router.delete(
  '/:id',
  authenticateJWT,
  requireRole(ROLES.ADMIN, ROLES.LIBRARIAN),
  BookController.delete
);

export default router;
