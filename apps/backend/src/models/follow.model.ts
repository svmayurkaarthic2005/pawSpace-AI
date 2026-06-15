import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FollowableEntityType = 'User' | 'Pet';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IFollow extends Document {
  _id: mongoose.Types.ObjectId;
  follower: mongoose.Types.ObjectId;  // the user who follows (always a User)
  following: mongoose.Types.ObjectId; // the entity being followed (User or Pet)
  entityType: FollowableEntityType;   // discriminator: 'User' or 'Pet'
  status: 'pending' | 'accepted';
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
      refPath: 'entityType', // Polymorphic reference
      required: [true, 'Following is required'],
    },
    entityType: {
      type: String,
      enum: ['User', 'Pet'],
      required: [true, 'Entity type is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'accepted',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Prevent duplicate follows (compound unique with entityType)
followSchema.index({ follower: 1, following: 1, entityType: 1 }, { unique: true });
// "Who follows this entity?" — get all followers of a user or pet
followSchema.index({ following: 1, entityType: 1, createdAt: -1 });
// "What does this user follow?" — get all entities a user follows
followSchema.index({ follower: 1, createdAt: -1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export const Follow = mongoose.model<IFollow, IFollowModel>('Follow', followSchema);
