import * as admin from 'firebase-admin';
import { User } from '../models/user.model';
import { getFirebaseApp } from '../config/firebase';

// ─── Notification Payload Types ───────────────────────────────────────────────

export interface FCMNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export type FCMNotificationType =
  | 'new_message'
  | 'new_like'
  | 'new_comment'
  | 'new_follower'
  | 'event_reminder'
  | 'ai_suggestion';

export interface FCMNotificationData {
  type: FCMNotificationType;
  chatId?: string;
  postId?: string;
  eventId?: string;
  userId?: string;
  senderName?: string;
  messagePreview?: string;
  likerName?: string;
  commenterName?: string;
  commentPreview?: string;
  followerName?: string;
  followerId?: string;
  eventName?: string;
  startsIn?: string;
  feature?: string;
  preview?: string;
}

// ─── Build notification payload by type ──────────────────────────────────────

const buildPayload = (data: FCMNotificationData): FCMNotificationPayload => {
  switch (data.type) {
    case 'new_message':
      return {
        title: data.senderName ?? 'New message',
        body: data.messagePreview ?? 'You have a new message',
        data: { type: 'new_message', chatId: data.chatId ?? '' },
      };
    case 'new_like':
      return {
        title: '❤️ New like',
        body: `${data.likerName ?? 'Someone'} liked your post`,
        data: { type: 'new_like', postId: data.postId ?? '' },
      };
    case 'new_comment':
      return {
        title: '💬 New comment',
        body: `${data.commenterName ?? 'Someone'}: ${data.commentPreview ?? ''}`,
        data: { type: 'new_comment', postId: data.postId ?? '' },
      };
    case 'new_follower':
      return {
        title: '👤 New follower',
        body: `${data.followerName ?? 'Someone'} started following you`,
        data: { type: 'new_follower', userId: data.followerId ?? '' },
      };
    case 'event_reminder':
      return {
        title: '📅 Event reminder',
        body: `${data.eventName ?? 'An event'} starts ${data.startsIn ?? 'soon'}`,
        data: { type: 'event_reminder', eventId: data.eventId ?? '' },
      };
    case 'ai_suggestion':
      return {
        title: '✦ PawSpace AI',
        body: data.preview ?? 'New AI insight for your pet',
        data: { type: 'ai_suggestion', feature: data.feature ?? '' },
      };
    default:
      return { title: 'PawSpace', body: 'You have a new notification' };
  }
};

// ─── FCM Service ──────────────────────────────────────────────────────────────

export class FCMService {
  /**
   * Send a push notification to a single user.
   * Fire-and-forget — never throws, logs errors.
   */
  sendToUser(userId: string, data: FCMNotificationData): void {
    void this._sendToUser(userId, data);
  }

  private async _sendToUser(userId: string, data: FCMNotificationData): Promise<void> {
    try {
      const user = await User.findById(userId).select('fcmToken').lean().exec();
      const token = (user as { fcmToken?: string } | null)?.fcmToken;
      if (!token) return;

      const payload = buildPayload(data);
      const app = getFirebaseApp();

      await admin.messaging(app).send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data ?? {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'pawspace_default',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });
    } catch (err) {
      // Log but never throw — FCM failures must not break the main flow
      console.error(`[FCM] Failed to send to user ${userId}:`, (err as Error).message);
    }
  }

  /**
   * Send to multiple users in parallel batches of 500.
   * Fire-and-forget.
   */
  sendToMultiple(userIds: string[], data: FCMNotificationData): void {
    void this._sendToMultiple(userIds, data);
  }

  private async _sendToMultiple(userIds: string[], data: FCMNotificationData): Promise<void> {
    try {
      const users = await User.find({ _id: { $in: userIds }, fcmToken: { $exists: true, $ne: null } })
        .select('fcmToken')
        .lean()
        .exec();

      const tokens = users
        .map((u) => (u as { fcmToken?: string }).fcmToken)
        .filter((t): t is string => !!t);

      if (tokens.length === 0) return;

      const payload = buildPayload(data);
      const app = getFirebaseApp();

      // Firebase allows max 500 tokens per multicast
      const BATCH_SIZE = 500;
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        await admin.messaging(app).sendEachForMulticast({
          tokens: batch,
          notification: { title: payload.title, body: payload.body },
          data: payload.data ?? {},
          android: { priority: 'high' },
        });
      }
    } catch (err) {
      console.error('[FCM] Multicast failed:', (err as Error).message);
    }
  }

  /**
   * Update a user's FCM token.
   */
  async updateToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $set: { fcmToken: token } }).exec();
  }
}

export const fcmService = new FCMService();
