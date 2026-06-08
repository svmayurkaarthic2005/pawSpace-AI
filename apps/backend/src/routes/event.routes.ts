import { Router } from 'express';
import multer from 'multer';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  createEvent, getNearbyEvents, getUpcomingEvents, getEventById,
  rsvpEvent, getEventAttendees,
} from '../controllers/event.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

// Events
router.post('/', authenticate, upload.single('coverImage'), createEvent);
router.get('/nearby', authenticate, getNearbyEvents);
router.get('/upcoming', optionalAuth, getUpcomingEvents);
router.get('/:id', optionalAuth, getEventById);
router.post('/:id/rsvp', authenticate, rsvpEvent);
router.get('/:id/attendees', optionalAuth, getEventAttendees);

export default router;
