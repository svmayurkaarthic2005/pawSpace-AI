import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ICommunityMembership extends Document {
  _id: mongoose.Types.ObjectId;
  community: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
  lastReadAt: Date;
  unreadCount: number;
}

export interface ICommunityMembershipModel extends Model<ICommunityMembership> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const communityMembershipSchema = new Schema<ICommunityMembership, ICommunityMembershipModel>(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
      required: [true, 'Community reference is required'],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    unreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Unique constraint: one membership per user per community
communityMembershipSchema.index({ community: 1, user: 1 }, { unique: true });

// Query user's communities
communityMembershipSchema.index({ user: 1, joinedAt: -1 });

// Query community members
communityMembershipSchema.index({ community: 1, joinedAt: -1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export const CommunityMembership = mongoose.model<ICommunityMembership, ICommunityMembershipModel>(
  'CommunityMembership',
  communityMembershipSchema,
);
