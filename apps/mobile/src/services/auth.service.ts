import api, { saveTokens, clearTokens } from './api';
import { User, AuthTokens } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  device?: string;
}

export interface GoogleLoginPayload {
  idToken: string;
  email: string;
  name?: string;
  photo?: string;
  device?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface ApiAuthResponse {
  success: boolean;
  message: string;
  data: AuthResponse;
}

// Backend user response format
interface BackendUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
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

interface BackendAuthResponse {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
}

interface ApiBackendAuthResponse {
  success: boolean;
  message: string;
  data: BackendAuthResponse;
}

// ─── Transform Helper ─────────────────────────────────────────────────────────

/**
 * Transform backend user format to frontend User type
 */
function transformUser(backendUser: BackendUser): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    username: backendUser.username,
    displayName: backendUser.name || 'User',
    avatarUrl: backendUser.avatar || undefined,
    bio: backendUser.bio || undefined,
    followersCount: backendUser.followerCount || 0,
    followingCount: backendUser.followingCount || 0,
    petsCount: backendUser.petCount || 0,
    isProfileComplete: backendUser.isProfileComplete ?? false,
    createdAt: backendUser.createdAt ? new Date(backendUser.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: backendUser.createdAt ? new Date(backendUser.createdAt).toISOString() : new Date().toISOString(),
  };
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * Register a new account and persist tokens to Keychain.
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiBackendAuthResponse>('/auth/register', payload);
    const user = transformUser(data.data.user);
    await saveTokens(data.data.accessToken, data.data.refreshToken);
    return {
      user,
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
  },

  /**
   * Login with email + password and persist tokens to Keychain.
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiBackendAuthResponse>('/auth/login', payload);
    const user = transformUser(data.data.user);
    await saveTokens(data.data.accessToken, data.data.refreshToken);
    return {
      user,
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
  },

  /**
   * Login with Google OAuth and persist tokens to Keychain.
   */
  async googleLogin(payload: GoogleLoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<ApiBackendAuthResponse>('/auth/google', payload);
    const user = transformUser(data.data.user);
    await saveTokens(data.data.accessToken, data.data.refreshToken);
    return {
      user,
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
  },

  /**
   * Logout — remove tokens from Keychain and notify the server.
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      // Always clear local tokens even if server call fails
      await clearTokens();
    }
  },

  /**
   * Refresh the access token using the stored refresh token.
   * Called automatically by the Axios interceptor on 401.
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const { data } = await api.post<{ success: boolean; data: AuthTokens }>(
      '/auth/refresh',
      { refreshToken },
    );
    await saveTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  /**
   * Get the current user's profile.
   */
  async getMe(): Promise<User> {
    const { data } = await api.get<{ success: boolean; data: BackendUser }>('/auth/me');
    return transformUser(data.data);
  },

  /**
   * Check if a username is available (debounced in UI).
   */
  async checkUsername(username: string): Promise<boolean> {
    try {
      const { data } = await api.get<{ success: boolean; data: { available: boolean } }>(
        `/auth/check-username/${username}`,
      );
      return data.data.available;
    } catch {
      return false;
    }
  },
};
