import mongoose from 'mongoose';
import { Notification, NotificationType, INotification } from '../models/notification.model';
import { User } from '../models/user.model';
import { cacheService } from './cache.service';
import { fcmService, FCMNotificationType } from './fcm.service';
import { getIO } from '../socket/socket';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateNotificationInput {
  recipient: string;
  sender?: string;
  type: NotificationType;
  entityId?: string;
  entityType?: string;
  entityImage?: string;
  entityName?: string;
  message?: string;
}

// ─── Notification Message Templates ──────────────────────────────────────────

const getNotificationMessage = async (
  type: NotificationType,
  senderId?: string,
  entityName?: string,
): Promise<string> => {
  let senderUsername = 'Someone';
  if (senderId) {
    const sender = await User.findById(senderId).select('username').lean().exec();
    if (sender && 'username' in sender) {
      senderUsername = sender.username as string;
    }
  }

  const templates: Record<NotificationType, string> = {
    like: `${senderUsername} liked your post${entityName ? ' about ' + entityName : ''}`,
    comment: `${senderUsername} commented on your post${entityName ? ': "' + entityName + '"' : ''}`,
    follow: `${senderUsername} started following you`,
    follow_request: `${senderUsername} requested to follow you`,
    follow_accept: `${senderUsername} accepted your follow request`,
    pet_follow: `${senderUsername} started following ${entityName ?? 'your pet'}`,
    event_rsvp: `${senderUsername} is going to ${entityName ?? 'your event'}`,
    chat: `${senderUsername} sent you a message`,
    ai_suggestion: `✦ AI found ${entityName ?? 'new'} events for you`,
    community_post: `${senderUsername} posted in ${entityName ?? 'a community'}`,
    event_invite: `${senderUsername} invited you to ${entityName ?? 'an event'}`,
    rsvp: `${senderUsername} RSVP'd to ${entityName ?? 'your event'}`,
    new_post: `${senderUsername} published a new post`,
  };

  return templates[type] ?? 'New notification';
};

// ─── Service ──────────────────────────────────────────────────────────────────

export class NotificationService {
  /**
   * Create a notification with deduplication, Redis counter update,
   * Socket.IO emission, and FCM push if offline.
   */
  async createNotification(input: CreateNotificationInput): Promise<INotification | null> {
    const { recipient, sender, type, entityId, entityType, entityImage, entityName } = input;

    // Skip self-notifications
    if (sender && sender === recipient) {
      return null;
    }

    // Deduplication: check for same sender+type+entityId within 1 hour
    if (sender && entityId) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const existing = await Notification.findOne({
        recipient: new mongoose.Types.ObjectId(recipient),
        sender: new mongoose.Types.ObjectId(sender),
        type,
        entityId: new mongoose.Types.ObjectId(entityId),
        createdAt: { $gte: oneHourAgo },
      }).exec();

      if (existing) {
        return null; // Already notified recently
      }
    }

    // Generate message
    const message = input.message ?? await getNotificationMessage(type, sender, entityName);

    // Determine tab: 'activity' for likes, comments, follows; 'all' for everything
    const activityTypes: NotificationType[] = ['like', 'comment', 'follow'];
    const tab = activityTypes.includes(type) ? 'activity' : 'all';

    // Generate groupKey for similar notifications
    let groupKey: string | undefined;
    if (type === 'like' && entityId) {
      groupKey = `post_likes_${entityId}`;
    } else if (type === 'comment' && entityId) {
      groupKey = `post_comments_${entityId}`;
    }

    // Create notification
    const notification = await Notification.create({
      recipient: new mongoose.Types.ObjectId(recipient),
      sender: sender ? new mongoose.Types.ObjectId(sender) : undefined,
      type,
      entityId: entityId ? new mongoose.Types.ObjectId(entityId) : undefined,
      entityType,
      entityImage,
      entityName,
      groupKey,
      message,
      tab,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }).catch((err) => {
      // If duplicate key error (race condition), log and return null
      if (err.code === 11000) {
        console.log(`[createNotification] Duplicate notification prevented for user ${recipient}`);
        return null;
      }
      throw err;
    });

