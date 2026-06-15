import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'follow_request'
  | 'follow_accept'
  | 'pet_follow'
  | 'event_invite'
  | 'event_rsvp'
  | 'chat'
  | 'rsvp'
  | 'ai_suggestion'
  | 'community_post';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: NotificationType;
  entityId?: mongoose.Types.ObjectId; // post, event, chat, etc.
  entityType?: string;                // 'Post' | 'Event' | 'Chat' | ...
  entityImage?: string;               // thumbnail URL for the entity
  entityName?: string;                // e.g. post caption snippet, event title
  groupKey?: string;                  // for grouping similar notifications
  message: string;
  isRead: boolean;
  tab: 'all' | 'activity';           // notification category
  expiresAt: Date;                    // TTL for auto-expiry
  createdAt: Date;
}

export interface INotificationModel extends Model<INotification> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const notificationSchema = new Schema<INotification, INotificationModel>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: ['like', 'comment', 'follow', 'follow_request', 'follow_accept', 'pet_follow', 'event_invite', 'event_rsvp', 'chat', 'rsvp', 'ai_suggestion', 'community_post'],
      required: [true, 'Notification type is required'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    entityType: {
      type: String,
      default: null,
    },
    entityImage: {
      type: String,
      default: null,
    },
    entityName: {
      type: String,
      default: null,
    },
    groupKey: {
      type: String,
      default: null,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [500, 'Message too long'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    tab: {
      type: String,
      enum: ['all', 'activity'],
      default: 'all',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Inbox: unread first, then by newest
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
// Tab filtering: recipient + tab + createdAt
notificationSchema.index({ recipient: 1, tab: 1, createdAt: -1 });
// TTL index: auto-expire notifications after expiresAt
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Deduplication: prevent duplicate notifications (compound unique index)
// This helps prevent race conditions when creating notifications
notificationSchema.index(
  { recipient: 1, sender: 1, type: 1, entityId: 1, createdAt: 1 },
  { 
    partialFilterExpression: { 
      sender: { $exists: true, $ne: null },
      entityId: { $exists: true, $ne: null }
    }
  }
);

// ─── Export ───────────────────────────────────────────────────────────────────

export const Notification = mongoose.model<INotification, INotificationModel>(
  'Notification',
  notificationSchema,
);
