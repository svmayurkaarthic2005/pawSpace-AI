import mongoose, { Document, Schema, Model } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
export type PetGender = 'male' | 'female';

export interface IPetImage {
  url: string;
  publicId: string;
  isProfile: boolean;
}

export interface IPet extends Document {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  name: string;
  species: PetSpecies;
  breed?: string;
  age?: number;
  gender: PetGender;
  bio?: string;
  images: IPetImage[];
  followers: mongoose.Types.ObjectId[]; // @deprecated Use Follow collection instead. Remove after migration verified.
  followerCount: number; // Denormalized count from Follow collection
  followersLegacyMigrated?: boolean; // Migration tracking flag
  createdAt: Date;
  updatedAt: Date;
}

export interface IPetModel extends Model<IPet> {}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const petImageSchema = new Schema<IPetImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    isProfile: { type: Boolean, default: false, index: true },
  },
  { _id: false },
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const petSchema = new Schema<IPet, IPetModel>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Pet name is required'],
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    species: {
      type: String,
      enum: ['dog', 'cat', 'bird', 'rabbit', 'other'],
      required: [true, 'Species is required'],
    },
    breed: {
      type: String,
      trim: true,
      maxlength: [60, 'Breed cannot exceed 60 characters'],
      default: null,
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      max: [100, 'Age seems too high'],
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Gender is required'],
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: null,
    },
    images: {
      type: [petImageSchema],
      default: [],
    },
    followers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      // DEPRECATED: This field is deprecated and will be removed in a future version.
      // Use the Follow collection instead for querying pet followers.
      // After migration is verified, this field should be removed from the schema.
    },
    followerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    followersLegacyMigrated: {
      type: Boolean,
      default: false,
      // Migration tracking: true if followers have been migrated to Follow collection
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

petSchema.index({ owner: 1, createdAt: -1 });
petSchema.index({ species: 1 });
petSchema.index({ name: 'text', breed: 'text', bio: 'text' });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

petSchema.virtual('profileImage').get(function (this: IPet) {
  return this.images.find((img) => img.isProfile) ?? this.images[0] ?? null;
});

petSchema.set('toJSON', { virtuals: true });
petSchema.set('toObject', { virtuals: true });

// ─── Export ───────────────────────────────────────────────────────────────────

export const Pet = mongoose.model<IPet, IPetModel>('Pet', petSchema);
