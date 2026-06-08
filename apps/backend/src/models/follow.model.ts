import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IFollow extends Document {
  _id: mongoose.Types.ObjectId;
  follower: mongoose.Types.ObjectId;  // the user who follows
  following: mongoose.Types.ObjectId; // the user being followed
  createdAt: Date;
}

export interface IFollowModel extends Model<IFollow> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const followSchema = new Schema<IFollow, IFollowModel>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Follower is required'],
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Following is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Prevent duplicate follows
followSchema.index({ follower: 1, following: 1 }, { unique: true });
// "Who follows me?" — get all followers of a user
followSchema.index({ following: 1, createdAt: -1 });
// "Who am I following?" — get all users a person follows
followSchema.index({ follower: 1, createdAt: -1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export const Follow = mongoose.model<IFollow, IFollowModel>('Follow', followSchema);
