// ─── App Constants ────────────────────────────────────────────────────────────

export const APP_NAME = 'PawSpace';
export const APP_VERSION = '1.0.0';

// ─── API ──────────────────────────────────────────────────────────────────────

// Note: Android emulator cannot access localhost on host machine
// Use 10.0.2.2 instead (special IP for Android emulator to reach host)
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:5000/api/v1'
  : 'https://api.pawspace.app/api/v1';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pawspace_access_token',
  REFRESH_TOKEN: 'pawspace_refresh_token',
  USER: 'pawspace_user',
  ONBOARDING_COMPLETE: 'pawspace_onboarding_complete',
} as const;

// ─── Socket Events ────────────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // Room management
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  
  // Chat events
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  CHAT_READ: 'chat:read',
  
  // Notification events
  NOTIFICATION: 'notification',
  
  // Location events
  LOCATION_UPDATE: 'location:update',
} as const;

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const QUERY_KEYS = {
  FEED: ['feed'],
  USER: (id: string) => ['user', id],
  PET: (id: string) => ['pet', id],
  POST: (id: string) => ['post', id],
  NOTIFICATIONS: ['notifications'],
  CONVERSATIONS: ['conversations'],
  EXPLORE: ['explore'],
  USER_PROFILE: ['userProfile'],
  MY_PETS: ['myPets'],
  USER_POSTS: ['userPosts'],
} as const;

// ─── Theme ────────────────────────────────────────────────────────────────────

export const COLORS = {
  primary: '#FF6B35',
  primaryLight: '#FF8C5A',
  primaryDark: '#E55A25',
  secondary: '#4ECDC4',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;
