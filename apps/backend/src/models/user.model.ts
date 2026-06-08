import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IRefreshToken {
  token: string;
  device: string;
  createdAt: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  username: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  googleId?: string; // Google OAuth ID
  supabaseId?: string; // Supabase Auth ID
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  locationName?: string; // Human-readable location name (e.g., "Chennai, India")
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date;
  fcmToken?: string;
  refreshTokens: IRefreshToken[];
  followerCount: number;
  followingCount: number;
  petCount: number;
  role: 'user' | 'admin';
  isProfileComplete: boolean; // Tracks if user completed profile setup
  settings?: {
    locationSharing?: boolean;
    pushNotifications?: boolean;
    chatNotifications?: boolean;
    eventReminders?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidate: string): Promise<boolean>;
  toPublicJSON(): PublicUser;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  locationName?: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date;
  followerCount: number;
  followingCount: number;
  petCount: number;
  role: 'user' | 'admin';
  isProfileComplete: boolean;
  createdAt: Date;
}

export interface IUserModel extends Model<IUser> {
  // Static methods can be added here
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true },
    device: { type: String, default: 'unknown' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema<IUser, IUserModel>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    avatar: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: null,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },
    supabaseId: {
      type: String,
      default: null,
      sparse: true,
      unique: true,
      // Deprecated: Kept for backward compatibility only
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    locationName: {
      type: String,
      maxlength: [100, 'Location name cannot exceed 100 characters'],
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
    },
    followerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    petCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    settings: {
      locationSharing: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      chatNotifications: {
        type: Boolean,
        default: true,
      },
      eventReminders: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

userSchema.index({ location: '2dsphere' });
userSchema.index({ createdAt: -1 });

// ─── Pre-save Hook: Hash Password ─────────────────────────────────────────────

userSchema.pre('save', async function (next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

userSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password as string);
};

userSchema.methods.toPublicJSON = function (): PublicUser {
  return {
    id: (this._id as mongoose.Types.ObjectId).toString(),
    email: this.email as string,
    name: this.name as string,
    username: this.username as string,
    avatar: this.avatar as string | undefined,
    coverImage: this.coverImage as string | undefined,
    bio: this.bio as string | undefined,
    locationName: this.locationName as string | undefined,
    isVerified: this.isVerified as boolean,
    isOnline: this.isOnline as boolean,
    lastSeen: this.lastSeen as Date,
    followerCount: this.followerCount as number,
    followingCount: this.followingCount as number,
    petCount: this.petCount as number,
    role: this.role as 'user' | 'admin',
    isProfileComplete: this.isProfileComplete as boolean,
    createdAt: this.createdAt as Date,
  };
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
