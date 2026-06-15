import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNearbyEvents,
  getNearbyUsers,
  updateUserLocation,
  geocodeSearch,
  getDirectionsRoute,
  deleteUserLocation,
} from '../controllers/map.controller';

const router = Router();

router.get('/events', authenticate, getNearbyEvents);
router.get('/users', authenticate, getNearbyUsers);
router.post('/location', authenticate, updateUserLocation);
router.delete('/location', authenticate, deleteUserLocation);
router.get('/geocode', geocodeSearch);
router.get('/directions', getDirectionsRoute);

export default router;
