import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
import { User } from '../types';
import { saveTokens, clearTokens, setLogoutCallback, setTokenRefreshCallback } from '../services/api';
import { authApi } from '../services/auth.service';
import { onAuthStateChanged as firebaseOnAuthStateChanged } from '../services/firebaseAuth.service';
import { socketService } from '../services/socket.service';
import { eventApi } from '../services/event.service';
import { STORAGE_KEYS } from '../constants';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  accessToken: string | null;
  token: string | null; // Alias for accessToken for compatibility
  clerkToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (user: User, accessToken: string, refreshToken: string, clerkToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setClerkToken: (token: string) => void;
  initialize: () => Promise<void>;
  syncClerkUser: (clerkUserId: string, email: string, clerkToken: string) => Promise<void>;
  handleFirebaseUser: (firebaseUser: any, idToken: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  get token() { return this.accessToken; }, // Alias for compatibility
  clerkToken: null,
  isAuthenticated: false,
  isLoading: true,

  /**
   * Called after a successful login or register.
   * Persists tokens to Keychain and updates state.
   */
  login: async (user: User, accessToken: string, refreshToken: string, clerkToken?: string) => {
    // Save tokens FIRST before connecting socket
    await saveTokens(accessToken, refreshToken);
    
    // Update state with new tokens
    set({ 
      user, 
      accessToken, 
      clerkToken: clerkToken || null,
      isAuthenticated: true, 
      isLoading: false 
    });
    
    // Wait a bit to ensure tokens are fully persisted
    await new Promise<void>(resolve => setTimeout(resolve, 100));
    
    // Connect socket AFTER tokens are saved (non-blocking)
    try {
      await socketService.connect();
    } catch (error) {
      console.warn('[AuthStore] Socket connection failed (non-critical):', error);
    }
  },

  /**
   * Logout — clear Keychain tokens, call server, reset state.
   */
  logout: async () => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: STORAGE_KEYS.REFRESH_TOKEN,
      });
      if (credentials) {
        await authApi.logout(credentials.password);
      }
    } catch {
      // Best-effort server logout
    } finally {
      // Disconnect socket
      socketService.disconnect();

      await clearTokens();
      set({ 
        user: null, 
        accessToken: null, 
        clerkToken: null,
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },

  setUser: (user: User) => set({ user }),

  setAccessToken: (token: string) => set({ accessToken: token }),

  setClerkToken: (token: string) => set({ clerkToken: token }),

  /**
   * Called on app start — check Keychain for existing tokens.
   * If found, fetch the current user profile to restore session.
   * Also check for Firebase session.
   */
  initialize: async () => {
    set({ isLoading: true });
    try {
      // Check for existing Keychain tokens first
      const credentials = await Keychain.getGenericPassword({
        service: STORAGE_KEYS.ACCESS_TOKEN,
      });

      if (credentials) {
        const accessToken = credentials.password;
        
        console.log('[AuthStore] Found existing token, attempting to restore session');

        try {
          // Fetch current user to validate token
          const user = await authApi.getMe();

          // Update state with user and token
          set({ user, accessToken, isAuthenticated: true, isLoading: false });
          
          // Wait a bit to ensure state is updated
          await new Promise<void>(resolve => setTimeout(resolve, 100));

          // Connect socket (non-blocking)
          try {
            await socketService.connect();
          } catch (error) {
            console.warn('[AuthStore] Socket connection failed (non-critical):', error);
          }
          
          // Update location in background (non-blocking)
          // Temporarily disabled due to import issues
          // updateUserLocation();
          
          // Listen to Firebase auth changes
          firebaseOnAuthStateChanged(async (firebaseUser) => {
            if (!firebaseUser) {
              console.log('[AuthStore] Firebase session expired, logging out');
              await get().logout();
            }
          });

          return;
        } catch (error: any) {
          // If token is expired or invalid, clear tokens and let user re-authenticate
          console.log('[AuthStore] Session restore failed, clearing tokens:', error.message);
          await clearTokens();
        }
      }

      set({ isLoading: false, isAuthenticated: false });
    } catch (error) {
      console.error('[AuthStore] Initialize error:', error);
      await clearTokens();
      set({ user: null, accessToken: null, clerkToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  /**
   * Sync Clerk user with backend after Clerk authentication
   * Note: This is a placeholder - you're using Firebase, not Clerk
   */
  syncClerkUser: async (clerkUserId: string, email: string, clerkToken: string) => {
    try {
      set({ isLoading: true });
      
      // TODO: Implement Clerk sync if needed, or remove this method
      console.warn('[AuthStore] Clerk sync called but not implemented');
      
      set({ isLoading: false, isAuthenticated: false });
      throw new Error('Clerk authentication is not implemented');
    } catch (error) {
      console.error('Failed to sync Clerk user:', error);
      set({ isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  /**
   * Handle Firebase user after Google OAuth
   */
  handleFirebaseUser: async (firebaseUser: any, idToken: string) => {
    try {
      set({ isLoading: true });
      console.log('[AuthStore] Processing Firebase user:', {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      });

      // Sync with backend using Firebase ID token
      const result = await authApi.googleLogin({
        idToken,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        photo: firebaseUser.photoURL,
      });

      console.log('[AuthStore] Backend response:', {
        user: result.user,
        hasAccessToken: !!result.accessToken,
        hasRefreshToken: !!result.refreshToken,
      });

      // Save tokens FIRST
      await saveTokens(result.accessToken, result.refreshToken);

      // Update state
      set({
        user: result.user,
        accessToken: result.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // Wait a bit to ensure tokens are fully persisted
      await new Promise<void>(resolve => setTimeout(resolve, 100));

      // Connect socket AFTER tokens are saved (non-blocking - don't fail auth if socket fails)
      try {
        await socketService.connect();
        console.log('[AuthStore] Socket connected successfully');
      } catch (socketError) {
        console.warn('[AuthStore] Socket connection failed (non-critical):', socketError);
        // Continue with auth flow even if socket fails
      }

      console.log('[AuthStore] Firebase user processed successfully', {
        userId: result.user.id,
        username: result.user.username,
        isProfileComplete: result.user.isProfileComplete,
      });
    } catch (error: any) {
      console.error('[AuthStore] Failed to process Firebase user:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        stack: error.stack,
      });
      set({ isLoading: false, isAuthenticated: false });
      throw error;
    }
  },
}));

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Update user's GPS location in background (non-blocking)
 */
const updateUserLocation = async () => {
  try {
    // Only import geolocation - Platform and PermissionsAndroid are already available
    const Geolocation = require('@react-native-community/geolocation');
    const { Platform, PermissionsAndroid } = require('react-native');
    
    // Request permission if needed
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (!granted) {
        console.log('[AuthStore] Location permission not granted, skipping location update');
        return;
      }
    }
    
    // Get current position
    Geolocation.default.getCurrentPosition(
      async (position: any) => {
        try {
          await eventApi.updateLocation(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy
          );
          console.log('[AuthStore] Location updated successfully');
        } catch (error) {
          console.warn('[AuthStore] Failed to update location:', error);
        }
      },
      (error: any) => {
        console.warn('[AuthStore] Failed to get current position:', error.message);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 } // 5 min cache
    );
  } catch (error) {
    console.warn('[AuthStore] Location update failed:', error);
  }
};

// Set up logout callback for API interceptor
setLogoutCallback(async () => {
  await useAuthStore.getState().logout();
});

// Set up token refresh callback for socket reconnection
setTokenRefreshCallback(async () => {
  await socketService.reconnectWithNewToken();
});

// Convenience selector hooks
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
