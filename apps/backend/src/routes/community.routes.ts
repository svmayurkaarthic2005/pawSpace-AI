import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  getMyCommunities,
  getDiscoverCommunities,
  getAIRecommended,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityById,
  getMembers,
  markRead,
  searchCommunities,
} from '../controllers/community.controller';
import {
  getCommunityPosts,
  createCommunityPost,
  pinPost,
  unpinPost,
  toggleLike,
  deletePost,
} from '../controllers/communityPost.controller';

const router = Router();

// ─── Community Routes ─────────────────────────────────────────────────────────

// Get user's joined communities
router.get('/mine', authenticate, getMyCommunities);

// Get discover communities (with optional species filter)
router.get('/discover', authenticate, getDiscoverCommunities);

// Get AI-recommended communities
router.get('/recommended', authenticate, getAIRecommended);

// Search communities
router.get('/search', searchCommunities);

// Create community
router.post('/', authenticate, createCommunity);

// Get community by ID
router.get('/:id', optionalAuth, getCommunityById);

// Join community
router.post('/:id/join', authenticate, joinCommunity);

// Leave community
router.delete('/:id/leave', authenticate, leaveCommunity);

// Get community members
router.get('/:id/members', getMembers);

// Mark community as read
router.post('/:id/read', authenticate, markRead);

// ─── Community Post Routes ────────────────────────────────────────────────────

// Get community posts
router.get('/:id/posts', optionalAuth, getCommunityPosts);

// Create community post
router.post('/:id/posts', authenticate, createCommunityPost);

// Pin post
router.post('/:id/posts/:postId/pin', authenticate, pinPost);

// Unpin post
router.post('/:id/posts/:postId/unpin', authenticate, unpinPost);

// Like/unlike post
router.post('/:id/posts/:postId/like', authenticate, toggleLike);

// Delete post
router.delete('/:id/posts/:postId', authenticate, deletePost);

export default router;
