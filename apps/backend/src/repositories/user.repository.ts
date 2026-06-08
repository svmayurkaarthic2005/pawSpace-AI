import mongoose from 'mongoose';
import { User, IUser, IRefreshToken } from '../models/user.model';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  username: string;
  avatar?: string;
  profilePicture?: string;
  googleId?: string;
  supabaseId?: string;
  isProfileComplete?: boolean;
}

export interface UpdateUserData {
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  location?: { type: 'Point'; coordinates: [number, number] };
  isVerified?: boolean;
  isOnline?: boolean;
  lastSeen?: Date;
  fcmToken?: string;
  followerCount?: number;
  followingCount?: number;
  petCount?: number;
  isProfileComplete?: boolean;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class UserRepository {
  /**
   * Find a user by email. Includes password field for auth checks.
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  /**
   * Find a user by ID. Does NOT include password.
   */
  async findById(id: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return User.findById(id).exec();
  }

  /**
   * Find a user by ID and include refresh tokens (for token rotation).
   */
  async findByIdWithTokens(id: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return User.findById(id).select('+refreshTokens').exec();
  }

  /**
   * Find a user by username.
   */
  async findByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username: username.toLowerCase() }).exec();
  }

  /**
   * Check if a username is already taken.
   */
  async isUsernameTaken(username: string, excludeId?: string): Promise<boolean> {
    const query: mongoose.FilterQuery<IUser> = { username: username.toLowerCase() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const count = await User.countDocuments(query).exec();
    return count > 0;
  }

  /**
   * Check if an email is already registered.
   */
  async isEmailTaken(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email: email.toLowerCase() }).exec();
    return count > 0;
  }

  /**
   * Create a new user.
   */
  async create(data: CreateUserData): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  /**
   * Update a user by ID. Returns the updated document.
   */
  async updateById(id: string, data: UpdateUserData): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  /**
   * Add a refresh token to the user's token list.
   * Enforces a max of 5 active sessions — removes oldest if exceeded.
   */
  async addRefreshToken(userId: string, tokenData: IRefreshToken): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      // Push new token
      $push: {
        refreshTokens: {
          $each: [tokenData],
          $slice: -5, // keep only the 5 most recent
        },
      },
    }).exec();
  }

  /**
   * Remove a specific refresh token from the user's token list.
   */
  async removeRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { token } },
    }).exec();
  }

  /**
   * Remove all refresh tokens for a user (full logout from all devices).
   */
  async removeAllRefreshTokens(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] },
    }).exec();
  }

  /**
   * Find a user that has a specific refresh token stored.
   */
  async findByRefreshToken(token: string): Promise<IUser | null> {
    return User.findOne({ 'refreshTokens.token': token }).exec();
  }

  /**
   * Update online status and lastSeen timestamp.
   */
  async setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const update: Partial<IUser> = { isOnline };
    if (!isOnline) {
      update.lastSeen = new Date();
    }
    await User.findByIdAndUpdate(userId, { $set: update }).exec();
  }

  /**
   * Update Google ID for a user.
   */
  async updateGoogleId(userId: string, googleId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $set: { googleId } }).exec();
  }
}

export const userRepository = new UserRepository();
