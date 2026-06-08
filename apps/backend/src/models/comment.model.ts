import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  text: string;
  parentComment?: mongoose.Types.ObjectId; // null = top-level, set = reply
  repliesCount: number;
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentModel extends Model<IComment> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const commentSchema = new Schema<IComment, ICommentModel>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post reference is required'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    repliesCount: {
      type: Number,
      default: 0,
      min: 0,
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
    isDeleted: {
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

// Fetch comments for a post in chronological order
commentSchema.index({ post: 1, createdAt: 1 });
// Fetch replies to a comment
commentSchema.index({ parentComment: 1, createdAt: 1 });
// User's comments
commentSchema.index({ author: 1, createdAt: -1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

// Soft-delete: mask text when deleted
commentSchema.virtual('displayText').get(function (this: IComment) {
  return this.isDeleted ? '[This comment was deleted]' : this.text;
});

commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

// ─── Export ───────────────────────────────────────────────────────────────────

export const Comment = mongoose.model<IComment, ICommentModel>('Comment', commentSchema);
