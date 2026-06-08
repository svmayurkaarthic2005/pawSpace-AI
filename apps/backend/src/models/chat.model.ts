import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IMutedInfo {
  user: mongoose.Types.ObjectId;
  mutedUntil: Date;
}

export interface IChat extends Document {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[]; // exactly 2
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt: Date;
  unreadCounts: Map<string, number>; // userId → unread count
  isMuted: IMutedInfo[]; // per-user mute settings
  isArchived: mongoose.Types.ObjectId[]; // users who archived this chat
  deletedFor: mongoose.Types.ObjectId[]; // soft delete per user
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatModel extends Model<IChat> {}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const mutedInfoSchema = new Schema<IMutedInfo>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mutedUntil: { type: Date, required: true },
  },
  { _id: false },
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const chatSchema = new Schema<IChat, IChatModel>(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: {
        validator: (v: mongoose.Types.ObjectId[]) => v.length === 2,
        message: 'A chat must have exactly 2 participants',
      },
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    isMuted: {
      type: [mutedInfoSchema],
      default: [],
    },
    isArchived: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    deletedFor: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Find a chat between two specific users (order-independent via sort in query)
chatSchema.index({ participants: 1, lastMessageAt: -1 });
// Inbox: all chats for a user sorted by most recent activity
chatSchema.index({ participants: 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

chatSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'chat',
});

chatSchema.set('toJSON', { virtuals: false }); // don't auto-populate messages
chatSchema.set('toObject', { virtuals: false });

// ─── Export ───────────────────────────────────────────────────────────────────

export const Chat = mongoose.model<IChat, IChatModel>('Chat', chatSchema);
