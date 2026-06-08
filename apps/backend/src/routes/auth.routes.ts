import { Router } from 'express';
import { register, login, googleLogin, refresh, logout, logoutAll, getMe, checkUsernameAvailability } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from '../validators/auth.validator';

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

// POST /api/v1/auth/register
router.post('/register', authLimiter, validate(registerSchema), register);

// POST /api/v1/auth/login
router.post('/login', authLimiter, validate(loginSchema), login);

// POST /api/v1/auth/google
router.post('/google', authLimiter, googleLogin);

// POST /api/v1/auth/refresh
router.post('/refresh', validate(refreshSchema), refresh);

// GET /api/v1/auth/check-username/:username
router.get('/check-username/:username', checkUsernameAvailability);

// ─── Protected Routes ─────────────────────────────────────────────────────────

// POST /api/v1/auth/logout
router.post('/logout', authenticate, validate(logoutSchema), logout);

// POST /api/v1/auth/logout-all
router.post('/logout-all', authenticate, logoutAll);

// GET /api/v1/auth/me
router.get('/me', authenticate, getMe);

export default router;
