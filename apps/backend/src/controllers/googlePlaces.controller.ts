import { Request, Response, NextFunction } from 'express';
import { searchPlaces, getPlaceDetails, reverseGeocode } from '../utils/googlePlaces.util';
import { successResponse } from '../utils';
import { AppError } from '../middleware/error';

/**
 * GET /google-places/autocomplete?q=query&location=lat,lng
 */
export const autocompletePlaces = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { q, location } = req.query as { q?: string; location?: string };

    if (!q || q.trim().length === 0) {
      res.status(200).json(successResponse([], 'No query provided'));
      return;
    }

    let locationParam: { lat: number; lng: number } | undefined;
    if (location) {
      const [lat, lng] = location.split(',').map((v) => parseFloat(v.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        locationParam = { lat, lng };
      }
    }

    const results = await searchPlaces(q.trim(), locationParam);
    res.status(200).json(successResponse(results, 'Autocomplete results retrieved'));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /google-places/details?placeId=id
 */
export const getPlaceDetailsById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { placeId } = req.query as { placeId?: string };

    if (!placeId) {
      throw new AppError('placeId is required', 400, true, 'VALIDATION_ERROR');
    }

    const details = await getPlaceDetails(placeId);
    if (!details) {
      throw new AppError('Place not found', 404, true, 'PLACE_NOT_FOUND');
    }

    res.status(200).json(successResponse(details, 'Place details retrieved'));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /google-places/reverse-geocode?lat=xx&lng=yy
 */
export const reverseGeocodeLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { lat, lng } = req.query as { lat?: string; lng?: string };

    if (!lat || !lng) {
      throw new AppError('lat and lng are required', 400, true, 'VALIDATION_ERROR');
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      throw new AppError('Invalid coordinates', 400, true, 'VALIDATION_ERROR');
    }

    const place = await reverseGeocode(latNum, lngNum);
    if (!place) {
      throw new AppError('Location not found', 404, true, 'LOCATION_NOT_FOUND');
    }

    res.status(200).json(successResponse(place, 'Location retrieved'));
  } catch (err) {
    next(err);
  }
};
