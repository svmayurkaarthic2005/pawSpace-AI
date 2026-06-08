import { Router } from 'express';
import multer from 'multer';
import { authenticate, optionalAuth } from '../middleware/auth';
import { getUserProfile, updateProfile, getMe, getNearbyUsers, updateSettings, getSettings } from '../controllers/user.controller';

const router = Router();

// Multer configuration for image uploads (avatar and cover)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Get current user
router.get('/me', authenticate, getMe);

// Get nearby users (requires authentication for location context)
router.get('/nearby', authenticate, getNearbyUsers);

// Settings
router.get('/settings', authenticate, getSettings);
router.put('/settings', authenticate, updateSettings);

// Get user profile by ID
router.get('/:id/profile', optionalAuth, getUserProfile);

// Update current user profile (supports both JSON and multipart/form-data)
// Can handle both 'avatar' and 'coverImage' fields
router.put('/profile', authenticate, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), updateProfile);

export default router;
