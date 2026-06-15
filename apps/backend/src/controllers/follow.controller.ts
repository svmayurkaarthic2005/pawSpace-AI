import { Request, Response, NextFunction } from 'express';
import { followService } from '../services/follow.service';
import { AppError } from '../middleware/error';
import { successResponse, validatePagination } from '../utils';
import { FollowableEntityType } from '../models/follow.model';
import mongoose from 'mongoose';

/**
 * Normalize entity type from route params ('users' or 'pets') to model type ('User' or 'Pet')
 */
function normalizeEntityType(entityType: string): FollowableEntityType {
  if (entityType === 'users') return 'User';
  if (entityType === 'pets') return 'Pet';
  throw new AppError('Invalid entity type. Must be "users" or "pets"', 400, true, 'INVALID_ENTITY_TYPE');
}

/**
 * Validate ObjectId format
 */
function validateObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400, true, 'INVALID_ID');
  }
}

/**
 * Toggle follow/unfollow for an entity (user or pet)
 * POST /api/follows/:entityType/:entityId
 */
export const toggleFollow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    
    const { entityType: rawEntityType, entityId } = req.params;
    
    // Validate entity type
    const entityType = normalizeEntityType(rawEntityType);
    
    // Validate entity ID format
    validateObjectId(entityId, 'entity ID');
    
    const result = await followService.follow(req.user.userId, entityId, entityType);
    res.status(200).json(successResponse(result, result.following ? 'Followed' : 'Unfollowed'));
  } catch (err) { next(err); }
};

/**
 * Explicit unfollow endpoint
 * DELETE /api/follows/:entityType/:entityId
 */
export const unfollowEntity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    
    const { entityType: rawEntityType, entityId } = req.params;
    
    // Validate entity type
    const entityType = normalizeEntityType(rawEntityType);
    
    // Validate entity ID format
    validateObjectId(entityId, 'entity ID');
    
    // Check if following first
    const isFollowing = await followService.isFollowing(req.user.userId, entityId, entityType);
    
    if (!isFollowing) {
      // Already not following, return success with current state
      const result = { following: false, followerCount: 0 };
      res.status(200).json(successResponse(result, 'Not following'));
      return;
    }
    
    // Perform unfollow
    const result = await followService.follow(req.user.userId, entityId, entityType);
    res.status(200).json(successResponse(result, 'Unfollowed'));
  } catch (err) { next(err); }
};

/**
 * Get followers of an entity (user or pet)
 * GET /api/follows/:entityType/:entityId/followers
 */
export const getFollowers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entityType: rawEntityType, entityId } = req.params;
    const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string };
    
    // Validate entity type
    const entityType = normalizeEntityType(rawEntityType);
    
    // Validate entity ID format
    validateObjectId(entityId, 'entity ID');
    
    // Validate and enforce pagination parameters (max 50 items per page)
    const { page: pageNum, limit: limitNum } = validatePagination(page, limit);
    
    const result = await followService.getFollowers(entityId, entityType, pageNum, limitNum);
    res.status(200).json(successResponse(result, 'Followers retrieved'));
  } catch (err) { next(err); }
};

/**
 * Get entities a user follows (both users and pets)
 * GET /api/users/:userId/following
 */
export const getFollowing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string };
    
    // Validate user ID format
    validateObjectId(userId, 'user ID');
    
    // Validate and enforce pagination parameters (max 50 items per page)
    const { page: pageNum, limit: limitNum } = validatePagination(page, limit);
    
    const result = await followService.getFollowing(userId, pageNum, limitNum);
    res.status(200).json(successResponse(result, 'Following retrieved'));
  } catch (err) { next(err); }
};

/**
 * Check if current user is following an entity
 * GET /api/follows/:entityType/:entityId/status
 */
export const checkFollowStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    
    const { entityType: rawEntityType, entityId } = req.params;
    
    // Validate entity type
    const entityType = normalizeEntityType(rawEntityType);
    
    // Validate entity ID format
    validateObjectId(entityId, 'entity ID');
    
    const isFollowing = await followService.isFollowing(req.user.userId, entityId, entityType);
    res.status(200).json(successResponse({ isFollowing }, 'Follow status retrieved'));
  } catch (err) { next(err); }
};

/**
 * Get pending follow requests for current user
 * GET /api/follows/requests
 */
export const getFollowRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    
    const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string };
    const { page: pageNum, limit: limitNum } = validatePagination(page, limit);
    
    const result = await followService.getFollowRequests(req.user.userId, pageNum, limitNum);
    res.status(200).json(successResponse(result, 'Follow requests retrieved'));
  } catch (err) { next(err); }
};

/**
 * Accept a follow request
 * POST /api/follows/requests/:requesterId/accept
 */
export const acceptFollowRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    
    const { requesterId } = req.params;
    validateObjectId(requesterId, 'requester ID');
    
    await followService.acceptFollowRequest(req.user.userId, requesterId);
    res.status(200).json(successResponse(null, 'Follow request accepted'));
  } catch (err) { next(err); }
};

/**
 * Reject a follow request
 * POST /api/follows/requests/:requesterId/reject
 */
export const rejectFollowRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    
    const { requesterId } = req.params;
    validateObjectId(requesterId, 'requester ID');
    
    await followService.rejectFollowRequest(req.user.userId, requesterId);
    res.status(200).json(successResponse(null, 'Follow request rejected'));
  } catch (err) { next(err); }
};

/**
 * Remove a follower from the current user
 * DELETE /api/follows/followers/:followerId
 */
export const removeFollower = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    
    const { followerId } = req.params;
    validateObjectId(followerId, 'follower ID');
    
    await followService.removeFollower(req.user.userId, followerId);
    res.status(200).json(successResponse(null, 'Follower removed'));
  } catch (err) { next(err); }
};
