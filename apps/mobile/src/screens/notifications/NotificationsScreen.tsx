import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import { Notification, SerializedNotification } from '../../types';
import api from '../../services/api';
import { socketService } from '../../services/socket.service';
import { useNotificationStore } from '../../store/notificationStore';
import { NotificationsHeader } from '../../components/notifications/NotificationsHeader';
import { NotificationTabs } from '../../components/notifications/NotificationTabs';
import { NotificationSectionHeader } from '../../components/notifications/NotificationSectionHeader';
import { SwipeableNotificationRow } from '../../components/notifications/SwipeableNotificationRow';
import { NotificationsEmptyState } from '../../components/notifications/NotificationsEmptyState';
import { NotificationSkeleton } from '../../components/notifications/NotificationSkeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationSection = {
  title: 'New' | 'Today' | 'This week' | 'Earlier';
  data: Notification[];
};

interface NotificationsResponse {
  notifications: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

const groupIntoSections = (notifications: Notification[]): NotificationSection[] => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const newItems = notifications.filter(
    (n) => !n.isRead && new Date(n.createdAt) >= oneHourAgo,
  );
  const todayItems = notifications.filter((n) => {
    const d = new Date(n.createdAt);
    return d >= startOfToday && !newItems.includes(n);
  });
  const weekItems = notifications.filter((n) => {
    const d = new Date(n.createdAt);
    return d >= startOfWeek && d < startOfToday;
  });
  const earlierItems = notifications.filter((n) => new Date(n.createdAt) < startOfWeek);

  const sections: NotificationSection[] = [];
  if (newItems.length > 0) sections.push({ title: 'New', data: newItems });
  if (todayItems.length > 0) sections.push({ title: 'Today', data: todayItems });
  if (weekItems.length > 0) sections.push({ title: 'This week', data: weekItems });
  if (earlierItems.length > 0) sections.push({ title: 'Earlier', data: earlierItems });

  return sections;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = SCREEN_WIDTH / 2;

// ─── Component ────────────────────────────────────────────────────────────────

export const NotificationsScreen: React.FC<any> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const notificationStore = useNotificationStore();

  const [activeTab, setActiveTab] = useState<'all' | 'activity'>('all');
  const [tabIndicatorAnim] = useState(new Animated.Value(0));
  const [sections, setSections] = useState<NotificationSection[]>([]);

  // ─── Fetch Notifications ──────────────────────────────────────────────────

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useInfiniteQuery<NotificationsResponse>({
    queryKey: ['notifications', activeTab],
    queryFn: ({ pageParam }) =>
      api
        .get('/notifications', {
          params: { tab: activeTab, cursor: pageParam, limit: 30 },
        })
        .then((r) => r.data.data),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    staleTime: 30_000,
    initialPageParam: undefined,
  });

  const allNotifications = React.useMemo(
    () => data?.pages.flatMap((p) => p.notifications) ?? [],
    [data?.pages]
  );

  // ─── Group Notifications Into Sections ────────────────────────────────────

  useEffect(() => {
    setSections(groupIntoSections(allNotifications));
  }, [allNotifications]);

  // ─── Tab Switch Animation ─────────────────────────────────────────────────

