import { Request, Response } from 'express';
import { Event } from '../models/event.model';
import { UserLocation } from '../models/userLocation.model';
import { User } from '../models/user.model';
import { Pet } from '../models/pet.model';
import { Follow } from '../models/follow.model';
import { getPlaceAutocomplete, getDirections } from '../utils/googleMaps.util';
import { redis } from '../config/redis';
import { Block } from '../models/block.model';
import mongoose from 'mongoose';

export const getNearbyEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius = 25, species, dateFilter = 'any', limit = 50 } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    // Build query filters
    const matchQuery: any = {
      status: 'upcoming',
    };

    if (req.user?.userId) {
      const blockedDocs = await Block.find({ blocker: req.user.userId }).distinct('blocked');
      const blockedMeDocs = await Block.find({ blocked: req.user.userId }).distinct('blocker');
      const allBlockedIds = [...blockedDocs, ...blockedMeDocs];
      if (allBlockedIds.length > 0) {
        matchQuery.creator = { $nin: allBlockedIds };
      }
    }

    // Species filter
    if (species && species !== '') {
      const speciesArray = (species as string).split(',').map((s) => s.trim().toLowerCase());
      matchQuery.pet_friendly_species = { $in: speciesArray };
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'today') {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      matchQuery.startDate = { $gte: now, $lte: endOfDay };
    } else if (dateFilter === 'weekend') {
      const dayOfWeek = now.getDay();
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + daysUntilSaturday);
      saturday.setHours(0, 0, 0, 0);
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      sunday.setHours(23, 59, 59, 999);
      matchQuery.startDate = { $gte: saturday, $lte: sunday };
    } else if (dateFilter === 'week') {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);
      matchQuery.startDate = { $gte: now, $lte: endOfWeek };
    }

    // Geospatial aggregation
    const events = await Event.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distanceMeters',
          maxDistance: radiusKm * 1000,
          spherical: true,
          query: matchQuery,
        },
      },
      {
        $addFields: {
          distanceKm: { $divide: ['$distanceMeters', 1000] },
        },
      },
      { $limit: parseInt(limit as string) },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator',
        },
      },
      { $unwind: '$creator' },
      {
        $lookup: {
          from: 'rsvps',
          let: { eventId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$event', '$$eventId'] } } },
            { $limit: 3 },
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails',
              },
            },
            { $unwind: '$userDetails' },
            { $project: { avatar: '$userDetails.avatar' } },
          ],
          as: 'attendees',
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          coverImage: 1,
          location: 1,
          startDate: 1,
          endDate: 1,
          distanceKm: 1,
          rsvpCount: 1,
          pet_friendly_species: 1,
          tags: 1,
          attendeeAvatars: '$attendees.avatar',
          creator: {
            _id: '$creator._id',
            username: '$creator.username',
            avatar: '$creator.avatar',
          },
        },
      },
    ]);

    res.json({ events });
  } catch (error) {
    console.error('Get nearby events error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby events' });
  }
};

export const getNearbyUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius = 25, species } = req.query;
    const userId = req.user?.userId;

    if (!lat || !lng) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    // Get users already following
    const following = await Follow.find({ follower: userId }).distinct('following');

    // Get blocked users
    const blockedDocs = await Block.find({ blocker: userId }).distinct('blocked');
    const blockedMeDocs = await Block.find({ blocked: userId }).distinct('blocker');
    const allBlockedIds = [...blockedDocs, ...blockedMeDocs].map(id => id.toString());

    // Geospatial aggregation on UserLocation
    const nearbyLocations = await UserLocation.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distanceMeters',
          maxDistance: radiusKm * 1000,
          spherical: true,
        },
      },
      { $limit: 60 },
      {
        $addFields: {
          distanceKm: { $divide: ['$distanceMeters', 1000] },
        },
      },
    ]);

    // Filter out self, already following, and blocked users
    const filteredLocations = nearbyLocations.filter(
      (loc) => 
        loc.user.toString() !== userId?.toString() && 
        !following.some((fid) => fid.toString() === loc.user.toString()) &&
        !allBlockedIds.includes(loc.user.toString())
    );

    // Populate user details and first pet
    const users = await Promise.all(
      filteredLocations.map(async (loc) => {
        const user = await User.findById(loc.user).select('username name avatar bio');
        if (!user) return null;

        const pets = await Pet.find({ owner: user._id }).limit(1).select('name breed species images');
        const firstPet = pets[0] || null;

        // Species filter
        if (species && species !== '') {
          const speciesArray = (species as string).split(',').map((s) => s.trim().toLowerCase());
          if (!firstPet || !speciesArray.includes(firstPet.species.toLowerCase())) {
            return null;
          }
        }

        return {
          userId: user._id,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          distanceKm: loc.distanceKm,
          location: loc.location,
          firstPet: firstPet
            ? {
                name: firstPet.name,
                breed: firstPet.breed,
                species: firstPet.species,
                image: firstPet.images && firstPet.images[0] ? firstPet.images[0].url : undefined,
              }
            : null,
        };
      })
    );

    const validUsers = users.filter((u) => u !== null);

    res.json({ users: validUsers });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby users' });
  }
};

export const updateUserLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, accuracy = 0 } = req.body;
    const userId = req.user?.userId;

    if (!lat || !lng) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Validate coordinates
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      res.status(400).json({ error: 'Invalid coordinates' });
      return;
    }

    // Upsert user location
    await UserLocation.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        accuracy: parseFloat(accuracy),
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Cache in Redis
    try {
      await redis.setex(`location:${userId}`, 300, JSON.stringify({ lat: latitude, lng: longitude }));
    } catch (redisError) {
      console.error('Redis cache error:', redisError);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

export const geocodeSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, lat, lng } = req.query;

    if (!q) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const proximity =
      lat && lng
        ? {
            lat: parseFloat(lat as string),
            lng: parseFloat(lng as string),
          }
        : undefined;

    const results = await getPlaceAutocomplete(q as string, proximity);

    res.json({ results });
  } catch (error) {
    console.error('Geocode search error:', error);
    res.status(500).json({ error: 'Geocode search failed' });
  }
};

export const getDirectionsRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { originLat, originLng, destLat, destLng, mode = 'walking' } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      res.status(400).json({ error: 'Origin and destination coordinates are required' });
      return;
    }

    const origin = {
      lat: parseFloat(originLat as string),
      lng: parseFloat(originLng as string),
    };

    const destination = {
      lat: parseFloat(destLat as string),
      lng: parseFloat(destLng as string),
    };

    const result = await getDirections(origin, destination, mode as 'walking' | 'driving');

    if (!result) {
      res.status(404).json({ error: 'No route found' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Get directions error:', error);
    res.status(500).json({ error: 'Failed to get directions' });
  }
};

export const deleteUserLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Delete from DB
    await UserLocation.findOneAndDelete({ user: userId });

    // Delete from Redis
    try {
      await redis.del(`location:${userId}`);
    } catch (redisError) {
      console.error('Redis cache error:', redisError);
    }

    res.json({ ok: true, message: 'Location tracking disabled and location deleted.' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
};
