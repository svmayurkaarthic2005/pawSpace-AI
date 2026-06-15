import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { blockUser, unblockUser, getBlockedUsers } from '../controllers/block.controller';

const router = Router();

router.use(authenticate);

router.get('/', getBlockedUsers);
router.post('/:userId', blockUser);
router.delete('/:userId', unblockUser);

export default router;
