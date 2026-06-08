import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type AIFeature =
  | 'pet_assistant'
  | 'caption_gen'
  | 'event_rec'
  | 'smart_search'
  | 'conversation_starter'
  | 'feed_rank';

export interface IAIInteraction extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  feature: AIFeature;
  prompt: string;
  response: string;
  modelName: string;
  tokensUsed: number;
  latencyMs: number;
  cached: boolean;
  createdAt: Date;
}

export interface IAIInteractionModel extends Model<IAIInteraction> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const aiInteractionSchema = new Schema<IAIInteraction, IAIInteractionModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    feature: {
      type: String,
      enum: [
        'pet_assistant',
        'caption_gen',
        'event_rec',
        'smart_search',
        'conversation_starter',
        'feed_rank',
      ],
      required: [true, 'Feature is required'],
    },
    prompt: {
      type: String,
      required: [true, 'Prompt is required'],
      maxlength: [10000, 'Prompt too long'],
    },
    response: {
      type: String,
      required: [true, 'Response is required'],
      maxlength: [20000, 'Response too long'],
    },
    modelName: {
      type: String,
      required: [true, 'Model name is required'],
      default: 'llama3-8b-8192',
    },
    tokensUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    latencyMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    cached: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// User's AI usage history per feature
aiInteractionSchema.index({ user: 1, feature: 1, createdAt: -1 });
// Analytics: feature usage over time
aiInteractionSchema.index({ feature: 1, createdAt: -1 });
// Auto-expire interactions after 30 days to control storage
aiInteractionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// ─── Export ───────────────────────────────────────────────────────────────────

export const AIInteraction = mongoose.model<IAIInteraction, IAIInteractionModel>(
  'AIInteraction',
  aiInteractionSchema,
);
