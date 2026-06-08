import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type RSVPStatus = 'going' | 'maybe' | 'not_going';

export interface IRSVP extends Document {
  _id: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  status: RSVPStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRSVPModel extends Model<IRSVP> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const rsvpSchema = new Schema<IRSVP, IRSVPModel>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not_going'],
      required: [true, 'RSVP status is required'],
      default: 'going',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// One RSVP per user per event
rsvpSchema.index({ event: 1, user: 1 }, { unique: true });
// All RSVPs for an event (attendee list)
rsvpSchema.index({ event: 1, status: 1 });
// All events a user has RSVPed to
rsvpSchema.index({ user: 1, createdAt: -1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export const RSVP = mongoose.model<IRSVP, IRSVPModel>('RSVP', rsvpSchema);
