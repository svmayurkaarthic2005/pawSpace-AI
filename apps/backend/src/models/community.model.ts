import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ICommunity extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  accentColor?: string;
  creator: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  memberCount: number;
  postCount: number;
  species: string[];
  isPrivate: boolean;
  tags: string[];
  rules?: string;
  pinnedPostId?: mongoose.Types.ObjectId;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommunityModel extends Model<ICommunity> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const communitySchema = new Schema<ICommunity, ICommunityModel>(
  {
    name: {
      type: String,
      required: [true, 'Community name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    accentColor: {
      type: String,
      default: null,
      match: [/^#([0-9A-F]{3}){1,2}$/i, 'Accent color must be a valid hex color'],
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true,
    },
    members: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    memberCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    postCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    species: {
      type: [String],
      default: [],
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    rules: {
      type: String,
      default: null,
      maxlength: [2000, 'Rules cannot exceed 2000 characters'],
    },
    pinnedPostId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityPost',
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

communitySchema.index({ memberCount: -1 }); // trending communities
communitySchema.index({ species: 1 });
communitySchema.index({ lastActivityAt: -1 }); // most active communities
communitySchema.index({ name: 'text', description: 'text', tags: 'text' });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

communitySchema.virtual('posts', {
  ref: 'CommunityPost',
  localField: '_id',
  foreignField: 'community',
});

communitySchema.set('toJSON', { virtuals: false });
communitySchema.set('toObject', { virtuals: false });

// ─── Export ───────────────────────────────────────────────────────────────────

export const Community = mongoose.model<ICommunity, ICommunityModel>('Community', communitySchema);
