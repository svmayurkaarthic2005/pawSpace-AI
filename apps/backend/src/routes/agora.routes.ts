import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { generateAgoraToken } from '../controllers/agora.controller';

const router = Router();

// POST /api/v1/agora/token — requires auth
router.post('/token', authenticate, generateAgoraToken);

export default router;
