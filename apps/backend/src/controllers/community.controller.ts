import { Request, Response, NextFunction } from 'express';
import { Community } from '../models/community.model';
import { CommunityMembership } from '../models/communityMembership.model';
import { CommunityPost } from '../models/communityPost.model';
import { redis } from '../config/redis';
import { AppError } from '../middleware/error';
import { successResponse } from '../utils';
import { communityRecommendationAIService } from '../services/ai/community-recommendation.ai.service';

// ─── Helper: Generate Slug ────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');
}

// ─── GET /communities/mine ────────────────────────────────────────────────────

export const getMyCommunities = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const userId = req.user.userId;

    // Fetch user's memberships with community data
    const memberships = await CommunityMembership.find({ user: userId })
      .populate({
        path: 'community',
        select:
          '_id name slug description avatar coverImage accentColor species tags memberCount lastActivityAt isPrivate',
      })
      .sort({ joinedAt: -1 })
      .lean();

    // Map to include hasUnread flag
    const communitiesWithUnread = memberships.map((membership: any) => {
      const community = membership.community;
      const hasUnread = community.lastActivityAt > membership.lastReadAt;

      return {
        community,
        hasUnread,
        unreadCount: membership.unreadCount,
        role: membership.role,
        joinedAt: membership.joinedAt,
      };
    });

    // Sort by last activity
    communitiesWithUnread.sort((a, b) => {
      const dateA = new Date(a.community.lastActivityAt).getTime();
      const dateB = new Date(b.community.lastActivityAt).getTime();
      return dateB - dateA;
    });

    res.json(successResponse(communitiesWithUnread, 'My communities retrieved'));
  } catch (error) {
    next(error);
  }
};

// ─── GET /communities/discover ────────────────────────────────────────────────

export const getDiscoverCommunities = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const userId = req.user.userId;
    const speciesFilter = (req.query.species as string) || null;

    // Get communities user has joined
    const memberships = await CommunityMembership.find({ user: userId }).select('community').lean();
    const joinedIds = memberships.map((m) => m.community);

    // Build query
    const query: any = {
      _id: { $nin: joinedIds },
      isPrivate: false,
    };

    if (speciesFilter && speciesFilter !== 'all') {
      query.species = { $in: [speciesFilter] };
    }

    // Fetch communities
    const allCommunities = await Community.find(query)
      .sort({ memberCount: -1 })
      .limit(50)
      .select('_id name slug description avatar coverImage accentColor species tags memberCount isPrivate')
      .lean();

    res.json(
      successResponse(
        {
          allCommunities,
        },
        'Discover communities retrieved',
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET /communities/recommended ─────────────────────────────────────────────

export const getAIRecommended = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const userId = req.user.userId;

    // Get AI recommendations
    const recommendations = await communityRecommendationAIService.recommend(userId);

    res.json(successResponse(recommendations, 'AI recommendations retrieved'));
  } catch (error) {
    next(error);
  }
};

// ─── POST /communities ────────────────────────────────────────────────────────

