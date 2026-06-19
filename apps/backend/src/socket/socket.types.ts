import { Socket } from 'socket.io';
import { JwtPayload } from '../middleware/auth';

// ─── Augment Socket with authenticated user ───────────────────────────────────

export interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
}

// ─── Client → Server events ───────────────────────────────────────────────────

export interface ClientToServerEvents {
  // Chat
  'chat:join': (chatId: string) => void;
  'chat:leave': (chatId: string) => void;
  'chat:send': (payload: SendMessagePayload) => void;
  'chat:typing:start': (chatId: string) => void;
  'chat:typing:stop': (chatId: string) => void;
  'chat:read': (payload: ReadPayload) => void;

  // Notifications
  'notification:read': (notificationId: string) => void;

  // Presence
  'presence:check': (userIds: string[], callback: (statuses: PresenceStatus[]) => void) => void;

  // Communities
  'community:join': (communityId: string) => void;
  'community:leave': (communityId: string) => void;
  'community:typing': (payload: { communityId: string; isTyping: boolean }) => void;

  // Video Calls
  'call:invite': (payload: CallInvitePayload) => void;
  'call:accept': (payload: { channelName: string; toUserId: string }) => void;
  'call:reject': (payload: { channelName: string; toUserId: string; reason?: string }) => void;
  'call:end': (payload: { channelName: string; toUserId: string }) => void;
}

// ─── Server → Client events ───────────────────────────────────────────────────

export interface ServerToClientEvents {
  // Chat
  'chat:message': (message: SerializedMessage) => void;
  'chat:list_update': (payload: { chatId: string; lastMessage: any; unreadCount: number }) => void;
  'chat:typing': (payload: TypingPayload) => void;
  'chat:typing:stop': (payload: TypingPayload) => void;
  'chat:read_receipt': (payload: ReadReceiptPayload) => void;
  'chat:message:deleted': (payload: { chatId: string; messageId: string }) => void;

  // Notifications
  'notification:new': (notification: SerializedNotification) => void;
  'notification:read': (notificationId: string) => void;
  'notification:count_update': (payload: { count: number }) => void;

  // Presence
  'user:online': (payload: { userId: string; socketId: string }) => void;
  'user:offline': (payload: { userId: string; lastSeen: string }) => void;

  // Communities
  'community:new_post': (payload: { post: any; communityId: string }) => void;
  'community:member_joined': (payload: { user: string; communityId: string }) => void;
  'community:user_typing': (payload: { userId: string; communityId: string; isTyping: boolean }) => void;

  // Video Calls
  'call:invite': (payload: CallInvitePayload) => void;
  'call:accepted': (payload: { channelName: string; byUserId: string }) => void;
  'call:rejected': (payload: { channelName: string; byUserId: string; reason?: string }) => void;
  'call:ended': (payload: { channelName: string; byUserId: string }) => void;

  // Errors
  'error': (payload: { code: string; message: string }) => void;
}

// ─── Inter-server events (for scaling) ───────────────────────────────────────

export interface InterServerEvents {
  ping: () => void;
}

// ─── Socket data ─────────────────────────────────────────────────────────────

export interface SocketData {
  userId: string;
  email: string;
}

// ─── Payload types ────────────────────────────────────────────────────────────

export interface SendMessagePayload {
  chatId: string;
  content: {
    type: 'text' | 'image' | 'ai_suggestion';
    text?: string;
    mediaUrl?: string;
    publicId?: string;
  };
  tempId?: string; // client-generated temp ID for optimistic UI dedup
}

export interface ReadPayload {
  chatId: string;
  messageId: string; // mark all messages up to this one as read
}

export interface TypingPayload {
  chatId: string;
  userId: string;
  username: string;
}

export interface ReadReceiptPayload {
  chatId: string;
  messageId: string;
  userId: string;
  readAt: string;
}

export interface PresenceStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

// ─── Serialized shapes sent over the wire ────────────────────────────────────

export interface SerializedMessage {
  _id: string;
  chatId: string;
  sender: {
    _id: string;
    username: string;
    name: string;
    avatar?: string;
  };
  content: {
    type: 'text' | 'image' | 'ai_suggestion';
    text?: string;
    mediaUrl?: string;
  };
  readBy: Array<{ user: string; readAt: string }>;
  isDeleted: boolean;
  createdAt: string;
  tempId?: string;
}

export interface SerializedNotification {
  _id: string;
  type: string;
  message: string;
  sender?: {
    _id: string;
    username: string;
    avatar?: string;
  };
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Call Payloads ────────────────────────────────────────────────────────────

export interface CallInvitePayload {
  fromUserId?: string;   // set by server when forwarding
  toUserId: string;      // set by client when sending
  channelName: string;
  callerName: string;
  callerAvatar?: string;
}