    if (!notification) {
      return null; // Duplicate was caught
    }

    // Populate sender for socket emission
    await notification.populate('sender', 'username name avatar');

    // Atomically increment unread counter in Redis
    // This prevents race conditions when multiple notifications are created simultaneously
    const newCount = await cacheService.incrementUnreadCount(recipient);

    // Emit Socket.IO events with the new count
    try {
      const io = getIO();
      io.to(`user:${recipient}`).emit('notification:new', this.serializeNotification(notification));
      io.to(`user:${recipient}`).emit('notification:count_update', { count: newCount });
    } catch (err) {
      console.error('[createNotification] Socket.IO emit error:', err);
    }

    // Send FCM push if user is offline
    const isOnline = await cacheService.isUserOnline(recipient);
    if (!isOnline) {
      // Map notification types to FCM types
      const fcmTypeMap: Record<string, FCMNotificationType> = {
        like: 'new_like',
        comment: 'new_comment',
        follow: 'new_follower',
        follow_request: 'follow_request',
        follow_accept: 'follow_accept',
        chat: 'new_message',
        ai_suggestion: 'ai_suggestion',
        event_rsvp: 'event_reminder',
        new_post: 'new_post',
      };
      
      const fcmType = fcmTypeMap[type] || 'ai_suggestion';
      
      fcmService.sendToUser(recipient, {
        type: fcmType,
        postId: entityType === 'post' ? entityId : undefined,
        eventId: entityType === 'event' ? entityId : undefined,
        chatId: type === 'chat' ? entityId : undefined,
        userId: sender?.toString(),
        senderName: sender ? 'Someone' : undefined,
      });
    }

