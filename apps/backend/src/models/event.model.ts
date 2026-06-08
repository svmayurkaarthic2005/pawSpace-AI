import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface IEventLocation {
  name: string;
  address: string;
  coordinates: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  title: string;
  description: string;
  coverImage?: string;
  location: IEventLocation;
  startDate: Date;
  endDate: Date;
  petFriendlySpecies: string[];
  maxAttendees?: number;
  rsvpCount: number;
  tags: string[];
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventModel extends Model<IEvent> {}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const eventLocationSchema = new Schema<IEventLocation>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { _id: false },
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const eventSchema = new Schema<IEvent, IEventModel>(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    coverImage: {
      type: String,
      default: null,
    },
    location: {
      type: eventLocationSchema,
      required: [true, 'Location is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (this: IEvent, v: Date) {
          return v > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    petFriendlySpecies: {
      type: [String],
      default: [],
    },
    maxAttendees: {
      type: Number,
      min: [1, 'Max attendees must be at least 1'],
      default: null,
    },
    rsvpCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Geospatial — find nearby events
eventSchema.index({ 'location.coordinates': '2dsphere' });
// Browse upcoming events
eventSchema.index({ status: 1, startDate: 1 });
// Creator's events
eventSchema.index({ creator: 1, createdAt: -1 });
// Full-text search
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

// ─── Export ───────────────────────────────────────────────────────────────────

export const Event = mongoose.model<IEvent, IEventModel>('Event', eventSchema);
