import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import { Notification, NotificationType } from '../../types';
import { NotificationText } from './NotificationText';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

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
  event_rsvp: { icon: 'calendar', color: '#EF9F27', bg: 'rgba(239,159,39,0.2)' },
  chat: { icon: 'message-square', color: '#7C3AED', bg: 'rgba(124,58,237,0.2)' },
  community_post: { icon: 'users', color: '#378ADD', bg: 'rgba(55,138,221,0.2)' },
  ai_suggestion: { icon: 'zap', color: '#A78BFA', bg: 'rgba(167,139,250,0.2)' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const NotificationRow: React.FC<NotificationRowProps> = ({ notification, onPress }) => {
  const iconConfig = NOTIFICATION_ICON_CONFIG[notification.type] ?? NOTIFICATION_ICON_CONFIG.chat;

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

      {/* Right: entity thumbnail OR spacing */}
      {notification.entityImage ? (
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
});
