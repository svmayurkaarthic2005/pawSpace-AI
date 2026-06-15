import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBlock extends Document {
  blocker: mongoose.Types.ObjectId;
  blocked: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IBlockModel extends Model<IBlock> {}

const blockSchema = new Schema<IBlock, IBlockModel>(
  {
    blocker: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Blocker is required'],
    },
    blocked: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Blocked is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

// Prevent duplicate blocks
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
// Queries
blockSchema.index({ blocker: 1 });
blockSchema.index({ blocked: 1 });

export const Block = mongoose.model<IBlock, IBlockModel>('Block', blockSchema);
