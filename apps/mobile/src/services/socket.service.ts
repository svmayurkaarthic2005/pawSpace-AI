// Import polyfills first to ensure socket.io compatibility
import '../utils/polyfills';
import { io, Socket } from 'socket.io-client';
import * as Keychain from 'react-native-keychain';
import { STORAGE_KEYS, SOCKET_BASE_URL } from '../constants';

// ─── Event type definitions ───────────────────────────────────────────────────

export interface SerializedMessage {
  _id: string;
  chatId: string;
  sender: { _id: string; username: string; name: string; avatar?: string };
  content: { type: 'text' | 'image' | 'ai_suggestion'; text?: string; mediaUrl?: string };
  readBy: Array<{ user: string; readAt: string }>;
  isDeleted: boolean;
  createdAt: string;
  tempId?: string;
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

export interface SerializedNotification {
  _id: string;
  type: string;
  message: string;
  sender?: { _id: string; username: string; avatar?: string };
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  createdAt: string;
}

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

// ─── Typed event maps ─────────────────────────────────────────────────────────

interface ServerToClientEvents {
  'chat:message': (msg: SerializedMessage) => void;
  'chat:message_sent': (payload: { tempId: string; messageId: string; message: SerializedMessage }) => void;
  'chat:list_update': (payload: { chatId: string; lastMessage: any; unreadCount: number }) => void;
  'chat:typing': (payload: TypingPayload) => void;
  'chat:typing:stop': (payload: TypingPayload) => void;
  'chat:read_receipt': (payload: ReadReceiptPayload) => void;
  'chat:message:deleted': (payload: { chatId: string; messageId: string }) => void;
  'notification:new': (n: SerializedNotification) => void;
  'notification:read': (id: string) => void;
  'notification:count': (payload: { count: number }) => void;
  'notification:count_update': (payload: { count: number }) => void;
  'user:online': (payload: { userId: string; socketId: string }) => void;
  'user:offline': (payload: { userId: string; lastSeen: string }) => void;
  'error': (payload: { code: string; message: string }) => void;
}

interface ClientToServerEvents {
  'chat:join': (chatId: string) => void;
  'chat:leave': (chatId: string) => void;
  'chat:send': (payload: {
    chatId: string;
    content: { type: string; text?: string; mediaUrl?: string };
    tempId?: string;
  }) => void;
  'chat:typing:start': (chatId: string) => void;
  'chat:typing:stop': (chatId: string) => void;
  'chat:read': (payload: { chatId: string; messageId: string }) => void;
  'notification:read': (notificationId: string) => void;
  'presence:check': (
    userIds: string[],
    callback: (statuses: PresenceStatus[]) => void,
  ) => void;
}

// ─── SocketService singleton ──────────────────────────────────────────────────

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private stateListeners: Array<(state: ConnectionState) => void> = [];

