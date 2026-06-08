import { Request, Response, NextFunction } from 'express';
import { CommunityPost } from '../models/communityPost.model';
import { Community } from '../models/community.model';
import { CommunityMembership } from '../models/communityMembership.model';
import { AppError } from '../middleware/error';
import { successResponse } from '../utils';
import { io } from '../server';

// ─── GET /communities/:id/posts ───────────────────────────────────────────────

export const getCommunityPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const communityId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string;
    const userId = req.user?.userId;

    const query: any = { community: communityId };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch posts (pinned first, then newest)
    const posts = await CommunityPost.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit + 1)
      .populate('author', 'username name avatar isVerified')
      .populate('community', 'name slug')
      .lean();

    const hasMore = posts.length > limit;
    const postsToReturn = posts.slice(0, limit);

    const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1].createdAt.toISOString() : null;

    // Add isLiked flag if user is authenticated
    const postsWithLiked = await Promise.all(
      postsToReturn.map(async (post: any) => {
        let isLiked = false;
        if (userId) {
          const postWithLikes = await CommunityPost.findById(post._id).select('likes').lean();
          isLiked = postWithLikes?.likes?.some((id) => id.toString() === userId) ?? false;
        }
        return { ...post, isLiked };
      }),
    );

    res.json(
      successResponse(
        {
          posts: postsWithLiked,
          nextCursor,
          hasMore,
        },
        'Community posts retrieved',
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ─── POST /communities/:id/posts ──────────────────────────────────────────────

export const createCommunityPost = async (
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
    const { content, media } = req.body;

    if (!content?.trim()) {
      throw new AppError('Content is required', 400, true, 'VALIDATION_ERROR');
    }

    // Check if user is member
    const membership = await CommunityMembership.findOne({
      community: communityId,
      user: userId,
    });

    if (!membership) {
      throw new AppError('Must be a member to post', 403, true, 'NOT_MEMBER');
    }

    // Create post
    const post = await CommunityPost.create({
      community: communityId,
      author: userId,
      content: content.trim(),
      media: media || [],
      isPinned: false,
    });

    // Update community lastActivityAt
    await Community.findByIdAndUpdate(communityId, {
      lastActivityAt: new Date(),
      $inc: { postCount: 1 },
    });

    // Increment unread count for all other members
    await CommunityMembership.updateMany(
      { community: communityId, user: { $ne: userId } },
      { $inc: { unreadCount: 1 } },
    );

    // Populate post data
    const populatedPost = await CommunityPost.findById(post._id)
      .populate('author', 'username name avatar isVerified')
      .populate('community', 'name slug')
      .lean();

    // Emit socket event
    io.to(`community:${communityId}`).emit('community:new_post', {
      post: populatedPost,
      communityId,
    });

    res.status(201).json(successResponse(populatedPost, 'Post created'));
  } catch (error) {
    next(error);
  }
};

// ─── POST /communities/:id/posts/:postId/pin ──────────────────────────────────

export const pinPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const { id: communityId, postId } = req.params;
    const userId = req.user.userId;

    // Check if user is admin or moderator
    const membership = await CommunityMembership.findOne({
      community: communityId,
      user: userId,
    });

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
      throw new AppError('Only admins/moderators can pin posts', 403, true, 'FORBIDDEN');
    }

    // Find the post
    const post = await CommunityPost.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404, true, 'NOT_FOUND');
    }

    if (post.community.toString() !== communityId) {
      throw new AppError('Post does not belong to this community', 400, true, 'INVALID_POST');
    }

    // Unpin old pinned post
    await CommunityPost.updateMany({ community: communityId, isPinned: true }, { isPinned: false });

    // Pin this post
    post.isPinned = true;
    await post.save();

    // Update community pinnedPostId
    await Community.findByIdAndUpdate(communityId, { pinnedPostId: post._id });

    res.json(successResponse(post, 'Post pinned'));
  } catch (error) {
    next(error);
  }
};

// ─── POST /communities/:id/posts/:postId/unpin ────────────────────────────────

export const unpinPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const { id: communityId, postId } = req.params;
    const userId = req.user.userId;

    // Check if user is admin or moderator
    const membership = await CommunityMembership.findOne({
      community: communityId,
      user: userId,
    });

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
      throw new AppError('Only admins/moderators can unpin posts', 403, true, 'FORBIDDEN');
    }

    // Find and unpin the post
    const post = await CommunityPost.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404, true, 'NOT_FOUND');
    }

    post.isPinned = false;
    await post.save();

    // Update community pinnedPostId
    await Community.findByIdAndUpdate(communityId, { pinnedPostId: null });

    res.json(successResponse(post, 'Post unpinned'));
  } catch (error) {
    next(error);
  }
};

// ─── POST /communities/:id/posts/:postId/like ─────────────────────────────────

export const toggleLike = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await CommunityPost.findById(postId).select('likes likesCount');
    if (!post) {
      throw new AppError('Post not found', 404, true, 'NOT_FOUND');
    }

    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // Like
      post.likes.push(userId as any);
      post.likesCount += 1;
    }

    await post.save();

    res.json(
      successResponse(
        { isLiked: !alreadyLiked, likesCount: post.likesCount },
        alreadyLiked ? 'Post unliked' : 'Post liked',
      ),
    );
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /communities/:id/posts/:postId ────────────────────────────────────

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const { id: communityId, postId } = req.params;
    const userId = req.user.userId;

    const post = await CommunityPost.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404, true, 'NOT_FOUND');
    }

    // Check if user is author or admin/moderator
    const isAuthor = post.author.toString() === userId;
    const membership = await CommunityMembership.findOne({
      community: communityId,
      user: userId,
    });

    const isAdminOrMod =
      membership && (membership.role === 'admin' || membership.role === 'moderator');

    if (!isAuthor && !isAdminOrMod) {
      throw new AppError('Not authorized to delete this post', 403, true, 'FORBIDDEN');
    }

    await CommunityPost.deleteOne({ _id: postId });

    // Decrement post count
    await Community.findByIdAndUpdate(communityId, { $inc: { postCount: -1 } });

    res.json(successResponse({}, 'Post deleted'));
  } catch (error) {
    next(error);
  }
};
