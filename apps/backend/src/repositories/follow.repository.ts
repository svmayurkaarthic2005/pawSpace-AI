import mongoose from 'mongoose';
import { Follow, IFollow } from '../models/follow.model';
import { redis } from '../config/redis';

const FOLLOWING_IDS_KEY = (userId: string) => `following_ids:${userId}`;
const FOLLOWING_IDS_TTL = 300; // 5 minutes
const DEFAULT_LIMIT = 20;

export class FollowRepository {
  async follow(followerId: string, followingId: string): Promise<IFollow> {
    const follow = new Follow({ follower: followerId, following: followingId });
    const saved = await follow.save();
    // Invalidate cached following IDs
    await redis.del(FOLLOWING_IDS_KEY(followerId));
    return saved;
  }

  async unfollow(followerId: string, followingId: string): Promise<boolean> {
    const result = await Follow.findOneAndDelete({
      follower: followerId,
      following: followingId,
    }).exec();
    // Invalidate cached following IDs
    await redis.del(FOLLOWING_IDS_KEY(followerId));
    return result !== null;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const count = await Follow.countDocuments({
      follower: followerId,
      following: followingId,
    }).exec();
    return count > 0;
  }

  async getFollowers(
    userId: string,
    page: number = 1,
    limit: number = DEFAULT_LIMIT,
  ): Promise<{ items: IFollow[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Follow.find({ following: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('follower', 'username name avatar isVerified followerCount')
        .lean()
        .exec(),
      Follow.countDocuments({ following: userId }),
    ]);
    return { items: items as unknown as IFollow[], total };
  }

  async getFollowing(
    userId: string,
    page: number = 1,
    limit: number = DEFAULT_LIMIT,
  ): Promise<{ items: IFollow[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Follow.find({ follower: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('following', 'username name avatar isVerified followerCount')
        .lean()
        .exec(),
      Follow.countDocuments({ follower: userId }),
    ]);
    return { items: items as unknown as IFollow[], total };
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

    const follows = await Follow.find({ follower: userId })
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
      Follow.find({ following: otherUserId }).select('follower').lean().exec(),
    ]);
    const theirFollowerIds = new Set(
      theirFollowers.map((f) => (f.follower as mongoose.Types.ObjectId).toString()),
    );
    return myFollowing.filter((id) => theirFollowerIds.has(id));
  }
}

export const followRepository = new FollowRepository();