  // ── Connection ─────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    const credentials = await Keychain.getGenericPassword({
      service: STORAGE_KEYS.ACCESS_TOKEN,
    });
    const token = credentials ? credentials.password : null;

    if (!token) {
      console.warn('[Socket] No token available, skipping connection');
      return;
    }

    console.log('[Socket] Attempting to connect to:', SOCKET_BASE_URL, {
      tokenPreview: token.substring(0, 20) + '...',
    });

    this.socket = io(SOCKET_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'], // Support both transports
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;

    this.attachCoreListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this.setConnectionState('disconnected');
  }

  async reconnectWithNewToken(): Promise<void> {
    console.log('[Socket] Reconnecting with new token...');
    
    // Get fresh token from keychain
    const credentials = await Keychain.getGenericPassword({
      service: STORAGE_KEYS.ACCESS_TOKEN,
    });
    
    if (!credentials) {
      console.warn('[Socket] No token available for reconnection');
      this.disconnect();
      return;
    }
    
    const freshToken = credentials.password;
    console.log('[Socket] Got fresh token, reconnecting...', {
      tokenPreview: freshToken.substring(0, 20) + '...',
    });
    
    // If socket exists, update auth and reconnect
    if (this.socket) {
      this.socket.auth = { token: freshToken };
      this.socket.disconnect();
      this.reconnectAttempts = 0; // Reset attempts with fresh token
      
      // Small delay before reconnecting
      await new Promise<void>(resolve => setTimeout(resolve, 500));
      this.socket.connect();
    } else {
      // No socket exists, do full connect
      await this.connect();
    }
  }

  private attachCoreListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      const socketId = this.socket?.id || 'unknown';
      console.log('[Socket] Connected:', socketId);
      this.reconnectAttempts = 0;
      this.setConnectionState('connected');
      
      // Note: Backend will emit 'notification:count' on connection
      // Listeners should be registered in app components before connection
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server forced disconnect — don't auto-reconnect
        this.setConnectionState('disconnected');
      } else {
        this.setConnectionState('reconnecting');
      }
    });

    this.socket.on('connect_error', async (err) => {
      console.error('[Socket] Connection error:', {
        message: err.message,
        description: err.message,
        attempt: this.reconnectAttempts + 1,
        maxAttempts: this.maxReconnectAttempts,
      });
      this.reconnectAttempts++;
      
      // Check if it's an auth error (token expired/invalid)
      if (err.message.includes('Invalid or expired token') || 
          err.message.includes('Authentication') ||
          err.message.includes('jwt expired') ||
          err.message.includes('invalid token')) {
        console.log('[Socket] Auth error detected, fetching fresh token and reconnecting...');
        
        try {
          // Get fresh token from keychain (may have been refreshed by API interceptor)
          const credentials = await Keychain.getGenericPassword({
            service: STORAGE_KEYS.ACCESS_TOKEN,
          });
          
          if (credentials && this.socket) {
            const freshToken = credentials.password;
            console.log('[Socket] Got fresh token, updating auth...');
            
            // Update socket auth with fresh token
            this.socket.auth = { token: freshToken };
            
            // Disconnect and let it auto-reconnect with new token
            this.socket.disconnect();
            
            // Reset reconnect attempts for fresh start
            this.reconnectAttempts = 0;
            
            // Trigger reconnection
            setTimeout(() => {
              if (this.socket) {
                this.socket.connect();
              }
            }, 1000);
            
            return; // Exit early, don't count this as a failed attempt
          } else {
            console.error('[Socket] No fresh token available, cannot reconnect');
          }
        } catch (tokenError) {
          console.error('[Socket] Failed to fetch fresh token:', tokenError);
        }
      }
      
      this.setConnectionState('reconnecting');

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[Socket] Max reconnect attempts reached, giving up');
        this.setConnectionState('disconnected');
        this.socket?.disconnect();
      }
    });

    this.socket.io.on('reconnect', (attempt) => {
      console.log('[Socket] Reconnected after', attempt, 'attempts');
      this.setConnectionState('connected');
    });

    this.socket.on('error', (payload) => {
      console.error('[Socket] Server error:', payload.code, payload.message);
    });
  }

  // ── State management ───────────────────────────────────────────────────────

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.stateListeners.forEach((cb) => cb(state));
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.socket?.connected === true;
  }

  onConnectionStateChange(cb: (state: ConnectionState) => void): () => void {
    this.stateListeners.push(cb);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== cb);
    };
  }

  // ── Typed emit ─────────────────────────────────────────────────────────────

  emit<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ): void {
    if (!this.socket?.connected) {
      console.warn(`[Socket] Cannot emit "${String(event)}" — not connected`);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.socket.emit as any)(event, ...args);
  }

  // ── Typed on/off ───────────────────────────────────────────────────────────

  on<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E],
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket?.on(event as any, handler as any);
  }

  off<E extends keyof ServerToClientEvents>(
    event: E,
    handler?: ServerToClientEvents[E],
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (handler) {
      this.socket?.off(event as any, handler as any);
    } else {
      this.socket?.off(event as any);
    }
  }

  // ── Chat helpers ───────────────────────────────────────────────────────────

  joinChat(chatId: string): void {
    this.emit('chat:join', chatId);
  }

  leaveChat(chatId: string): void {
    this.emit('chat:leave', chatId);
  }

  sendMessage(
    chatId: string,
    content: { type: string; text?: string; mediaUrl?: string },
    tempId?: string,
  ): void {
    this.emit('chat:send', { chatId, content, tempId });
  }

  startTyping(chatId: string): void {
    this.emit('chat:typing:start', chatId);
  }

  stopTyping(chatId: string): void {
    this.emit('chat:typing:stop', chatId);
  }

  markRead(chatId: string, messageId: string): void {
    this.emit('chat:read', { chatId, messageId });
  }

  // ── Presence helpers ───────────────────────────────────────────────────────

  checkPresence(userIds: string[]): Promise<PresenceStatus[]> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve(userIds.map((id) => ({ userId: id, isOnline: false })));
        return;
      }
      this.emit('presence:check', userIds, resolve);
    });
  }

  // ── Singleton getter ───────────────────────────────────────────────────────

  static getInstance(): SocketService {
    return socketService;
  }
}

export const socketService = new SocketService();

// Export a getInstance function for compatibility
export function getSocketServiceInstance(): SocketService {
  return socketService;
}
