import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video';
export type PostVisibility = 'public' | 'followers';

export interface IPostMedia {
  url: string;
  publicId: string;
  type: MediaType;
  thumbnail?: string;
}

export interface IPostLocation {
  name: string;
  coordinates: [number, number]; // [lng, lat]
}

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  pet?: mongoose.Types.ObjectId;
  caption: string;
  hashtags: string[];
  media: IPostMedia[];
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  location?: IPostLocation;
  visibility: PostVisibility;
  isAI: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostModel extends Model<IPost> {}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const postMediaSchema = new Schema<IPostMedia>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    thumbnail: { type: String, default: null },
  },
  { _id: false },
);

const postLocationSchema = new Schema<IPostLocation>(
  {
    name: { type: String, required: true, trim: true },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false },
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const postSchema = new Schema<IPost, IPostModel>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },
    pet: {
      type: Schema.Types.ObjectId,
      ref: 'Pet',
      default: null,
      index: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
      default: '',
    },
    hashtags: {
      type: [String],
      default: [],
      index: true,
    },
    media: {
      type: [postMediaSchema],
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
    location: {
      type: postLocationSchema,
      default: null,
    },
    visibility: {
      type: String,
      enum: ['public', 'followers'],
      default: 'public',
    },
    isAI: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Compound: user's posts sorted by newest
postSchema.index({ author: 1, createdAt: -1 });
// Pet's posts
postSchema.index({ pet: 1, createdAt: -1 });
// Public feed
postSchema.index({ visibility: 1, createdAt: -1 });
// Full-text search on caption + hashtags
postSchema.index({ caption: 'text', hashtags: 'text' });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

postSchema.virtual('isLiked').get(function () {
  // Populated at query time via aggregation — placeholder virtual
  return false;
});

postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

// ─── Export ───────────────────────────────────────────────────────────────────

export const Post = mongoose.model<IPost, IPostModel>('Post', postSchema);
