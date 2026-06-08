import { Platform } from 'react-native';
import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FCMNotificationType =
  | 'new_message'
  | 'new_like'
  | 'new_comment'
  | 'new_follower'
  | 'event_reminder'
  | 'ai_suggestion';

export interface FCMNotificationData {
  type: FCMNotificationType;
  chatId?: string;
  postId?: string;
  eventId?: string;
  userId?: string;
}

// ─── Navigation mapping ───────────────────────────────────────────────────────

export const getNavigationFromNotification = (
  data: FCMNotificationData,
): { screen: string; params?: Record<string, string> } | null => {
  switch (data.type) {
    case 'new_message':
      return data.chatId ? { screen: 'ChatRoom', params: { chatId: data.chatId } } : null;
    case 'new_like':
    case 'new_comment':
      return data.postId ? { screen: 'PostDetail', params: { postId: data.postId } } : null;
    case 'new_follower':
      return data.userId ? { screen: 'Profile', params: { userId: data.userId } } : null;
    case 'event_reminder':
      return data.eventId ? { screen: 'EventDetail', params: { eventId: data.eventId } } : null;
    case 'ai_suggestion':
      return { screen: 'PetAssistant' };
    default:
      return null;
  }
};

// ─── Notification Service ─────────────────────────────────────────────────────

class NotificationService {
  private initialized = false;

  /**
   * Initialize FCM — request permission, get token, register handlers.
   * Call this after the user is authenticated.
   */
  async initialize(
    onNavigate: (screen: string, params?: Record<string, string>) => void,
    onForegroundMessage: (title: string, body: string) => void,
  ): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamic import to avoid crashing if @react-native-firebase/messaging is not installed
      const messagingModule = await import('@react-native-firebase/messaging');
      const messaging = messagingModule.default;

      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('[FCM] Permission not granted');
        return;
      }

      // Get and register token
      const token = await messaging().getToken();
      if (token) {
        await this.registerToken(token);
      }

      // Token refresh
      messaging().onTokenRefresh(async (newToken) => {
        await this.registerToken(newToken);
      });

      // Foreground messages → show in-app toast
      messaging().onMessage(async (remoteMessage) => {
        const title = remoteMessage.notification?.title ?? 'PawSpace';
        const body = remoteMessage.notification?.body ?? '';
        onForegroundMessage(title, body);
      });

      // Background tap → navigate
      messaging().onNotificationOpenedApp((remoteMessage) => {
        const data = remoteMessage.data as FCMNotificationData | undefined;
        if (data) {
          const nav = getNavigationFromNotification(data);
          if (nav) onNavigate(nav.screen, nav.params);
        }
      });

      // Killed state → handle on app start
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        const data = initialNotification.data as FCMNotificationData | undefined;
        if (data) {
          // Delay navigation slightly to let the navigator mount
          setTimeout(() => {
            const nav = getNavigationFromNotification(data);
            if (nav) onNavigate(nav.screen, nav.params);
          }, 1000);
        }
      }

      this.initialized = true;
      console.log('[FCM] Notification service initialized');
    } catch (err) {
      // @react-native-firebase/messaging may not be installed in dev
      console.warn('[FCM] Could not initialize:', (err as Error).message);
    }
  }

  /**
   * POST the FCM token to the backend.
   */
  private async registerToken(token: string): Promise<void> {
    try {
      await api.post('/users/fcm-token', { token });
      console.log('[FCM] Token registered');
    } catch (err) {
      console.error('[FCM] Token registration failed:', (err as Error).message);
    }
  }
}

export const notificationService = new NotificationService();
