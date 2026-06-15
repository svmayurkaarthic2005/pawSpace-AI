import mongoose from 'mongoose';
import { Follow, IFollow, FollowableEntityType } from '../models/follow.model';
import { redis } from '../config/redis';

const FOLLOWING_IDS_KEY = (userId: string) => `following_ids:${userId}`;
const FOLLOWING_IDS_TTL = 300; // 5 minutes
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50; // Maximum page size per Requirement 14.5

export class FollowRepository {
  async follow(followerId: string, followingId: string, entityType: FollowableEntityType, status: 'pending' | 'accepted' = 'accepted'): Promise<IFollow> {
    const follow = new Follow({ 
      follower: followerId, 
      following: followingId,
      entityType,
      status
    });
    const saved = await follow.save();
    // Invalidate cached following IDs and nearby explore cache
    await redis.del(FOLLOWING_IDS_KEY(followerId), `explore:nearby:${followerId}`);
    return saved;
  }

  async unfollow(followerId: string, followingId: string, entityType: FollowableEntityType): Promise<boolean> {
    const result = await Follow.findOneAndDelete({
      follower: followerId,
      following: followingId,
      entityType,
    }).exec();
    // Invalidate cached following IDs and nearby explore cache
    await redis.del(FOLLOWING_IDS_KEY(followerId), `explore:nearby:${followerId}`);
    return result !== null;
  }

  async isFollowing(followerId: string, followingId: string, entityType: FollowableEntityType): Promise<boolean> {
    const count = await Follow.countDocuments({
      follower: followerId,
      following: followingId,
      entityType,
      status: 'accepted',
    }).exec();
    return count > 0;
  }

  async getFollowRecord(followerId: string, followingId: string, entityType: FollowableEntityType): Promise<IFollow | null> {
    return await Follow.findOne({
      follower: followerId,
      following: followingId,
      entityType,
    }).exec();
  }

  async getFollowers(
    entityId: string,
    entityType: FollowableEntityType,
    page: number = 1,
    limit: number = DEFAULT_LIMIT,
  ): Promise<{ items: IFollow[]; total: number; page: number; limit: number }> {
    // Enforce maximum page size at repository layer
    const validatedLimit = Math.min(limit, MAX_LIMIT);
    const skip = (page - 1) * validatedLimit;
    
    const [items, total] = await Promise.all([
      Follow.find({ following: entityId, entityType, status: 'accepted' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validatedLimit)
        .populate('follower', 'username name avatar isVerified followerCount')
        .lean()
        .exec(),
      Follow.countDocuments({ following: entityId, entityType, status: 'accepted' }),
    ]);
    return { items: items as unknown as IFollow[], total, page, limit: validatedLimit };
  }

  async getFollowing(
    userId: string,
    page: number = 1,
    limit: number = DEFAULT_LIMIT,
  ): Promise<{ items: IFollow[]; total: number }> {
    // Enforce maximum page size at repository layer
    const validatedLimit = Math.min(limit, MAX_LIMIT);
    const skip = (page - 1) * validatedLimit;
    
    const [items, total] = await Promise.all([
      Follow.find({ follower: userId, status: 'accepted' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validatedLimit)
        .populate('following', 'username name avatar isVerified followerCount')
        .lean()
        .exec(),
      Follow.countDocuments({ follower: userId, status: 'accepted' }),
    ]);
    return { items: items as unknown as IFollow[], total };
  }

  /**
   * Returns Follow records with entityType for polymorphic following list.
   * Used by service layer to separate users and pets.
   */
  async getFollowingWithType(
    userId: string,
    page: number = 1,
    limit: number = DEFAULT_LIMIT,
  ): Promise<IFollow[]> {
    // Enforce maximum page size at repository layer
    const validatedLimit = Math.min(limit, MAX_LIMIT);
    const skip = (page - 1) * validatedLimit;
    
    const results = await Follow.find({ follower: userId, status: 'accepted' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validatedLimit)
      .select('following entityType createdAt')
      .lean()
      .exec();
    return results as unknown as IFollow[];
  }

  /**
   * Returns just the IDs of entities that userId follows, filtered by type.
   */
  async getFollowingIdsByType(userId: string, entityType: FollowableEntityType): Promise<string[]> {
    const follows = await Follow.find({ follower: userId, entityType, status: 'accepted' })
      .select('following')
      .lean()
      .exec();

    return follows.map((f) => (f.following as mongoose.Types.ObjectId).toString());
  }

  /**
   * Returns just the IDs of users that userId follows.
   * Cached in Redis for 5 minutes.
   */
  async getFollowingIds(userId: string): Promise<string[]> {
    const cacheKey = FOLLOWING_IDS_KEY(userId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as string[];
    }

    const follows = await Follow.find({ follower: userId, status: 'accepted' })
      .select('following')
      .lean()
      .exec();

    const ids = follows.map((f) => (f.following as mongoose.Types.ObjectId).toString());
    await redis.set(cacheKey, JSON.stringify(ids), 'EX', FOLLOWING_IDS_TTL);
    return ids;
  }

  async getMutualFollowers(userId: string, otherUserId: string): Promise<string[]> {
    const [myFollowing, theirFollowers] = await Promise.all([
      this.getFollowingIds(userId),
      Follow.find({ following: otherUserId, status: 'accepted' }).select('follower').lean().exec(),
    ]);
    const theirFollowerIds = new Set(
      theirFollowers.map((f) => (f.follower as mongoose.Types.ObjectId).toString()),
    );
    return myFollowing.filter((id) => theirFollowerIds.has(id));
  }
}

export const followRepository = new FollowRepository();
