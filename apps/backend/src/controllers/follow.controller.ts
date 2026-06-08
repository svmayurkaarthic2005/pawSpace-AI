import { Request, Response, NextFunction } from 'express';
import { followService } from '../services/follow.service';
import { AppError } from '../middleware/error';
import { successResponse } from '../utils';

export const toggleFollow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const result = await followService.follow(req.user.userId, req.params.userId);
    res.status(200).json(successResponse(result, result.following ? 'Followed' : 'Unfollowed'));
  } catch (err) { next(err); }
};

export const getFollowers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string };
    const result = await followService.getFollowers(req.params.userId, parseInt(page), parseInt(limit));
    res.status(200).json(successResponse(result, 'Followers retrieved'));
  } catch (err) { next(err); }
};

export const getFollowing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string };
    const result = await followService.getFollowing(req.params.userId, parseInt(page), parseInt(limit));
    res.status(200).json(successResponse(result, 'Following retrieved'));
  } catch (err) { next(err); }
};
