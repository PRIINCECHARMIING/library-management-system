import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validator.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/auth.validator.js';
import { authenticateJWT } from '../middleware/jwtAuth.js';
import { authRateLimiter } from '../middleware/security.js';

const router = Router();

router.post('/register', authRateLimiter, validate({ body: registerSchema }), AuthController.register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), AuthController.login);
router.get('/me', authenticateJWT, AuthController.me);
router.post('/change-password', authenticateJWT, validate({ body: changePasswordSchema }), AuthController.changePassword);

export default router;
