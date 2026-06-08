import { followRepository } from '../repositories/follow.repository';
import { userRepository } from '../repositories/user.repository';
import { cacheService } from './cache.service';
import { fcmService } from './fcm.service';
import { notificationService } from './notification.service';
import { AppError } from '../middleware/error';
import { User } from '../models/user.model';

export class FollowService {
  /**
   * Follow a user. Atomically increments follower/following counts.
   * Returns { following: true } if followed, { following: false } if unfollowed (toggle).
   */
  async follow(
    followerId: string,
    followingId: string,
  ): Promise<{ following: boolean; followerCount: number }> {
    if (followerId === followingId) {
      throw new AppError('You cannot follow yourself', 400, true, 'SELF_FOLLOW');
    }

    const targetUser = await userRepository.findById(followingId);
    if (!targetUser) {
      throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
    }

    const alreadyFollowing = await followRepository.isFollowing(followerId, followingId);

    if (alreadyFollowing) {
      // Unfollow
      await followRepository.unfollow(followerId, followingId);

      // Atomically decrement counts
      await Promise.all([
        User.findByIdAndUpdate(followingId, { $inc: { followerCount: -1 } }).exec(),
        User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }).exec(),
      ]);

      // Update Redis follower set
      await cacheService.removeFollower(followingId, followerId);

      const updated = await userRepository.findById(followingId);
      return { following: false, followerCount: updated?.followerCount ?? 0 };
    } else {
      // Follow
      await followRepository.follow(followerId, followingId);

      // Atomically increment counts
      await Promise.all([
        User.findByIdAndUpdate(followingId, { $inc: { followerCount: 1 } }).exec(),
        User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }).exec(),
      ]);

      // Update Redis follower set
      await cacheService.addFollower(followingId, followerId);

      // Create notification
      notificationService.createNotification({
        recipient: followingId,
        sender: followerId,
        type: 'follow',
      }).catch(err => console.error('[follow] Notification error:', err));

      // Fire-and-forget FCM to followed user
      fcmService.sendToUser(followingId, {
        type: 'new_follower',
        followerId,
        followerName: 'Someone',
      });

      const updated = await userRepository.findById(followingId);
      return { following: true, followerCount: updated?.followerCount ?? 0 };
    }
  }

  async getFollowers(userId: string, page: number, limit: number) {
    return followRepository.getFollowers(userId, page, limit);
  }

  async getFollowing(userId: string, page: number, limit: number) {
    return followRepository.getFollowing(userId, page, limit);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return followRepository.isFollowing(followerId, followingId);
  }
}

export const followService = new FollowService();
