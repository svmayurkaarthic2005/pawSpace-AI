import { Response, NextFunction, Request } from 'express';
import { User } from '../models/user.model';
import { Follow } from '../models/follow.model';
import { Block } from '../models/block.model';
import { successResponse, errorResponse } from '../utils';
import { uploadImage } from '../utils/cloudinary.util';

// ─── Get Current User ─────────────────────────────────────────────────────────

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('Unauthorized'));
      return;
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      res.status(404).json(errorResponse('User not found'));
      return;
    }

    res.json(successResponse(user.toPublicJSON()));
  } catch (error) {
    next(error);
  }
};

// ─── Get User Profile by ID ───────────────────────────────────────────────────

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json(errorResponse('User not found'));
      return;
    }

    // Check if current user follows this user (if authenticated)
    let isFollowing = false;
    let isBlocked = false;
    if (req.user) {
      const follow = await Follow.findOne({
        follower: req.user.userId,
        following: id,
      });
      isFollowing = !!follow;
      
      const block = await Block.findOne({
        blocker: req.user.userId,
        blocked: id,
      });
      isBlocked = !!block;
    }

    const profile = {
      ...user.toPublicJSON(),
      isFollowing,
      isBlocked,
    };

    res.json(successResponse(profile));
  } catch (error) {
    next(error);
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('Unauthorized'));
      return;
    }

    const { name, bio, avatar, username, isProfileComplete, locationName } = req.body as {
      name?: string;
      bio?: string;
      avatar?: string;
      username?: string;
      isProfileComplete?: boolean;
      locationName?: string;
    };

    const user = await User.findById(req.user.userId);

    if (!user) {
      res.status(404).json(errorResponse('User not found'));
      return;
    }

    // If username is being changed, check if it's available
    if (username !== undefined && username !== user.username) {
      const existingUser = await User.findOne({ 
        username: username.toLowerCase(),
        _id: { $ne: user._id } // Exclude current user
      });
      
      if (existingUser) {
        res.status(409).json(errorResponse('Username is already taken', { code: 'USERNAME_TAKEN' }));
        return;
      }
    }

    // Handle avatar upload if file is provided
    if (req.file) {
      try {
        const uploadResult = await uploadImage(
          req.file.buffer,
          `pawspace/avatars/${user._id}`,
          {
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto', fetch_format: 'webp' },
            ],
          }
        );
        user.avatar = uploadResult.url;
        console.log('[User Controller] Avatar uploaded:', uploadResult.url);
      } catch (uploadError) {
        console.error('[User Controller] Avatar upload failed:', uploadError);
        res.status(500).json(errorResponse('Failed to upload avatar'));
        return;
      }
    } else if (avatar !== undefined) {
      // If avatar URL is provided directly (not a file upload)
      user.avatar = avatar;
    }

    // Update other fields
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (username !== undefined) user.username = username;
    if (isProfileComplete !== undefined) user.isProfileComplete = isProfileComplete;
    if (locationName !== undefined) user.locationName = locationName;

    await user.save();

    console.log('[User Controller] Profile updated:', {
      userId: user._id.toString(),
      username: user.username,
      isProfileComplete: user.isProfileComplete,
      hasAvatar: !!user.avatar,
    });

    res.json(successResponse(user.toPublicJSON(), 'Profile updated successfully'));
  } catch (error: any) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000 && error.keyPattern?.username) {
      res.status(409).json(errorResponse('Username is already taken', { code: 'USERNAME_TAKEN' }));
      return;
    }
    next(error);
  }
};

// ─── Get Nearby Users ─────────────────────────────────────────────────────────

export const getNearbyUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // TODO: Implement geolocation-based user discovery
    // For now, return empty array
    res.json(successResponse([], 'No nearby users found'));
  } catch (error) {
    next(error);
  }
};

// ─── Update User Settings ─────────────────────────────────────────────────────

export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('Unauthorized'));
      return;
    }

    const {
      locationSharing,
      pushNotifications,
      chatNotifications,
      eventReminders,
    } = req.body as {
      locationSharing?: boolean;
      pushNotifications?: boolean;
      chatNotifications?: boolean;
      eventReminders?: boolean;
    };

    const user = await User.findById(req.user.userId);

    if (!user) {
      res.status(404).json(errorResponse('User not found'));
      return;
    }

    // Initialize settings if not present
    if (!user.settings) {
      user.settings = {};
    }

    // Update settings
    if (locationSharing !== undefined) user.settings.locationSharing = locationSharing;
    if (pushNotifications !== undefined) user.settings.pushNotifications = pushNotifications;
    if (chatNotifications !== undefined) user.settings.chatNotifications = chatNotifications;
    if (eventReminders !== undefined) user.settings.eventReminders = eventReminders;

    await user.save();

    console.log('[User Controller] Settings updated:', {
      userId: user._id.toString(),
      settings: user.settings,
    });

    res.json(successResponse(user.settings, 'Settings updated successfully'));
  } catch (error) {
    next(error);
  }
};

// ─── Get User Settings ────────────────────────────────────────────────────────

export const getSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('Unauthorized'));
      return;
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      res.status(404).json(errorResponse('User not found'));
      return;
    }

    // Return default settings if not set
    const defaultSettings = {
      locationSharing: true,
      pushNotifications: true,
      chatNotifications: true,
      eventReminders: true,
    };

    const settings = user.settings || defaultSettings;

    res.json(successResponse(settings));
  } catch (error) {
    next(error);
  }
};
