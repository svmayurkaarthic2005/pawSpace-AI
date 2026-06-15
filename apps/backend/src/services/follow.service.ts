import { followRepository } from '../repositories/follow.repository';
import { cacheService } from './cache.service';
import { fcmService } from './fcm.service';
import { notificationService } from './notification.service';
import { AppError } from '../middleware/error';
import { User } from '../models/user.model';
import { Pet } from '../models/pet.model';
import { Follow, FollowableEntityType } from '../models/follow.model';
import { Notification } from '../models/notification.model';
import mongoose from 'mongoose';

/**
 * Structured error logging context
 */
interface ErrorContext {
  operation: string;
  userId: string;
  entityId?: string;
  entityType?: FollowableEntityType;
  error?: any;
}

/**
 * Log error with structured context
 */
function logError(context: ErrorContext): void {
  console.error('[FollowService] Operation failed:', {
    timestamp: new Date().toISOString(),
    ...context,
    stack: context.error?.stack,
  });
}

/**
 * Validate ObjectId format
 */
function validateObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400, true, 'INVALID_ID');
  }
}

export class FollowService {
  /**
   * Follow or unfollow an entity (User or Pet). Toggle behavior.
   * Atomically increments/decrements follower/following counts.
   * Returns { following: true } if followed, { following: false } if unfollowed.
   */
  async follow(
    followerId: string,
    entityId: string,
    entityType: FollowableEntityType,
  ): Promise<{ following: boolean; followerCount: number; requested?: boolean }> {
    const context: ErrorContext = {
      operation: 'follow',
      userId: followerId,
      entityId,
      entityType,
    };

    try {
      // Validate ObjectId formats
      validateObjectId(followerId, 'follower ID');
      validateObjectId(entityId, 'entity ID');

      // Validate self-follow (only applies to User entityType)
      if (entityType === 'User' && followerId === entityId) {
        logError({ ...context, error: { message: 'Self-follow attempt' } });
        throw new AppError('You cannot follow yourself', 400, true, 'SELF_FOLLOW');
      }

      // Validate entity exists
      let entity;
      try {
        entity = await this.validateEntity(entityId, entityType);
      } catch (err) {
        logError({ ...context, error: err });
        throw new AppError(
          'Database error while validating entity',
          500,
          false,
          'DATABASE_ERROR',
        );
      }

      if (!entity) {
        logError({ ...context, error: { message: `${entityType} not found` } });
        throw new AppError(
          `${entityType} not found`,
          404,
          true,
          'ENTITY_NOT_FOUND',
        );
      }

      // Check if already following or requested
      let followRecord;
      try {
        followRecord = await followRepository.getFollowRecord(
          followerId,
          entityId,
          entityType,
        );
      } catch (err) {
        logError({ ...context, error: err });
        throw new AppError(
          'Database error while checking follow status',
          500,
          false,
          'DATABASE_ERROR',
        );
      }

      if (followRecord) {
        // UNFOLLOW PATH or CANCEL REQUEST PATH
        try {
          await followRepository.unfollow(followerId, entityId, entityType);
          if (followRecord.status === 'accepted') {
            await this.decrementCounts(followerId, entityId, entityType);
          }
        } catch (err) {
          logError({ ...context, operation: 'unfollow', error: err });
          throw new AppError(
            'Database error while unfollowing',
            500,
            false,
            'DATABASE_ERROR',
          );
        }
        
        // Update Redis follower set (non-critical)
        if (followRecord.status === 'accepted') {
          try {
            await cacheService.removeFollowerFromSet(entityId, entityType, followerId);
          } catch (err) {
            logError({ ...context, operation: 'cache_removal', error: err });
            // Continue - cache can be rebuilt
          }
        }

        const updatedEntity = await this.getEntity(entityId, entityType);
        return { following: false, followerCount: updatedEntity?.followerCount ?? 0, requested: false };
      } else {
        // FOLLOW PATH or REQUEST PATH
        const isPrivate = entityType === 'User' ? (entity as any).isPrivate : false;
        const initialStatus = isPrivate ? 'pending' : 'accepted';

        try {
          await followRepository.follow(followerId, entityId, entityType, initialStatus);
          if (initialStatus === 'accepted') {
            await this.incrementCounts(followerId, entityId, entityType);
          }
        } catch (err) {
          logError({ ...context, error: err });
          throw new AppError(
            'Database error while creating follow',
            500,
            false,
            'DATABASE_ERROR',
          );
        }

        // Update Redis follower set (non-critical)
        if (initialStatus === 'accepted') {
          try {
            await cacheService.addFollowerToSet(entityId, entityType, followerId);
          } catch (err) {
            logError({ ...context, operation: 'cache_addition', error: err });
            // Continue - cache can be rebuilt
          }
        }

        // Create notification (non-critical)
        try {
          await this.sendNotification(followerId, entityId, entityType, initialStatus);
        } catch (err) {
          logError({ ...context, operation: 'notification', error: err });
          // Continue - notification failure shouldn't block follow
        }

        const updatedEntity = await this.getEntity(entityId, entityType);
        return { following: initialStatus === 'accepted', followerCount: updatedEntity?.followerCount ?? 0, requested: initialStatus === 'pending' };
      }
    } catch (err) {
      // Re-throw AppError instances
      if (err instanceof AppError) {
        throw err;
      }
      // Catch-all for unexpected errors
      logError({ ...context, error: err });
      throw new AppError(
        'Unexpected error during follow operation',
        500,
        false,
        'DATABASE_ERROR',
      );
    }
  }

