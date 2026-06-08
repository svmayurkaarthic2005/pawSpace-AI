import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNearbyEvents,
  getNearbyUsers,
  updateUserLocation,
  geocodeSearch,
  getDirectionsRoute,
} from '../controllers/map.controller';

const router = Router();

router.get('/events', authenticate, getNearbyEvents);
router.get('/users', authenticate, getNearbyUsers);
router.post('/location', authenticate, updateUserLocation);
router.get('/geocode', geocodeSearch);
router.get('/directions', getDirectionsRoute);

export default router;
