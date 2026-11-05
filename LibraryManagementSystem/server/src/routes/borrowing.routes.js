import { Router } from 'express';
import { BorrowingController } from '../controllers/borrowing.controller.js';
import { validate } from '../middleware/validator.js';
import { borrowBookSchema, returnBookSchema } from '../validators/borrowing.validator.js';
import { authenticateJWT } from '../middleware/jwtAuth.js';
import { requireRole } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// All borrowing operations require authentication
router.use(authenticateJWT);

// Borrow a book
router.post('/borrow', validate({ body: borrowBookSchema }), BorrowingController.borrow);

// Return a book
router.post('/return', validate({ body: returnBookSchema }), BorrowingController.returnBook);

// Current user's borrowing history
router.get('/my', BorrowingController.myBorrowings);

// Admin & Librarian: view all borrowing transactions
router.get('/', requireRole(ROLES.ADMIN, ROLES.LIBRARIAN), BorrowingController.listAll);

export default router;
