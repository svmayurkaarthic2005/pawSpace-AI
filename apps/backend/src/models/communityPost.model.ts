import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ICommunityPostMedia {
  url: string;
  publicId: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export interface ICommunityPost extends Document {
  _id: mongoose.Types.ObjectId;
  community: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  media: ICommunityPostMedia[];
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommunityPostModel extends Model<ICommunityPost> {}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const communityPostMediaSchema = new Schema<ICommunityPostMedia>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    thumbnail: { type: String, default: null },
  },
  { _id: false },
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const communityPostSchema = new Schema<ICommunityPost, ICommunityPostModel>(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: 'Community',
      required: [true, 'Community reference is required'],
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    media: {
      type: [communityPostMediaSchema],
      default: [],
    },
    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      select: false,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Community feed: pinned first, then newest
communityPostSchema.index({ community: 1, isPinned: -1, createdAt: -1 });
// Author's community posts
communityPostSchema.index({ author: 1, createdAt: -1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export const CommunityPost = mongoose.model<ICommunityPost, ICommunityPostModel>(
  'CommunityPost',
  communityPostSchema,
);
