import { eventRepository, CreateEventData, NearbyEventFilters } from '../repositories/event.repository';
import { uploadImage } from '../utils/cloudinary.util';
import { geocodeAddress } from '../utils/googleMaps.util';
import { eventRecommendationAI } from './ai/event-recommendation.ai.service';
import { notificationService } from './notification.service';
import { AppError } from '../middleware/error';
import { IEvent } from '../models/event.model';
import { User } from '../models/user.model';
import { Pet } from '../models/pet.model';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateEventInput {
  title: string;
  description: string;
  address: string;
  locationName: string;
  startDate: string;
  endDate: string;
  petFriendlySpecies: string[];
  maxAttendees?: number;
  tags?: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class EventService {
  /**
   * Create an event: geocode address, upload cover image, save.
   */
  async createEvent(
    userId: string,
    input: CreateEventInput,
    coverImageBuffer?: Buffer,
  ): Promise<IEvent> {
    // Geocode address to get coordinates
    const geocoded = await geocodeAddress(input.address);
    if (!geocoded) {
      throw new AppError(
        'Unable to geocode the provided address. Please provide a more specific address or check if Google Maps API is configured.',
        400,
        true,
        'GEOCODE_FAILED'
      );
    }
    
    // Upload cover image if provided
    let coverImage: string | undefined;
    if (coverImageBuffer) {
      const uploaded = await uploadImage(coverImageBuffer, 'pawspace/events');
      coverImage = uploaded.url;
    }

    const data: CreateEventData = {
      creator: userId,
      title: input.title,
      description: input.description,
      coverImage,
      location: {
        name: input.locationName,
        address: input.address,
        coordinates: {
          type: 'Point',
          coordinates: [geocoded.lng, geocoded.lat], // [lng, lat] for GeoJSON
        },
      },
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      petFriendlySpecies: input.petFriendlySpecies,
      maxAttendees: input.maxAttendees,
      tags: input.tags ?? [],
    };

    return eventRepository.create(data);
  }

  /**
   * Get nearby events with optional AI reranking.
   */
  async getNearbyEvents(
    userId: string,
    lat: number,
    lng: number,
    radiusKm: number = 25,
    filters: NearbyEventFilters = {},
    useAI: boolean = true,
  ) {
    const events = await eventRepository.findNearby([lng, lat], radiusKm, filters);

    if (!useAI || events.length === 0) return events;

    // AI reranking: get user's pets for context
    try {
      const [user, pets] = await Promise.all([
        User.findById(userId).select('username').lean().exec(),
        Pet.find({ owner: userId }).select('name species breed age').lean().exec(),
      ]);

      if (!user || pets.length === 0) return events;

      const recommendations = await eventRecommendationAI.recommendEvents(
        userId,
        { username: (user as { username: string }).username },
        pets.map((p) => ({
          name: (p as { name: string }).name,
          species: (p as { species: string }).species,
          breed: (p as { breed?: string }).breed,
          age: (p as { age?: number }).age,
        })),
        events.map((e) => ({
          id: e._id.toString(),
          title: e.title,
          description: e.description.slice(0, 200),
          petFriendlySpecies: e.petFriendlySpecies,
          tags: e.tags,
          startDate: e.startDate.toISOString(),
          location: { name: e.location.name, address: e.location.address },
          rsvpCount: e.rsvpCount,
          maxAttendees: e.maxAttendees,
        })),
      );

      if (recommendations.length === 0) return events;

      // Reorder events by AI score
      const scoreMap = new Map(recommendations.map((r) => [r.eventId, r.score]));
      return [...events].sort((a, b) => {
        const scoreA = scoreMap.get(a._id.toString()) ?? 0;
        const scoreB = scoreMap.get(b._id.toString()) ?? 0;
        return scoreB - scoreA;
      });
    } catch {
      // Fall back to distance-sorted results on AI error
      return events;
    }
  }

  /**
   * RSVP to an event. Checks capacity, updates count.
   */
  async rsvpEvent(
    userId: string,
    eventId: string,
    status: 'going' | 'maybe' | 'not_going',
  ): Promise<{ rsvpCount: number; userStatus: string }> {
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404, true, 'EVENT_NOT_FOUND');

    // Check capacity for 'going' RSVPs
    if (status === 'going' && event.maxAttendees) {
      const existing = await eventRepository.getRSVP(eventId, userId);
      if (!existing || existing.status !== 'going') {
        if (event.rsvpCount >= event.maxAttendees) {
          throw new AppError('This event is at full capacity', 400, true, 'EVENT_FULL');
        }
      }
    }

    const { rsvp, isNew } = await eventRepository.upsertRSVP(eventId, userId, status);

    // Update rsvpCount
    if (isNew && (status === 'going' || status === 'maybe')) {
      await eventRepository.incrementRSVPCount(eventId);
    } else if (!isNew) {
      const wasActive = rsvp.status === 'going' || rsvp.status === 'maybe';
      const nowActive = status === 'going' || status === 'maybe';
      if (!wasActive && nowActive) await eventRepository.incrementRSVPCount(eventId);
      if (wasActive && !nowActive) await eventRepository.decrementRSVPCount(eventId);
    }

    // Create notification for event creator (if going and not self-RSVP)
    if (status === 'going' && event.creator.toString() !== userId) {
      notificationService.createNotification({
        recipient: event.creator.toString(),
        sender: userId,
        type: 'event_rsvp',
        entityId: eventId,
        entityType: 'Event',
        entityImage: event.coverImage,
        entityName: event.title,
      }).catch(err => console.error('[rsvpEvent] Notification error:', err));
    }

    const updated = await eventRepository.findById(eventId);
    return { rsvpCount: updated?.rsvpCount ?? 0, userStatus: status };
  }

  async getEventAttendees(eventId: string, page: number, limit: number) {
    return eventRepository.getAttendees(eventId, page, limit);
  }

  async getEventById(eventId: string, userId?: string) {
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404, true, 'EVENT_NOT_FOUND');

    let userRsvp = null;
    if (userId) {
      userRsvp = await eventRepository.getRSVP(eventId, userId);
    }

    return { event, userRsvp };
  }

  async getDirectionsToEvent(
    _originLat: number,
    _originLng: number,
    eventId: string,
    _profile: 'walking' | 'driving' = 'walking',
  ) {
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404, true, 'EVENT_NOT_FOUND');

    // Directions functionality removed - integrate alternative mapping service as needed
    throw new AppError('Directions service not available', 501, true, 'SERVICE_UNAVAILABLE');
  }

  async getUpcomingEvents(page: number, limit: number) {
    return eventRepository.findUpcoming(page, limit);
  }

  async getUserEvents(userId: string) {
    return eventRepository.findByUser(userId);
  }
}

export const eventService = new EventService();
