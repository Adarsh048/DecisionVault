import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/authSchemas';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/AuthController';

const router = Router();

/**
 * Auth routes.
 *
 * Rate limiting: Login, register, forgot-password are rate-limited
 * more aggressively (10 req/15 min) to prevent brute force.
 */

// POST /api/v1/auth/register
router.post('/register', authLimiter, validate(registerSchema), register);

// POST /api/v1/auth/login
router.post('/login', authLimiter, validate(loginSchema), login);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, logout);

// POST /api/v1/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// GET /api/v1/auth/me
router.get('/me', authenticate, getMe);

export default router;
