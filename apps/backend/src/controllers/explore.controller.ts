import { Request, Response, NextFunction } from 'express';
import { Post } from '../models/post.model';
import { Community } from '../models/community.model';
import { UserLocation } from '../models/userLocation.model';
import { Pet } from '../models/pet.model';
import { redis } from '../config/redis';
import { AppError } from '../middleware/error';
import { successResponse } from '../utils';
import { followRepository } from '../repositories/follow.repository';
import mongoose from 'mongoose';

// ─── Cache Keys & TTLs ────────────────────────────────────────────────────────

const EXPLORE_TRENDING_KEY = 'explore:trending';
const EXPLORE_NEARBY_KEY = (userId: string) => `explore:nearby:${userId}`;
const EXPLORE_COMMUNITIES_KEY = (userId: string) => `explore:communities:${userId}`;
const HASHTAG_POSTS_KEY = (tag: string, page: number) => `explore:hashtag:${tag}:${page}`;

const TRENDING_TTL = 600; // 10 minutes
const NEARBY_TTL = 300; // 5 minutes
const COMMUNITIES_TTL = 600; // 10 minutes
const HASHTAG_TTL = 300; // 5 minutes

// ─── GET /explore/trending ────────────────────────────────────────────────────

export const getTrending = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');

    // Check cache
    const cached = await redis.get(EXPLORE_TRENDING_KEY);
    if (cached) {
      return void res.status(200).json(successResponse(JSON.parse(cached), 'Trending content retrieved'));
    }

    const userId = req.user.userId;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    // Parallel fetch
    const [hashtags, posts, communities, nearbyUsers] = await Promise.all([
      // Trending hashtags
      Post.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo }, hashtags: { $ne: [] } } },
        { $unwind: '$hashtags' },
        { $group: { _id: '$hashtags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
        {
          $project: {
            _id: 0,
            tag: '$_id',
            postCount: '$count',
            isHot: { $gt: ['$count', 50] },
          },
        },
      ]),

      // Trending posts (last 48 hours, sorted by engagement)
      Post.find({ createdAt: { $gte: twoDaysAgo }, visibility: 'public' })
        .sort({ likesCount: -1, commentsCount: -1 })
        .limit(20)
        .populate('author', 'username name avatar isVerified')
        .populate('pet', 'name species avatar')
        .lean(),

      // Community recommendations
      getCommunityRecommendations(userId),

      // Nearby users
      getNearbyUsers(userId),
    ]);

    const result = { hashtags, posts, communities, nearbyUsers };

    // Cache for 10 minutes
    await redis.set(EXPLORE_TRENDING_KEY, JSON.stringify(result), 'EX', TRENDING_TTL);

    res.status(200).json(successResponse(result, 'Trending content retrieved'));
  } catch (err) {
    next(err);
  }
};

// ─── GET /explore/hashtag/:tag ────────────────────────────────────────────────

export const getHashtagPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');

    const { tag } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    if (!tag) throw new AppError('Hashtag is required', 400, true, 'VALIDATION_ERROR');

    const normalizedTag = tag.toLowerCase().replace(/^#/, '');

    // Check cache
    const cacheKey = HASHTAG_POSTS_KEY(normalizedTag, page);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return void res.status(200).json(successResponse(JSON.parse(cached), 'Hashtag posts retrieved'));
    }

    const [posts, total] = await Promise.all([
      Post.find({ hashtags: normalizedTag, visibility: 'public' })
        .sort({ likesCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username name avatar isVerified')
        .populate('pet', 'name species avatar')
        .lean(),
      Post.countDocuments({ hashtags: normalizedTag, visibility: 'public' }),
    ]);

    const result = {
      posts,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + posts.length < total,
      },
    };

    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(result), 'EX', HASHTAG_TTL);

    res.status(200).json(successResponse(result, 'Hashtag posts retrieved'));
  } catch (err) {
    next(err);
  }
};

// ─── GET /search/suggestions ──────────────────────────────────────────────────