  /**
   * Atomically increment counts for follow operation
   */
  private async incrementCounts(
    followerId: string,
    entityId: string,
    entityType: FollowableEntityType,
  ): Promise<void> {
    try {
      if (entityType === 'User') {
        await Promise.all([
          User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }).exec(),
          User.findByIdAndUpdate(entityId, { $inc: { followerCount: 1 } }).exec(),
        ]);
      } else {
        await Promise.all([
          User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }).exec(),
          Pet.findByIdAndUpdate(entityId, { $inc: { followerCount: 1 } }).exec(),
        ]);
      }
    } catch (err) {
      logError({
        operation: 'incrementCounts',
        userId: followerId,
        entityId,
        entityType,
        error: err,
      });
      throw err;
    }
  }

  /**
   * Atomically decrement counts for unfollow operation
   */
  private async decrementCounts(
    followerId: string,
    entityId: string,
    entityType: FollowableEntityType,
  ): Promise<void> {
    try {
      if (entityType === 'User') {
        await Promise.all([
          User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }).exec(),
          User.findByIdAndUpdate(entityId, { $inc: { followerCount: -1 } }).exec(),
        ]);
      } else {
        await Promise.all([
          User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }).exec(),
          Pet.findByIdAndUpdate(entityId, { $inc: { followerCount: -1 } }).exec(),
        ]);
      }
    } catch (err) {
      logError({
        operation: 'decrementCounts',
        userId: followerId,
        entityId,
        entityType,
        error: err,
      });
      throw err;
    }
  }

  /**
   * Validate that an entity exists
   */
  private async validateEntity(
    entityId: string,
    entityType: FollowableEntityType,
  ): Promise<any> {
    const context: ErrorContext = {
      operation: 'validateEntity',
      userId: '',
      entityId,
      entityType,
    };

    try {
      if (entityType === 'User') {
        return await User.findById(entityId).lean().exec();
      } else {
        return await Pet.findById(entityId).lean().exec();
      }
    } catch (err) {
      logError({ ...context, error: err });
      throw err;
    }
  }

  /**
   * Get entity for follower count retrieval
   */
  private async getEntity(
    entityId: string,
    entityType: FollowableEntityType,
  ): Promise<any> {
    const context: ErrorContext = {
      operation: 'getEntity',
      userId: '',
      entityId,
      entityType,
    };

    try {
      if (entityType === 'User') {
        return await User.findById(entityId).select('followerCount').lean().exec();
      } else {
        return await Pet.findById(entityId).select('followerCount').lean().exec();
      }
    } catch (err) {
      logError({ ...context, error: err });
      // Return null rather than throwing - allows operation to complete
      return null;
    }
  }

  /**
   * Send follow notification based on entity type
   */
  private async sendNotification(
    followerId: string,
    entityId: string,
    entityType: FollowableEntityType,
    status: 'pending' | 'accepted' = 'accepted'
  ): Promise<void> {
    const context: ErrorContext = {
      operation: 'sendNotification',
      userId: followerId,
      entityId,
      entityType,
    };

    try {
      if (entityType === 'User') {
        // User follow notification
        await notificationService.createNotification({
          recipient: entityId,
          sender: followerId,
          type: status === 'pending' ? 'follow_request' : 'follow',
        });

        // Fire-and-forget FCM
        fcmService.sendToUser(entityId, {
          type: status === 'pending' ? 'follow_request' : 'new_follower',
          followerId,
        });
      } else {
        // Pet follow notification - send to pet owner
        const pet = await Pet.findById(entityId).select('owner name').lean().exec();
        if (pet) {
          await notificationService.createNotification({
            recipient: pet.owner.toString(),
            sender: followerId,
            type: 'pet_follow',
            entityId: pet._id.toString(),
            entityName: pet.name,
          });

          // Fire-and-forget FCM - use new_follower type with pet context
          fcmService.sendToUser(pet.owner.toString(), {
            type: 'new_follower',
            followerId,
          });
        }
      }
    } catch (err) {
      // Log but don't throw - notification failure shouldn't block follow
      logError({ ...context, error: err });
    }
  }

  async getFollowers(
    entityId: string,
    entityType: FollowableEntityType,
    page: number,
    limit: number,
  ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const context: ErrorContext = {
      operation: 'getFollowers',
      userId: '', // No specific user for this operation
      entityId,
      entityType,
    };

    try {
      // Validate ObjectId format
      validateObjectId(entityId, 'entity ID');

      return await followRepository.getFollowers(entityId, entityType, page, limit);
    } catch (err) {
      // Re-throw AppError instances
      if (err instanceof AppError) {
        throw err;
      }
      // Log and wrap unexpected errors
      logError({ ...context, error: err });
      throw new AppError(
        'Database error while fetching followers',
        500,
        false,
        'DATABASE_ERROR',
      );
    }
  }

  /**
   * Get entities a user follows, separated by type
   */
  async getFollowing(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ users: any[]; pets: any[]; total: number; page: number; limit: number }> {
    const context: ErrorContext = {
      operation: 'getFollowing',
      userId,
    };

    try {
      // Validate ObjectId format
      validateObjectId(userId, 'user ID');

      // Get total count of all follows for this user
      const totalCount = await Follow.countDocuments({ follower: userId });

      // Get follow records with entityType for current page
      const follows = await followRepository.getFollowingWithType(userId, page, limit);

      // Separate by entityType
      const userFollows = follows.filter((f) => f.entityType === 'User');
      const petFollows = follows.filter((f) => f.entityType === 'Pet');

      // Populate details
      const [users, pets] = await Promise.all([
        User.find({
          _id: { $in: userFollows.map((f) => f.following) },
        })
          .select('name username avatar followerCount isVerified')
          .lean()
          .exec(),
        Pet.find({
          _id: { $in: petFollows.map((f) => f.following) },
        })
          .select('name species images followerCount owner')
          .populate('owner', 'username')
          .lean()
          .exec(),
      ]);

      return { users, pets, total: totalCount, page, limit };
    } catch (err) {
      // Re-throw AppError instances
      if (err instanceof AppError) {
        throw err;
      }
      // Log and wrap unexpected errors
      logError({ ...context, error: err });
      throw new AppError(
        'Database error while fetching following list',
        500,
        false,
        'DATABASE_ERROR',
      );
    }
  }

  async isFollowing(
    followerId: string,
    followingId: string,
    entityType: FollowableEntityType,
  ): Promise<boolean> {
    const context: ErrorContext = {
      operation: 'isFollowing',
      userId: followerId,
      entityId: followingId,
      entityType,
    };

    try {
      // Validate ObjectId formats
      validateObjectId(followerId, 'follower ID');
      validateObjectId(followingId, 'following ID');

      return await followRepository.isFollowing(followerId, followingId, entityType);
    } catch (err) {
      // Re-throw AppError instances
      if (err instanceof AppError) {
        throw err;
      }
      // Log and wrap unexpected errors
      logError({ ...context, error: err });
      throw new AppError(
        'Database error while checking follow status',
        500,
        false,
        'DATABASE_ERROR',
      );
    }
  }

  async acceptFollowRequest(userId: string, requesterId: string): Promise<void> {
    const context: ErrorContext = { operation: 'acceptFollowRequest', userId };
    
    try {
      validateObjectId(userId, 'user ID');
      validateObjectId(requesterId, 'requester ID');

      const followRecord = await followRepository.getFollowRecord(requesterId, userId, 'User');
      if (!followRecord || followRecord.status !== 'pending') {
        throw new AppError('Follow request not found', 404, true);
      }

      followRecord.status = 'accepted';
      await followRecord.save();

      await this.incrementCounts(requesterId, userId, 'User');

      // Update Redis follower set (non-critical)
      try {
        await cacheService.addFollowerToSet(userId, 'User', requesterId);
      } catch (err) {
        logError({ ...context, operation: 'cache_addition', error: err });
      }

      // Notify requester
      await notificationService.createNotification({
        recipient: requesterId,
        sender: userId,
        type: 'follow_accept'
      });
      
      // Clear the follow_request notification for the user
      await Notification.deleteOne({ recipient: userId, sender: requesterId, type: 'follow_request' }).exec();
      
      // Attempt to sync unread count (non-critical)
      notificationService.syncUnreadCount(userId).catch(() => {});
    } catch (err) {
      if (err instanceof AppError) throw err;
      logError({ ...context, error: err });
      throw new AppError('Database error while accepting request', 500, false);
    }
  }

  async rejectFollowRequest(userId: string, requesterId: string): Promise<void> {
    const context: ErrorContext = { operation: 'rejectFollowRequest', userId };
    
    try {
      validateObjectId(userId, 'user ID');
      validateObjectId(requesterId, 'requester ID');

      const result = await Follow.findOneAndDelete({
        follower: requesterId,
        following: userId,
        entityType: 'User',
        status: 'pending'
      }).exec();

      if (!result) {
        throw new AppError('Follow request not found', 404, true);
      }
      
      // Clear the follow_request notification
      await Notification.deleteOne({ recipient: userId, sender: requesterId, type: 'follow_request' }).exec();
      
      // Attempt to sync unread count (non-critical)
      notificationService.syncUnreadCount(userId).catch(() => {});

      // Invalidate the requester's explore nearby cache
      try {
        const { redis } = await import('../config/redis');
        await redis.del(`explore:nearby:${requesterId}`);
      } catch (redisErr) {}
    } catch (err) {
      if (err instanceof AppError) throw err;
      logError({ ...context, error: err });
      throw new AppError('Database error while rejecting request', 500, false);
    }
  }

  async getFollowRequests(userId: string, page: number, limit: number): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const context: ErrorContext = { operation: 'getFollowRequests', userId };
    
    try {
      validateObjectId(userId, 'user ID');
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        Follow.find({ following: userId, entityType: 'User', status: 'pending' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('follower', 'username name avatar isVerified')
          .lean()
          .exec(),
        Follow.countDocuments({ following: userId, entityType: 'User', status: 'pending' })
      ]);

      return { items, total, page, limit };
    } catch (err) {
      logError({ ...context, error: err });
      throw new AppError('Database error while fetching requests', 500, false);
    }
  }

  async removeFollower(userId: string, followerId: string): Promise<void> {
    const context: ErrorContext = { operation: 'removeFollower', userId };
    
    try {
      validateObjectId(userId, 'user ID');
      validateObjectId(followerId, 'follower ID');

      const followRecord = await followRepository.getFollowRecord(followerId, userId, 'User');
      if (!followRecord || followRecord.status !== 'accepted') {
        throw new AppError('Follower not found', 404, true);
      }

      await followRepository.unfollow(followerId, userId, 'User');
      await this.decrementCounts(followerId, userId, 'User');

      // Update Redis follower set (non-critical)
      try {
        await cacheService.removeFollowerFromSet(userId, 'User', followerId);
      } catch (err) {
        logError({ ...context, operation: 'cache_removal', error: err });
      }

      // Invalidate the follower's explore nearby cache
      try {
        const { redis } = await import('../config/redis');
        await redis.del(`explore:nearby:${followerId}`);
      } catch (redisErr) {}
    } catch (err) {
      if (err instanceof AppError) throw err;
      logError({ ...context, error: err });
      throw new AppError('Database error while removing follower', 500, false);
    }
  }
}

export const followService = new FollowService();
