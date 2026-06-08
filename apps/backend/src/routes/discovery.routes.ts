import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getDirectionsRoute, searchPlacesHandler, updateLocation, getNearbyUsers } from '../controllers/event.controller';

const router = Router();

// Directions + Places
router.get('/directions', authenticate, getDirectionsRoute);
router.get('/places/search', authenticate, searchPlacesHandler);

// User location + discovery
router.post('/users/location', authenticate, updateLocation);
router.get('/users/nearby', authenticate, getNearbyUsers);

export default router;
