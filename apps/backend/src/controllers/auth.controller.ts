import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middleware/error';
import { successResponse } from '../utils';
import { getFirebaseAuth } from '../config/firebase';

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password, name, username } = req.body as {
      email: string;
      password: string;
      name: string;
      username: string;
    };

    const device = (req.headers['x-device-id'] as string) ?? req.headers['user-agent'] ?? 'unknown';

    const result = await authService.register(email, password, name, username, device);

    // Set refresh token as httpOnly cookie as well (belt + suspenders)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json(
      successResponse(
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        'Account created successfully',
      ),
    );
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password, device } = req.body as {
      email: string;
      password: string;
      device?: string;
    };

    const deviceId =
      device ??
      (req.headers['x-device-id'] as string) ??
      req.headers['user-agent'] ??
      'unknown';

    const result = await authService.login(email, password, deviceId);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(
      successResponse(
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        'Logged in successfully',
      ),
    );
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/auth/google ─────────────────────────────────────────────────

export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { idToken, email, name, photo, device } = req.body as {
      idToken: string;
      email: string;
      name?: string;
      photo?: string;
      device?: string;
    };

    console.log('[Auth Controller] Google login request:', {
      email,
      name,
      hasPhoto: !!photo,
      hasIdToken: !!idToken,
    });

    // Verify the Firebase ID token
    let decodedToken;
    try {
      const firebaseAuth = getFirebaseAuth();
      decodedToken = await firebaseAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('[Auth] Firebase token verification failed:', error);
      throw new AppError('Invalid Firebase token', 401, true, 'INVALID_FIREBASE_TOKEN');
    }

    if (!decodedToken || !decodedToken.email) {
      throw new AppError('Invalid Firebase token payload', 401, true, 'INVALID_TOKEN_PAYLOAD');
    }

    // Verify email matches
    if (decodedToken.email !== email) {
      throw new AppError('Email mismatch', 401, true, 'EMAIL_MISMATCH');
    }

    const deviceId =
      device ??
      (req.headers['x-device-id'] as string) ??
      req.headers['user-agent'] ??
      'unknown';

    // Login or register user with Google/Firebase
    const result = await authService.googleAuth(
      decodedToken.email,
      decodedToken.uid, // Firebase user ID
      name || decodedToken.name || 'User',
      photo || decodedToken.picture,
      deviceId,
    );

    console.log('[Auth Controller] Google login success:', {
      userId: result.user.id,
      username: result.user.username,
      isProfileComplete: result.user.isProfileComplete,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(
      successResponse(
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        'Logged in with Google successfully',
      ),
    );
  } catch (err) {
    console.error('[Auth Controller] Google login error:', err);
    next(err);
  }
};

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Accept token from body or cookie
    const incomingToken =
      (req.body as { refreshToken?: string }).refreshToken ??
      (req.cookies as { refreshToken?: string }).refreshToken;

    if (!incomingToken) {
      throw new AppError('Refresh token is required', 400, true, 'NO_REFRESH_TOKEN');
    }

    const tokens = await authService.refreshAccessToken(incomingToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(
      successResponse(
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        'Token refreshed successfully',
      ),
    );
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const incomingToken =
      (req.body as { refreshToken?: string }).refreshToken ??
      (req.cookies as { refreshToken?: string }).refreshToken;

    if (!incomingToken) {
      throw new AppError('Refresh token is required', 400, true, 'NO_REFRESH_TOKEN');
    }

    await authService.logout(req.user.userId, incomingToken);

    res.clearCookie('refreshToken');

    res.status(200).json(successResponse(null, 'Logged out successfully'));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/auth/logout-all ────────────────────────────────────────────

export const logoutAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    await authService.logoutAll(req.user.userId);

    res.clearCookie('refreshToken');

    res.status(200).json(successResponse(null, 'Logged out from all devices'));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/auth/check-username/:username ────────────────────────────────

export const checkUsernameAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3) {
      res.status(200).json(successResponse({ available: false }, 'Username too short'));
      return;
    }

    const taken = await userRepository.isUsernameTaken(username);
    res.status(200).json(
      successResponse({ available: !taken }, taken ? 'Username is taken' : 'Username is available'),
    );
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    }

    const user = await authService.getMe(req.user.userId);

    res.status(200).json(successResponse(user, 'User profile retrieved'));
  } catch (err) {
    next(err);
  }
};
