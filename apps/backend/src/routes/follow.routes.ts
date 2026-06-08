import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { toggleFollow, getFollowers, getFollowing } from '../controllers/follow.controller';

const router = Router();

router.post('/:userId', authenticate, toggleFollow);
router.get('/users/:userId/followers', getFollowers);
router.get('/users/:userId/following', getFollowing);

export default router;