    return notification;
  }

  /**
   * Get paginated notifications for a user, filtered by tab.
   * Includes automatic count synchronization to recover from race conditions.
   */
  async getNotifications(
    userId: string,
    tab: 'all' | 'activity' = 'all',
    cursor?: string,
    limit: number = 30,
  ): Promise<{
    notifications: INotification[];
    nextCursor: string | null;
    hasMore: boolean;
    unreadCount: number;
  }> {
    const query: any = { recipient: new mongoose.Types.ObjectId(userId) };

    // Filter by tab
    if (tab === 'activity') {
      query.type = { $in: ['like', 'comment', 'follow'] };
    }

    // Cursor pagination
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('sender', 'username name avatar')
      .lean()
      .exec();

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore && items.length > 0 
      ? items[items.length - 1].createdAt.toISOString() 
      : null;

    // Get unread count from Redis
    let unreadCount = await cacheService.getUnreadCount(userId);

    // On first page load (no cursor), verify Redis count against MongoDB
    // This auto-recovers from race conditions
    if (!cursor) {
      const actualCount = await Notification.countDocuments({
        recipient: new mongoose.Types.ObjectId(userId),
        isRead: false,
      }).exec();

      // If there's a discrepancy, sync the count
      if (Math.abs(actualCount - unreadCount) > 0) {
        console.log(
          `[getNotifications] Count mismatch for user ${userId}: Redis=${unreadCount}, MongoDB=${actualCount}. Syncing...`
        );
        unreadCount = actualCount;
        await cacheService.setUnreadCount(userId, actualCount);

        // Emit corrected count via Socket.IO
        try {
          const io = getIO();
          io.to(`user:${userId}`).emit('notification:count_update', { count: actualCount });
        } catch (err) {
          console.error('[getNotifications] Socket.IO emit error:', err);
        }
      }
    }

    return {
      notifications: items as unknown as INotification[],
      nextCursor,
      hasMore,
      unreadCount,
    };
  }

  /**
   * Get unread notification count (from Redis cache).
   */
  async getUnreadCount(userId: string): Promise<number> {
    return cacheService.getUnreadCount(userId);
  }

  /**
   * Mark all notifications as read for a user.
   * Uses atomic operations to prevent race conditions.
   */
  async markAllRead(userId: string): Promise<number> {
    // Use atomic updateMany with isRead:false filter to prevent double-processing
    const result = await Notification.updateMany(
      { recipient: new mongoose.Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } },
    ).exec();

    // Only reset counter if we actually modified documents
    // This prevents race conditions where markAllRead is called multiple times
    if (result.modifiedCount > 0) {
      // Reset Redis counter to 0
      await cacheService.set(`notif:unread:${userId}`, '0', 7 * 24 * 60 * 60);

      // Emit Socket.IO update
      try {
        const io = getIO();
        io.to(`user:${userId}`).emit('notification:count_update', { count: 0 });
      } catch (err) {
        console.error('[markAllRead] Socket.IO emit error:', err);
      }
    }

    return result.modifiedCount;
  }

  /**
   * Mark a single notification as read.
   * Returns the new unread count after the operation.
   */
  async markOneRead(userId: string, notificationId: string): Promise<boolean> {
    // Use findOneAndUpdate with atomic operation to prevent race conditions
    // The filter includes isRead:false to ensure we only process unread notifications once
    const notification = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        recipient: new mongoose.Types.ObjectId(userId),
        isRead: false, // Critical: only match if currently unread
      },
      { $set: { isRead: true } },
      { new: false } // Return the OLD document to verify it was actually unread
    ).exec();

    if (!notification) {
      // Notification was already read, not found, or not owned by user
      // Don't decrement counter - just return false
      return false;
    }

    // Only decrement if we actually updated an unread notification
    // This is safe because the query filter ensures we only match unread notifications once
    const newCount = await cacheService.decrementUnreadCount(userId);

    // Emit Socket.IO update with authoritative count
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:count_update', { count: newCount });
    } catch (err) {
      console.error('[markOneRead] Socket.IO emit error:', err);
    }

    return true;
  }

  /**
   * Delete a single notification.
   */
  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const result = await Notification.deleteOne({
      _id: new mongoose.Types.ObjectId(notificationId),
      recipient: new mongoose.Types.ObjectId(userId),
    }).exec();

    return result.deletedCount > 0;
  }

  /**
   * Clear all notifications for a user.
   */
  async clearAll(userId: string): Promise<number> {
    const result = await Notification.deleteMany({
      recipient: new mongoose.Types.ObjectId(userId),
    }).exec();

    // Clear Redis counter
    await cacheService.set(`notif:unread:${userId}`, '0', 7 * 24 * 60 * 60);

    return result.deletedCount;
  }

  /**
   * Synchronize Redis unread count with actual MongoDB count.
   * Call this to recover from race conditions or cache inconsistencies.
   * Returns the synchronized count.
   */
  async syncUnreadCount(userId: string): Promise<number> {
    // Get actual unread count from MongoDB (source of truth)
    const actualCount = await Notification.countDocuments({
      recipient: new mongoose.Types.ObjectId(userId),
      isRead: false,
    }).exec();

    // Update Redis with authoritative count
    await cacheService.setUnreadCount(userId, actualCount);

    // Emit Socket.IO update with corrected count
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:count_update', { count: actualCount });
    } catch (err) {
      console.error('[syncUnreadCount] Socket.IO emit error:', err);
    }

    return actualCount;
  }

  /**
   * Serialize notification for Socket.IO emission.
   */
  private serializeNotification(notification: INotification): any {
    return {
      _id: notification._id.toString(),
      recipient: notification.recipient.toString(),
      sender: notification.sender ? {
        _id: (notification.sender as any)._id?.toString() ?? notification.sender.toString(),
        username: (notification.sender as any).username,
        name: (notification.sender as any).name,
        avatar: (notification.sender as any).avatar,
      } : null,
      type: notification.type,
      entityId: notification.entityId?.toString(),
      entityType: notification.entityType,
      entityImage: notification.entityImage,
      entityName: notification.entityName,
      groupKey: notification.groupKey,
      message: notification.message,
      isRead: notification.isRead,
      tab: notification.tab,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}

export const notificationService = new NotificationService();
