import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Block } from '../models/block.model';
import { Follow } from '../models/follow.model';
import { User } from '../models/user.model';
import { AppError } from '../middleware/error';
import { successResponse } from '../utils';

function validateObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400, true, 'INVALID_ID');
  }
}

export const blockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    
    const { userId } = req.params;
    const blockerId = req.user.userId;
    
    validateObjectId(userId, 'user ID');
    
    if (blockerId === userId) {
      throw new AppError('You cannot block yourself', 400, true, 'SELF_BLOCK');
    }
    
    // Check if user exists
    const userToBlock = await User.findById(userId).lean().exec();
    if (!userToBlock) {
      throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
    }

    // Upsert block record to avoid errors if already blocked
    await Block.findOneAndUpdate(
      { blocker: blockerId, blocked: userId },
      { blocker: blockerId, blocked: userId },
      { upsert: true, new: true }
    );

    // Unfollow each other
    const unfollowOps = [
      Follow.findOneAndDelete({ follower: blockerId, following: userId, entityType: 'User' }),
      Follow.findOneAndDelete({ follower: userId, following: blockerId, entityType: 'User' })
    ];
    
    const [unfollowed1, unfollowed2] = await Promise.all(unfollowOps);
    
    // Decrement counts if needed
    if (unfollowed1 && unfollowed1.status === 'accepted') {
      await User.findByIdAndUpdate(blockerId, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(userId, { $inc: { followerCount: -1 } });
    }
    if (unfollowed2 && unfollowed2.status === 'accepted') {
      await User.findByIdAndUpdate(userId, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(blockerId, { $inc: { followerCount: -1 } });
    }

    res.status(200).json(successResponse(null, 'User blocked'));
  } catch (err) { next(err); }
};

export const unblockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    
    const { userId } = req.params;
    const blockerId = req.user.userId;
    
    validateObjectId(userId, 'user ID');
    
    await Block.findOneAndDelete({ blocker: blockerId, blocked: userId }).exec();
    
    res.status(200).json(successResponse(null, 'User unblocked'));
  } catch (err) { next(err); }
};

export const getBlockedUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    
    const blockerId = req.user.userId;
    
    const blocks = await Block.find({ blocker: blockerId })
      .populate('blocked', 'username name avatar')
      .lean()
      .exec();
      
    const blockedUsers = blocks.map(b => b.blocked).filter(b => b !== null);
    
    res.status(200).json(successResponse(blockedUsers, 'Blocked users retrieved'));
  } catch (err) { next(err); }
};