export const createCommunity = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const { name, description, species, isPrivate, tags, rules, accentColor, avatar, coverImage } =
      req.body;

    if (!name || !description) {
      throw new AppError('Name and description are required', 400, true, 'VALIDATION_ERROR');
    }

    // Generate slug
    let slug = generateSlug(name);
    
    // Check if slug exists, append number if needed
    let slugExists = await Community.exists({ slug });
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(name)}-${counter}`;
      slugExists = await Community.exists({ slug });
      counter++;
    }

    // Create community
    const community = await Community.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      species: species || [],
      isPrivate: isPrivate === true,
      tags: tags || [],
      rules: rules || null,
      accentColor: accentColor || null,
      avatar: avatar || null,
      coverImage: coverImage || null,
      creator: req.user.userId,
      memberCount: 1,
      lastActivityAt: new Date(),
    });

    // Create admin membership
    await CommunityMembership.create({
      community: community._id,
      user: req.user.userId,
      role: 'admin',
      joinedAt: new Date(),
      lastReadAt: new Date(),
      unreadCount: 0,
    });

    res.status(201).json(successResponse(community, 'Community created'));
  } catch (error) {
    next(error);
  }
};

// ─── POST /communities/:id/join ───────────────────────────────────────────────

export const joinCommunity = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const communityId = req.params.id;
    const userId = req.user.userId;

    // Check if community exists
    const community = await Community.findById(communityId);
    if (!community) {
      throw new AppError('Community not found', 404, true, 'NOT_FOUND');
    }

    // Check if already member
    const existingMembership = await CommunityMembership.findOne({
      community: communityId,
      user: userId,
    });

    if (existingMembership) {
      return void res.json(
        successResponse(
          { isMember: true, memberCount: community.memberCount },
          'Already a member',
        ),
      );
    }

    // Create membership
    await CommunityMembership.create({
      community: communityId,
      user: userId,
      role: 'member',
      joinedAt: new Date(),
      lastReadAt: new Date(),
      unreadCount: 0,
    });

    // Increment member count
    community.memberCount += 1;
    await community.save();

    // Invalidate cache
    await redis.del(`communities:recommended:${userId}`);

    res.json(
      successResponse(
        { isMember: true, memberCount: community.memberCount },
        'Joined community',
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /communities/:id/leave ────────────────────────────────────────────

export const leaveCommunity = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const communityId = req.params.id;
    const userId = req.user.userId;

    // Find membership
    const membership = await CommunityMembership.findOne({
      community: communityId,
      user: userId,
    });

    if (!membership) {
      throw new AppError('Not a member of this community', 400, true, 'NOT_MEMBER');
    }

    // Check if admin trying to leave
    if (membership.role === 'admin') {
      const checkCommunity = await Community.findById(communityId);
      if (checkCommunity && checkCommunity.memberCount > 1) {
        throw new AppError(
          'Admins cannot leave. Transfer ownership first.',
          400,
          true,
          'ADMIN_CANNOT_LEAVE',
        );
      }
    }

    // Delete membership
    await CommunityMembership.deleteOne({ _id: membership._id });

    // Decrement member count
    const community = await Community.findById(communityId);
    if (community) {
      community.memberCount = Math.max(0, community.memberCount - 1);
      await community.save();

      res.json(
        successResponse(
          { isMember: false, memberCount: community.memberCount },
          'Left community',
        ),
      );
    } else {
      res.json(successResponse({ isMember: false }, 'Left community'));
    }
  } catch (error) {
    next(error);
  }
};

// ─── GET /communities/:id ─────────────────────────────────────────────────────

export const getCommunityById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const communityId = req.params.id;
    const userId = req.user?.userId;

    // Fetch community
    const community = await Community.findById(communityId)
      .populate('creator', 'username name avatar')
      .lean();

    if (!community) {
      throw new AppError('Community not found', 404, true, 'NOT_FOUND');
    }

    // Check if user is member
    let isMember = false;
    let isAdmin = false;
    let membership = null;

    if (userId) {
      membership = await CommunityMembership.findOne({
        community: communityId,
        user: userId,
      }).lean();

      if (membership) {
        isMember = true;
        isAdmin = membership.role === 'admin' || membership.role === 'moderator';
      }
    }

    // If private and not member, return limited info
    if (community.isPrivate && !isMember) {
      return void res.json(
        successResponse(
          {
            community: {
              _id: community._id,
              name: community.name,
              avatar: community.avatar,
              isPrivate: true,
              memberCount: community.memberCount,
            },
            isMember: false,
            isAdmin: false,
          },
          'Community is private',
        ),
      );
    }

    // Fetch pinned post if exists
    let pinnedPost = null;
    if (community.pinnedPostId) {
      pinnedPost = await CommunityPost.findById(community.pinnedPostId)
        .populate('author', 'username name avatar isVerified')
        .lean();
    }

    res.json(
      successResponse(
        {
          community,
          isMember,
          isAdmin,
          pinnedPost,
          memberCount: community.memberCount,
        },
        'Community retrieved',
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET /communities/:id/members ─────────────────────────────────────────────

export const getMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const communityId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;

    const query: any = { community: communityId };

    if (cursor) {
      query.joinedAt = { $lt: new Date(cursor) };
    }

    const memberships = await CommunityMembership.find(query)
      .populate('user', '_id username name avatar bio followerCount')
      .sort({ joinedAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = memberships.length > limit;
    const members = memberships.slice(0, limit);

    const nextCursor = hasMore ? members[members.length - 1].joinedAt.toISOString() : null;

    // Get total count
    const total = await CommunityMembership.countDocuments({ community: communityId });

    res.json(
      successResponse(
        {
          members: members.map((m: any) => ({
            user: m.user,
            role: m.role,
            joinedAt: m.joinedAt,
          })),
          total,
          nextCursor,
          hasMore,
        },
        'Members retrieved',
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ─── POST /communities/:id/read ───────────────────────────────────────────────

export const markRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const communityId = req.params.id;
    const userId = req.user.userId;

    await CommunityMembership.updateOne(
      { community: communityId, user: userId },
      {
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    );

    res.json(successResponse({}, 'Marked as read'));
  } catch (error) {
    next(error);
  }
};

// ─── GET /communities/search ──────────────────────────────────────────────────

export const searchCommunities = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = (req.query.q as string)?.trim();

    if (!query) {
      return void res.json(successResponse([], 'No search query provided'));
    }

    // Text search
    const communities = await Community.find(
      { $text: { $search: query }, isPrivate: false },
      { score: { $meta: 'textScore' } },
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .select('_id name slug description avatar coverImage species tags memberCount')
      .lean();

    res.json(successResponse(communities, 'Search results'));
  } catch (error) {
    next(error);
  }
};
