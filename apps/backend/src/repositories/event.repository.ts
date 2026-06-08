import mongoose from 'mongoose';
import { Event, IEvent } from '../models/event.model';
import { RSVP, IRSVP } from '../models/rsvp.model';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateEventData {
  creator: string;
  title: string;
  description: string;
  coverImage?: string;
  location: {
    name: string;
    address: string;
    coordinates: { type: 'Point'; coordinates: [number, number] };
  };
  startDate: Date;
  endDate: Date;
  petFriendlySpecies: string[];
  maxAttendees?: number;
  tags?: string[];
}

export interface NearbyEventFilters {
  species?: string[];
  startDateFrom?: Date;
  startDateTo?: Date;
  status?: string;
  tags?: string[];
}

export interface NearbyEventResult extends IEvent {
  distanceMeters: number;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class EventRepository {
  async create(data: CreateEventData): Promise<IEvent> {
    const event = new Event(data);
    return event.save();
  }

  async findById(id: string): Promise<IEvent | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Event.findById(id)
      .populate('creator', 'username name avatar isVerified')
      .exec();
  }

  async updateById(id: string, data: Partial<CreateEventData>): Promise<IEvent | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Event.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await Event.findByIdAndDelete(id).exec();
    return result !== null;
  }

  /**
   * $geoNear aggregation — finds events within radiusKm, sorted by distance.
   */
  async findNearby(
    coordinates: [number, number], // [lng, lat]
    radiusKm: number,
    filters: NearbyEventFilters = {},
  ): Promise<NearbyEventResult[]> {
    const maxDistanceMeters = radiusKm * 1000;

    const matchStage: mongoose.FilterQuery<IEvent> = {
      status: filters.status ?? 'upcoming',
    };

    if (filters.species && filters.species.length > 0) {
      matchStage.petFriendlySpecies = { $in: filters.species };
    }
    if (filters.startDateFrom) {
      matchStage.startDate = { $gte: filters.startDateFrom };
    }
    if (filters.startDateTo) {
      matchStage.startDate = { ...matchStage.startDate as object, $lte: filters.startDateTo };
    }
    if (filters.tags && filters.tags.length > 0) {
      matchStage.tags = { $in: filters.tags };
    }

    const pipeline: mongoose.PipelineStage[] = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates },
          distanceField: 'distanceMeters',
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: matchStage,
        },
      },
      { $limit: 50 },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator',
          pipeline: [{ $project: { username: 1, name: 1, avatar: 1, isVerified: 1 } }],
        },
      },
      { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
    ];

    return Event.aggregate(pipeline).exec() as Promise<NearbyEventResult[]>;
  }

  async findByUser(userId: string): Promise<IEvent[]> {
    return Event.find({ creator: userId })
      .sort({ startDate: 1 })
      .populate('creator', 'username name avatar')
      .exec();
  }

  async findUpcoming(page = 1, limit = 20): Promise<{ items: IEvent[]; total: number }> {
    const skip = (page - 1) * limit;
    const now = new Date();
    const [items, total] = await Promise.all([
      Event.find({ status: 'upcoming', startDate: { $gte: now } })
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit)
        .populate('creator', 'username name avatar')
        .lean()
        .exec(),
      Event.countDocuments({ status: 'upcoming', startDate: { $gte: now } }),
    ]);
    return { items: items as unknown as IEvent[], total };
  }

  async incrementRSVPCount(eventId: string): Promise<void> {
    await Event.findByIdAndUpdate(eventId, { $inc: { rsvpCount: 1 } }).exec();
  }

  async decrementRSVPCount(eventId: string): Promise<void> {
    await Event.findByIdAndUpdate(eventId, { $inc: { rsvpCount: -1 } }).exec();
  }

  // ── RSVP helpers ──────────────────────────────────────────────────────────

  async upsertRSVP(eventId: string, userId: string, status: 'going' | 'maybe' | 'not_going'): Promise<{ rsvp: IRSVP; isNew: boolean }> {
    const existing = await RSVP.findOne({ event: eventId, user: userId }).exec();
    if (existing) {
      existing.status = status;
      await existing.save();
      return { rsvp: existing, isNew: false };
    }
    const rsvp = await RSVP.create({ event: eventId, user: userId, status });
    return { rsvp, isNew: true };
  }

  async getRSVP(eventId: string, userId: string): Promise<IRSVP | null> {
    return RSVP.findOne({ event: eventId, user: userId }).exec();
  }

  async getAttendees(eventId: string, page = 1, limit = 20): Promise<{ items: IRSVP[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      RSVP.find({ event: eventId, status: { $in: ['going', 'maybe'] } })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username name avatar isVerified')
        .lean()
        .exec(),
      RSVP.countDocuments({ event: eventId, status: { $in: ['going', 'maybe'] } }),
    ]);
    return { items: items as unknown as IRSVP[], total };
  }
}

export const eventRepository = new EventRepository();