export const getSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');

    const query = (req.query.q as string)?.trim() || '';

    // Static templates
    const templates = [
      'Find dog meetups nearby',
      'Cat communities in my area',
      'Weekend events for pets',
      'Golden retriever owners',
      'Pet training classes',
    ];

    // If no query, return templates
    if (!query) {
      return void res.status(200).json(successResponse({ suggestions: templates }, 'Suggestions retrieved'));
    }

    // Get popular searches from Redis
    const popular = await redis.zrevrange('search:popular', 0, 4);
    
    // Filter popular searches that match query
    const filtered = popular.filter((s) => s.toLowerCase().includes(query.toLowerCase()));

    // Combine with templates
    const suggestions = [...new Set([...filtered, ...templates])].slice(0, 5);

    res.status(200).json(successResponse({ suggestions }, 'Suggestions retrieved'));
  } catch (err) {
    next(err);
  }
};

// ─── POST /search/track ───────────────────────────────────────────────────────

export const trackSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');

    const { query } = req.body as { query: string };
    if (!query?.trim()) throw new AppError('Query is required', 400, true, 'VALIDATION_ERROR');

    // Increment search count in Redis sorted set
    await redis.zincrby('search:popular', 1, query.trim());

    res.status(200).json(successResponse({}, 'Search tracked'));
  } catch (err) {
    next(err);
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCommunityRecommendations(userId: string): Promise<any[]> {
  // Check cache
  const cacheKey = EXPLORE_COMMUNITIES_KEY(userId);
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Get user's pets to determine species
  const userPets = await Pet.find({ owner: userId }).select('species').lean();
  const userSpecies = [...new Set(userPets.map((p) => p.species.toLowerCase()))];

  // Get user's joined communities
  const userCommunities = await Community.find({
    members: new mongoose.Types.ObjectId(userId),
  })
    .select('_id')
    .lean();
  const joinedCommunityIds = userCommunities.map((c) => c._id);

  // Find recommended communities
  const query: any = {
    _id: { $nin: joinedCommunityIds },
    isPrivate: false,
  };

  if (userSpecies.length > 0) {
    query.species = { $in: userSpecies };
  }

  const communities = await Community.find(query)
    .sort({ memberCount: -1 })
    .limit(10)
    .populate('creator', 'username name avatar')
    .lean();

  // Cache for 10 minutes
  await redis.set(cacheKey, JSON.stringify(communities), 'EX', COMMUNITIES_TTL);

  return communities;
}

async function getNearbyUsers(userId: string): Promise<any[]> {
  // Check cache
  const cacheKey = EXPLORE_NEARBY_KEY(userId);
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Get current user's location
  const userLocation = await UserLocation.findOne({ user: userId }).lean();
  if (!userLocation) return [];

  // Get users the current user is already following
  const followingIds = await followRepository.getFollowingIds(userId);
  const excludeIds = [...followingIds, userId].map((id) => new mongoose.Types.ObjectId(id));

  // Find nearby users
  const nearbyLocations = await UserLocation.aggregate([
    {
      $geoNear: {
        near: userLocation.location,
        distanceField: 'distance',
        maxDistance: 25000, // 25km in meters
        spherical: true,
        query: { user: { $nin: excludeIds } },
      },
    },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $lookup: {
        from: 'pets',
        let: { userId: '$user._id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$owner', '$$userId'] } } },
          { $limit: 1 },
          { $project: { name: 1, species: 1, avatar: 1 } },
        ],
        as: 'pet',
      },
    },
    {
      $project: {
        _id: '$user._id',
        username: '$user.username',
        name: '$user.name',
        avatar: '$user.avatar',
        bio: '$user.bio',
        followerCount: '$user.followerCount',
        distance: { $round: [{ $divide: ['$distance', 1000] }, 1] }, // meters to km
        pet: { $arrayElemAt: ['$pet', 0] },
      },
    },
  ]);

  // Cache for 5 minutes
  await redis.set(cacheKey, JSON.stringify(nearbyLocations), 'EX', NEARBY_TTL);

  return nearbyLocations;
}
