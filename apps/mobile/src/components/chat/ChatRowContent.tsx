import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import { formatRelativeTime } from '../../utils/formatTime';

interface ChatRowContentProps {
  chat: any;
  currentUserId?: string;
  onPress: () => void;
}

export const ChatRowContent: React.FC<ChatRowContentProps> = React.memo(
  ({ chat, currentUserId, onPress }) => {
    const isUnread = (chat.unreadCount ?? 0) > 0;
    const isMuted = chat.isMuted;

    const getPreviewText = () => {
      if (!chat.lastMessage) return 'Start a conversation';

      const { content, sender } = chat.lastMessage;
      const isOwn = sender?._id === currentUserId;
      const prefix = isOwn ? 'You: ' : '';

      if (content.type === 'image') return '📷 Photo';
      if (content.type === 'ai_suggestion') return '✦ AI suggestion';
      return prefix + (content.text || '');
    };

    return (
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <FastImage
            source={{ uri: chat.otherUser?.avatar }}
            style={styles.avatar}
          />
          {chat.isOnline && !isMuted && <View style={styles.onlineDot} />}
          {isMuted && (
            <View style={styles.mutedBadge}>
              <Icon name="bell-off" color="#fff" size={9} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text
              style={[styles.username, isUnread && styles.usernameUnread]}
              numberOfLines={1}
            >
              {chat.otherUser?.name || chat.otherUser?.username}
            </Text>
            <Text style={styles.timestamp}>
              {formatRelativeTime(chat.lastMessageAt)}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <Text
              style={[styles.preview, isUnread && styles.previewUnread]}
              numberOfLines={1}
            >
              {getPreviewText()}
            </Text>
            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 72,
    backgroundColor: '#0D0D1A',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#1D9E75',
    borderWidth: 2,
    borderColor: '#0D0D1A',
  },
  mutedBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0D0D1A',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
    marginRight: 8,
  },
  usernameUnread: {
    fontWeight: '600',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    flex: 1,
    marginRight: 8,
  },
  previewUnread: {
    color: 'rgba(255,255,255,0.6)',
  },
  unreadBadge: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
});
