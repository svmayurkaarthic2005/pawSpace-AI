import mongoose from 'mongoose';
import { UserLocation } from '../models/userLocation.model';
import { Pet } from '../models/pet.model';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NearbyUser {
  userId: string;
  username: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  distanceMeters: number;
  pets: Array<{
    _id: string;
    name: string;
    species: string;
    breed?: string;
    images: Array<{ url: string; isProfile: boolean }>;
  }>;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class DiscoveryService {
  /**
   * Upsert the user's current location. TTL index auto-expires after 1hr.
   */
  async updateUserLocation(
    userId: string,
    lat: number,
    lng: number,
    accuracy?: number,
  ): Promise<void> {
    await UserLocation.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(userId) },
      {
        $set: {
          location: { type: 'Point', coordinates: [lng, lat] },
          accuracy,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    ).exec();
  }

  /**
   * Find users near a point using $geoNear aggregation.
   * Excludes the requesting user. Joins with User + Pets.
   */
  async getNearbyUsers(
    requestingUserId: string,
    lat: number,
    lng: number,
    radiusKm: number = 10,
  ): Promise<NearbyUser[]> {
    const maxDistanceMeters = radiusKm * 1000;

    const pipeline: mongoose.PipelineStage[] = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: {
            user: { $ne: new mongoose.Types.ObjectId(requestingUserId) },
          },
        },
      },
      { $limit: 50 },
      // Join with User
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
          pipeline: [
            { $project: { username: 1, name: 1, avatar: 1, isVerified: 1 } },
          ],
        },
      },
      { $unwind: '$userInfo' },
      // Join with Pets
      {
        $lookup: {
          from: 'pets',
          localField: 'user',
          foreignField: 'owner',
          as: 'pets',
          pipeline: [
            { $project: { name: 1, species: 1, breed: 1, images: { $slice: ['$images', 1] } } },
          ],
        },
      },
      {
        $project: {
          userId: '$user',
          username: '$userInfo.username',
          name: '$userInfo.name',
          avatar: '$userInfo.avatar',
          isVerified: '$userInfo.isVerified',
          distanceMeters: 1,
          pets: 1,
        },
      },
    ];

    return UserLocation.aggregate(pipeline).exec() as Promise<NearbyUser[]>;
  }

  /**
   * Find nearby pet owners filtered by pet species.
   */
  async getNearbyPetOwners(
    requestingUserId: string,
    species: string,
    lat: number,
    lng: number,
    radiusKm: number = 10,
  ): Promise<NearbyUser[]> {
    const maxDistanceMeters = radiusKm * 1000;

    // First find users who own pets of the given species
    const petOwners = await Pet.find({ species })
      .select('owner')
      .lean()
      .exec();

    const ownerIds = petOwners.map((p) => (p as { owner: mongoose.Types.ObjectId }).owner);

    const pipeline: mongoose.PipelineStage[] = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: {
            user: {
              $in: ownerIds,
              $ne: new mongoose.Types.ObjectId(requestingUserId),
            },
          },
        },
      },
      { $limit: 30 },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
          pipeline: [{ $project: { username: 1, name: 1, avatar: 1, isVerified: 1 } }],
        },
      },
      { $unwind: '$userInfo' },
      {
        $lookup: {
          from: 'pets',
          localField: 'user',
          foreignField: 'owner',
          as: 'pets',
          pipeline: [
            { $match: { species } },
            { $project: { name: 1, species: 1, breed: 1, images: { $slice: ['$images', 1] } } },
          ],
        },
      },
      {
        $project: {
          userId: '$user',
          username: '$userInfo.username',
          name: '$userInfo.name',
          avatar: '$userInfo.avatar',
          isVerified: '$userInfo.isVerified',
          distanceMeters: 1,
          pets: 1,
        },
      },
    ];

    return UserLocation.aggregate(pipeline).exec() as Promise<NearbyUser[]>;
  }
}

export const discoveryService = new DiscoveryService();
