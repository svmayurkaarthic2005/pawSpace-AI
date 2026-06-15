import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { toggleFollow, unfollowEntity, getFollowers, getFollowing, checkFollowStatus, getFollowRequests, acceptFollowRequest, rejectFollowRequest, removeFollower } from '../controllers/follow.controller';

const router = Router();

// Follow Requests
router.get('/requests', authenticate, getFollowRequests);
router.post('/requests/:requesterId/accept', authenticate, acceptFollowRequest);
router.post('/requests/:requesterId/reject', authenticate, rejectFollowRequest);

// Remove Follower
router.delete('/followers/:followerId', authenticate, removeFollower);

// Polymorphic follow/unfollow routes
router.post('/:entityType/:entityId', authenticate, toggleFollow);
router.delete('/:entityType/:entityId', authenticate, unfollowEntity);

// Get followers of an entity (user or pet)
router.get('/:entityType/:entityId/followers', getFollowers);

// Check follow status
router.get('/:entityType/:entityId/status', authenticate, checkFollowStatus);

// Get entities a user follows (unified list with users and pets)
router.get('/users/:userId/following', getFollowing);

export default router;
