import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getTrending, getHashtagPosts, getSuggestions, trackSearch } from '../controllers/explore.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /explore/trending
router.get('/trending', getTrending);

// GET /explore/hashtag/:tag
router.get('/hashtag/:tag', getHashtagPosts);

// GET /search/suggestions
router.get('/suggestions', getSuggestions);

// POST /search/track
router.post('/track', trackSearch);

export default router;