  const switchTab = (tab: 'all' | 'activity') => {
    setActiveTab(tab);
    Animated.spring(tabIndicatorAnim, {
      toValue: tab === 'all' ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  };

  const tabIndicatorLeft = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, TAB_WIDTH + 16],
  });

  // ─── Mark All Read ────────────────────────────────────────────────────────

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/mark-read'),
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications', activeTab] });
      const previousData = queryClient.getQueryData(['notifications', activeTab]);

      queryClient.setQueryData(['notifications', activeTab], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: NotificationsResponse) => ({
            ...page,
            notifications: page.notifications.map((n: Notification) => ({ ...n, isRead: true })),
          })),
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      notificationStore.resetUnreadCount();
      Toast.show({
        type: 'success',
        text1: 'All notifications marked as read',
        position: 'bottom',
        visibilityTime: 2000,
      });
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', activeTab], context.previousData);
      }
      Toast.show({
        type: 'error',
        text1: 'Failed to mark notifications as read',
        position: 'bottom',
      });
    },
  });

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  // ─── Mark One Read ────────────────────────────────────────────────────────

  const markOneReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', activeTab] });
      const previousData = queryClient.getQueryData(['notifications', activeTab]);

      queryClient.setQueryData(['notifications', activeTab], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: NotificationsResponse) => ({
            ...page,
            notifications: page.notifications.map((n: Notification) =>
              n._id === id ? { ...n, isRead: true } : n,
            ),
          })),
        };
      });

      // Don't update count here - socket will send the authoritative count
      // This prevents double-decrement race conditions

      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', activeTab], context.previousData);
      }
    },
  });

  const handleMarkOneRead = (id: string) => {
    markOneReadMutation.mutate(id);
  };

  // ─── Delete Notification ──────────────────────────────────────────────────

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', activeTab] });
      const previousData = queryClient.getQueryData(['notifications', activeTab]);

      queryClient.setQueryData(['notifications', activeTab], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: NotificationsResponse) => ({
            ...page,
            notifications: page.notifications.filter((n: Notification) => n._id !== id),
          })),
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Notification removed',
        position: 'bottom',
        visibilityTime: 2000,
      });
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', activeTab], context.previousData);
      }
      Toast.show({
        type: 'error',
        text1: 'Failed to remove notification',
        position: 'bottom',
      });
    },
  });

  const handleDeleteNotification = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  // ─── Notification Tap Handler ─────────────────────────────────────────────

  const handleNotificationTap = async (notification: Notification) => {
    // Mark as read (only call mutation, not direct API)
    if (!notification.isRead) {
      handleMarkOneRead(notification._id);
    }

    // Navigate based on type
    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.entityId) {
          navigation.navigate('PostDetail', { postId: notification.entityId });
        }
        break;
      case 'follow':
        if (notification.sender?._id) {
          navigation.navigate('Profile', { userId: notification.sender._id });
        }
        break;
      case 'event_rsvp':
        if (notification.entityId) {
          navigation.navigate('EventDetail', { eventId: notification.entityId });
        }
        break;
      case 'chat':
        if (notification.sender?._id) {
          navigation.navigate('ChatRoom', {
            recipientId: notification.sender._id,
            recipientName: notification.sender.username,
          });
        }
        break;
      case 'ai_suggestion':
        navigation.navigate('Explore', { initialQuery: notification.entityName + ' events' });
        break;
      case 'community_post':
        if (notification.entityId) {
          navigation.navigate('CommunityDetail', { communityId: notification.entityId });
        }
        break;
    }
  };

  // ─── Mark All as Read on Focus (after delay) ──────────────────────────────
  // Removed: This auto-mark-all creates race conditions and unexpected behavior
  // Users should explicitly mark all as read using the button in the header

  // ─── Socket.IO Real-time Updates ──────────────────────────────────────────

  useEffect(() => {
    const handleNewNotification = (notif: SerializedNotification) => {
      // Convert SerializedNotification to Notification format
      const notification: Notification = {
        _id: notif._id,
        recipient: '', // Will be filled by backend context
        sender: notif.sender,
        type: notif.type as any,
        entityId: notif.entityId,
        entityType: notif.entityType,
        message: notif.message,
        isRead: notif.isRead,
        tab: 'all', // Default tab
        createdAt: notif.createdAt,
      };

      // Prepend to React Query cache for ALL tabs (not just active)
      // This prevents notifications from disappearing when switching tabs
      queryClient.setQueryData(['notifications', 'all'], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) {
          // Initialize with first page if cache doesn't exist
          return {
            pages: [{
              notifications: [notification],
              nextCursor: null,
              hasMore: false,
              unreadCount: 1,
            }],
            pageParams: [undefined],
          };
        }
        return {
          ...old,
          pages: [
            {
              ...old.pages[0],
              notifications: [notification, ...old.pages[0].notifications],
            },
            ...old.pages.slice(1),
          ],
        };
      });

      // Also add to activity tab if it's an activity notification
      const activityTypes = ['like', 'comment', 'follow'];
      if (activityTypes.includes(notif.type)) {
        queryClient.setQueryData(['notifications', 'activity'], (old: any) => {
          if (!old || !old.pages || old.pages.length === 0) {
            return {
              pages: [{
                notifications: [notification],
                nextCursor: null,
                hasMore: false,
                unreadCount: 1,
              }],
              pageParams: [undefined],
            };
          }
          return {
            ...old,
            pages: [
              {
                ...old.pages[0],
                notifications: [notification, ...old.pages[0].notifications],
              },
              ...old.pages.slice(1),
            ],
          };
        });
      }

      // Don't increment count here - socket will send count_update
      // This prevents race conditions with the authoritative count from backend

      // Haptic feedback
      ReactNativeHapticFeedback.trigger('notificationSuccess');
    };

    const handleCountUpdate = ({ count }: { count: number }) => {
      notificationStore.setUnreadCount(count);
    };

    socketService.on('notification:new', handleNewNotification);
    socketService.on('notification:count_update', handleCountUpdate);

    return () => {
      socketService.off('notification:new', handleNewNotification);
      socketService.off('notification:count_update', handleCountUpdate);
    };
  }, [queryClient, notificationStore]); // Removed activeTab dependency

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <NotificationsHeader onMarkAllRead={handleMarkAllRead} />

      <NotificationTabs
        activeTab={activeTab}
        onSwitch={switchTab}
        tabIndicatorLeft={tabIndicatorLeft}
      />

      {isLoading ? (
        <NotificationSkeleton />
      ) : allNotifications.length === 0 ? (
        <NotificationsEmptyState />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <SwipeableNotificationRow
              notification={item}
              onPress={() => handleNotificationTap(item)}
              onMarkRead={() => handleMarkOneRead(item._id)}
              onDelete={() => handleDeleteNotification(item._id)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <NotificationSectionHeader title={section.title} />
          )}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#7C3AED"
              colors={['#7C3AED']}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#7C3AED" style={{ padding: 20 }} />
            ) : null
          }
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
});

export default NotificationsScreen;
