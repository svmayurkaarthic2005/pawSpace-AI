import { Router } from 'express';
import multer from 'multer';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  createPost, getFeed, getExplorePosts, getPostById,
  deletePost, likePost, addComment, getComments, getHashtagSuggestions,
} from '../controllers/post.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.post('/', authenticate, upload.array('media', 5), createPost);
router.get('/', optionalAuth, getExplorePosts); // Same as explore for now
router.get('/feed', authenticate, getFeed);
router.get('/explore', optionalAuth, getExplorePosts);
router.get('/hashtag-suggestions', getHashtagSuggestions);
router.get('/:id', optionalAuth, getPostById);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, likePost);
router.post('/:id/comments', authenticate, addComment);
router.get('/:id/comments', optionalAuth, getComments);

export default router;
