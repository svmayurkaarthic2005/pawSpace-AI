import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import { discoveryService } from '../services/discovery.service';
import { AppError } from '../middleware/error';
import { successResponse } from '../utils';

// POST /events
export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const body = req.body as {
      title: string; description: string; address: string; locationName: string;
      startDate: string; endDate: string; petFriendlySpecies: string | string[];
      maxAttendees?: string; tags?: string | string[];
    };
    const species = Array.isArray(body.petFriendlySpecies) ? body.petFriendlySpecies : [body.petFriendlySpecies];
    const tags = body.tags ? (Array.isArray(body.tags) ? body.tags : [body.tags]) : [];
    const coverBuffer = req.file?.buffer;
    const event = await eventService.createEvent(req.user.userId, {
      title: body.title, description: body.description,
      address: body.address, locationName: body.locationName,
      startDate: body.startDate, endDate: body.endDate,
      petFriendlySpecies: species, maxAttendees: body.maxAttendees ? parseInt(body.maxAttendees) : undefined,
      tags,
    }, coverBuffer);
    res.status(201).json(successResponse(event, 'Event created'));
  } catch (err) { next(err); }
};

// GET /events/nearby
export const getNearbyEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { lat, lng, radius = '25', species, ai = 'true' } = req.query as Record<string, string>;
    if (!lat || !lng) throw new AppError('lat and lng are required', 400, true, 'VALIDATION_ERROR');
    const filters = species ? { species: species.split(',') } : {};
    const events = await eventService.getNearbyEvents(
      req.user.userId, parseFloat(lat), parseFloat(lng),
      parseFloat(radius), filters, ai === 'true',
    );
    res.status(200).json(successResponse(events, 'Nearby events retrieved'));
  } catch (err) { next(err); }
};

// GET /events/upcoming
export const getUpcomingEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const result = await eventService.getUpcomingEvents(parseInt(page), parseInt(limit));
    res.status(200).json(successResponse(result, 'Upcoming events retrieved'));
  } catch (err) { next(err); }
};

// GET /events/:id
export const getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await eventService.getEventById(req.params.id, req.user?.userId);
    res.status(200).json(successResponse(result, 'Event retrieved'));
  } catch (err) { next(err); }
};

// POST /events/:id/rsvp
export const rsvpEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { status } = req.body as { status: 'going' | 'maybe' | 'not_going' };
    if (!status) throw new AppError('Status is required', 400, true, 'VALIDATION_ERROR');
    const result = await eventService.rsvpEvent(req.user.userId, req.params.id, status);
    res.status(200).json(successResponse(result, `RSVP updated: ${status}`));
  } catch (err) { next(err); }
};

// GET /events/:id/attendees
export const getEventAttendees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const result = await eventService.getEventAttendees(req.params.id, parseInt(page), parseInt(limit));
    res.status(200).json(successResponse(result, 'Attendees retrieved'));
  } catch (err) { next(err); }
};

// GET /directions
export const getDirectionsRoute = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // Directions functionality removed - integrate alternative mapping service as needed
    throw new AppError('Directions service not available', 501, true, 'SERVICE_UNAVAILABLE');
  } catch (err) { next(err); }
};

// GET /places/search
export const searchPlacesHandler = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // Places search functionality removed - integrate alternative geocoding service as needed
    throw new AppError('Places search service not available', 501, true, 'SERVICE_UNAVAILABLE');
  } catch (err) { next(err); }
};

// POST /users/location
export const updateLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { lat, lng, accuracy } = req.body as { lat: number; lng: number; accuracy?: number };
    if (!lat || !lng) throw new AppError('lat and lng are required', 400, true, 'VALIDATION_ERROR');
    await discoveryService.updateUserLocation(req.user.userId, lat, lng, accuracy);
    res.status(200).json(successResponse(null, 'Location updated'));
  } catch (err) { next(err); }
};

// GET /users/nearby
export const getNearbyUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { lat, lng, radius = '10', species } = req.query as Record<string, string>;
    if (!lat || !lng) throw new AppError('lat and lng are required', 400, true, 'VALIDATION_ERROR');
    const users = species
      ? await discoveryService.getNearbyPetOwners(req.user.userId, species, parseFloat(lat), parseFloat(lng), parseFloat(radius))
      : await discoveryService.getNearbyUsers(req.user.userId, parseFloat(lat), parseFloat(lng), parseFloat(radius));
    res.status(200).json(successResponse(users, 'Nearby users retrieved'));
  } catch (err) { next(err); }
};
