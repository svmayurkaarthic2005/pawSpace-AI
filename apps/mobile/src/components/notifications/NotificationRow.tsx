import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import { Notification, NotificationType } from '../../types';
import { NotificationText } from './NotificationText';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { followApi } from '../../services/post.service';
import Toast from 'react-native-toast-message';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationRowProps {
  notification: Notification;
  onPress: () => void;
}

interface IconConfig {
  icon: string;
  color: string;
  bg: string;
}

// ─── Icon Config ──────────────────────────────────────────────────────────────

const NOTIFICATION_ICON_CONFIG: Record<NotificationType, IconConfig> = {
  like: { icon: 'heart', color: '#EF4444', bg: 'rgba(239,68,68,0.2)' },
  comment: { icon: 'message-circle', color: '#7C3AED', bg: 'rgba(124,58,237,0.2)' },
  follow: { icon: 'user-plus', color: '#1D9E75', bg: 'rgba(29,158,117,0.2)' },
  follow_request: { icon: 'user-plus', color: '#F59E0B', bg: 'rgba(245,158,11,0.2)' },
  follow_accept: { icon: 'user-check', color: '#10B981', bg: 'rgba(16,185,129,0.2)' },
  event_rsvp: { icon: 'calendar', color: '#EF9F27', bg: 'rgba(239,159,39,0.2)' },
  chat: { icon: 'message-square', color: '#7C3AED', bg: 'rgba(124,58,237,0.2)' },
  community_post: { icon: 'users', color: '#378ADD', bg: 'rgba(55,138,221,0.2)' },
  ai_suggestion: { icon: 'zap', color: '#A78BFA', bg: 'rgba(167,139,250,0.2)' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const NotificationRow: React.FC<NotificationRowProps> = ({ notification, onPress }) => {
  const iconConfig = NOTIFICATION_ICON_CONFIG[notification.type] ?? NOTIFICATION_ICON_CONFIG.chat;
  const [requestState, setRequestState] = React.useState<'pending' | 'accepted' | 'rejected'>('pending');

  const handleAccept = async () => {
    if (!notification.sender?._id) return;
    try {
      await followApi.acceptRequest(notification.sender._id);
      setRequestState('accepted');
      Toast.show({ type: 'success', text1: 'Request accepted' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to accept request' });
    }
  };

  const handleReject = async () => {
    if (!notification.sender?._id) return;
    try {
      await followApi.rejectRequest(notification.sender._id);
      setRequestState('rejected');
      Toast.show({ type: 'success', text1: 'Request rejected' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to reject request' });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.row, !notification.isRead && styles.rowUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Avatar with type badge */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          <FastImage
            source={{
              uri: notification.sender?.avatar ?? 'https://pawspace.app/default-avatar.png',
            }}
            style={styles.avatar}
          />
          {/* Type badge */}
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: iconConfig.bg,
                borderColor: iconConfig.color + '40',
              },
            ]}
          >
            <Icon name={iconConfig.icon} color={iconConfig.color} size={10} />
          </View>
        </View>
      </View>

      {/* Text content */}
      <View style={styles.content}>
        <NotificationText notification={notification} />
        <Text style={styles.timeText}>{formatRelativeTime(notification.createdAt)}</Text>
      </View>

      {/* Right: entity thumbnail OR actions OR spacing */}
      {notification.type === 'follow_request' ? (
        <View style={styles.actionsContainer}>
          {requestState === 'pending' ? (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={handleAccept}>
                <Icon name="check" color="#10B981" size={16} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={handleReject}>
                <Icon name="x" color="#EF4444" size={16} />
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.actionHandledText}>
              {requestState === 'accepted' ? 'Accepted' : 'Rejected'}
            </Text>
          )}
        </View>
      ) : notification.entityImage ? (
        <TouchableOpacity onPress={onPress}>
          <FastImage source={{ uri: notification.entityImage }} style={styles.entityThumbnail} />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightSpace} />
      )}
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0D0D1A',
    gap: 12,
  },
  rowUnread: {
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  avatarSection: {
    flexShrink: 0,
  },
  avatarWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0D0D1A',
  },
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  timeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  entityThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    flexShrink: 0,
  },
  rightSpace: {
    width: 44,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  acceptButton: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  rejectButton: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  actionHandledText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
});
