import { Router } from 'express';
import { autocompletePlaces, getPlaceDetailsById, reverseGeocodeLocation } from '../controllers/googlePlaces.controller';

const router = Router();

router.get('/autocomplete', autocompletePlaces);
router.get('/details', getPlaceDetailsById);
router.get('/reverse-geocode', reverseGeocodeLocation);

export default router;
