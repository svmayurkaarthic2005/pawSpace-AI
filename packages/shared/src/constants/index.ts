// ─── API ──────────────────────────────────────────────────────────────────────

export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

// ─── Pagination ───────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Media ────────────────────────────────────────────────────────────────────

export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_VIDEO_SIZE_MB = 100;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const PASSWORD_MIN_LENGTH = 8;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const BIO_MAX_LENGTH = 500;
export const CAPTION_MAX_LENGTH = 2200;

// ─── Pet ──────────────────────────────────────────────────────────────────────

export const PET_SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other'] as const;
export const MAX_PETS_PER_USER = 20;
export const MAX_PHOTOS_PER_PET = 50;

// ─── Socket Events ────────────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',

  // Messaging
  NEW_MESSAGE: 'new_message',
  MESSAGE_READ: 'message_read',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',

  // Notifications
  NEW_NOTIFICATION: 'new_notification',

  // Feed
  NEW_POST: 'new_post',
  POST_LIKED: 'post_liked',
  POST_COMMENTED: 'post_commented',
} as const;

// ─── Cache TTLs (seconds) ─────────────────────────────────────────────────────

export const CACHE_TTL = {
  USER_PROFILE: 60 * 5,       // 5 minutes
  PET_PROFILE: 60 * 5,        // 5 minutes
  FEED: 60 * 2,               // 2 minutes
  TRENDING_TAGS: 60 * 30,     // 30 minutes
  AI_RESPONSE: 60 * 60,       // 1 hour
} as const;
