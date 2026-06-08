import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middleware/error';
import { PublicUser } from '../models/user.model';
import { redisSet, redisExists } from '../config/redis';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

interface JwtAccessPayload {
  userId: string;
  email: string;
}

interface JwtRefreshPayload {
  userId: string;
  tokenId: string; // unique ID per refresh token for revocation
}

// ─── Token Helpers ────────────────────────────────────────────────────────────

const REFRESH_TOKEN_BLACKLIST_PREFIX = 'rt:blacklist:';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const generateTokenId = (): string => crypto.randomBytes(16).toString('hex');

// ─── Auth Service ─────────────────────────────────────────────────────────────

export class AuthService {
  /**
   * Generate a JWT access + refresh token pair for a user.
   */
  generateTokens(userId: string, email: string): TokenPair {
    const accessToken = jwt.sign(
      { userId, email } satisfies JwtAccessPayload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
    );

    const tokenId = generateTokenId();
    const refreshToken = jwt.sign(
      { userId, tokenId } satisfies JwtRefreshPayload,
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions,
    );

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user account.
   */
  async register(
    email: string,
    password: string,
    name: string,
    username: string,
    device: string = 'unknown',
  ): Promise<AuthResult> {
    // Check for existing email / username in parallel
    const [emailTaken, usernameTaken] = await Promise.all([
      userRepository.isEmailTaken(email),
      userRepository.isUsernameTaken(username),
    ]);

    if (emailTaken) {
      throw new AppError('An account with this email already exists', 409, true, 'EMAIL_TAKEN');
    }
    if (usernameTaken) {
      throw new AppError('This username is already taken', 409, true, 'USERNAME_TAKEN');
    }

    // Create user (password hashed by pre-save hook)
    const user = await userRepository.create({ email, password, name, username });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(
      user._id.toString(),
      user.email,
    );

    // Persist refresh token
    await userRepository.addRefreshToken(user._id.toString(), {
      token: refreshToken,
      device,
      createdAt: new Date(),
    });

    return { user: user.toPublicJSON(), accessToken, refreshToken };
  }

  /**
   * Authenticate a user with email + password.
   */
  async login(
    email: string,
    password: string,
    device: string = 'unknown',
  ): Promise<AuthResult> {
    // findByEmail includes password field
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Use generic message to prevent user enumeration
      throw new AppError('Invalid email or password', 401, true, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, true, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(
      user._id.toString(),
      user.email,
    );

    // Persist refresh token
    await userRepository.addRefreshToken(user._id.toString(), {
      token: refreshToken,
      device,
      createdAt: new Date(),
    });

    // Update online status
    await userRepository.setOnlineStatus(user._id.toString(), true);

    return { user: user.toPublicJSON(), accessToken, refreshToken };
  }

  /**
   * Authenticate or register a user with Google OAuth.
   */
  async googleAuth(
    email: string,
    googleId: string,
    name: string,
    photo?: string,
    device: string = 'unknown',
  ): Promise<AuthResult> {
    console.log('[AuthService] Google auth for email:', email);
    
    // Check if user exists
    let user = await userRepository.findByEmail(email);

    if (!user) {
      console.log('[AuthService] Creating new Google user');
      
      // Create new user with Google account
      // Generate a unique username from email
      const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let counter = 1;

      // Ensure username is unique
      while (await userRepository.isUsernameTaken(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      console.log('[AuthService] Generated username:', username);

      // Create user without password (Google OAuth user)
      // Mark as incomplete so they can fill in additional profile details
      user = await userRepository.create({
        email,
        name,
        username,
        password: crypto.randomBytes(32).toString('hex'), // Random password (won't be used)
        avatar: photo,
        googleId,
        isProfileComplete: false, // New Google users need to complete profile
      });
      
      console.log('[AuthService] User created:', {
        id: user._id.toString(),
        username: user.username,
        isProfileComplete: user.isProfileComplete,
      });
    } else {
      console.log('[AuthService] Existing user found:', user._id.toString());
      
      // Update Google ID if not set
      if (!user.googleId) {
        await userRepository.updateGoogleId(user._id.toString(), googleId);
      }
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(
      user._id.toString(),
      user.email,
    );

    // Persist refresh token
    await userRepository.addRefreshToken(user._id.toString(), {
      token: refreshToken,
      device,
      createdAt: new Date(),
    });

    // Update online status
    await userRepository.setOnlineStatus(user._id.toString(), true);

    const publicUser = user.toPublicJSON();
    console.log('[AuthService] Returning user:', {
      id: publicUser.id,
      username: publicUser.username,
      isProfileComplete: publicUser.isProfileComplete,
    });

    return { user: publicUser, accessToken, refreshToken };
  }

  /**
   * Rotate a refresh token — verify old one, issue new pair.
   */
  async refreshAccessToken(incomingRefreshToken: string): Promise<TokenPair> {
    // Check blacklist first
    const isBlacklisted = await redisExists(
      `${REFRESH_TOKEN_BLACKLIST_PREFIX}${incomingRefreshToken}`,
    );
    if (isBlacklisted) {
      throw new AppError('Refresh token has been revoked', 401, true, 'TOKEN_REVOKED');
    }

    // Verify signature
    let payload: JwtRefreshPayload;
    try {
      payload = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError('Refresh token has expired, please log in again', 401, true, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid refresh token', 401, true, 'INVALID_TOKEN');
    }

    // Verify token exists in DB (not already rotated away)
    const user = await userRepository.findByRefreshToken(incomingRefreshToken);
    if (!user) {
      // Possible token reuse attack — invalidate all tokens for this user
      await userRepository.removeAllRefreshTokens(payload.userId);
      throw new AppError(
        'Refresh token reuse detected. All sessions have been invalidated.',
        401,
        true,
        'TOKEN_REUSE',
      );
    }

    // Remove old token from DB
    await userRepository.removeRefreshToken(user._id.toString(), incomingRefreshToken);

    // Blacklist old token in Redis until it would have expired
    const decoded = jwt.decode(incomingRefreshToken) as { exp?: number } | null;
    const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : REFRESH_TOKEN_TTL_SECONDS;
    if (ttl > 0) {
      await redisSet(
        `${REFRESH_TOKEN_BLACKLIST_PREFIX}${incomingRefreshToken}`,
        '1',
        ttl,
      );
    }

    // Issue new token pair
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
      user._id.toString(),
      user.email,
    );

    // Persist new refresh token
    await userRepository.addRefreshToken(user._id.toString(), {
      token: newRefreshToken,
      device: user.refreshTokens.find((t) => t.token === incomingRefreshToken)?.device ?? 'unknown',
      createdAt: new Date(),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout — remove refresh token from DB and blacklist it.
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    // Remove from DB
    await userRepository.removeRefreshToken(userId, refreshToken);

    // Blacklist in Redis
    const decoded = jwt.decode(refreshToken) as { exp?: number } | null;
    const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : REFRESH_TOKEN_TTL_SECONDS;
    if (ttl > 0) {
      await redisSet(`${REFRESH_TOKEN_BLACKLIST_PREFIX}${refreshToken}`, '1', ttl);
    }

    // Mark user offline
    await userRepository.setOnlineStatus(userId, false);
  }

  /**
   * Logout from all devices.
   */
  async logoutAll(userId: string): Promise<void> {
    const user = await userRepository.findByIdWithTokens(userId);
    if (!user) return;

    // Blacklist all active refresh tokens
    const blacklistOps = user.refreshTokens.map(async ({ token }) => {
      const decoded = jwt.decode(token) as { exp?: number } | null;
      const ttl = decoded?.exp
        ? decoded.exp - Math.floor(Date.now() / 1000)
        : REFRESH_TOKEN_TTL_SECONDS;
      if (ttl > 0) {
        await redisSet(`${REFRESH_TOKEN_BLACKLIST_PREFIX}${token}`, '1', ttl);
      }
    });

    await Promise.all([...blacklistOps, userRepository.removeAllRefreshTokens(userId)]);
    await userRepository.setOnlineStatus(userId, false);
  }

  /**
   * Get the current authenticated user's public profile.
   */
  async getMe(userId: string): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
    }
    return user.toPublicJSON();
  }
}

export const authService = new AuthService();
