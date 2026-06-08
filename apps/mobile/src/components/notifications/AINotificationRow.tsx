import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Notification } from '../../types';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AINotificationRowProps {
  notification: Notification;
  onPress: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AINotificationRow: React.FC<AINotificationRowProps> = ({ notification, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.aiRow, !notification.isRead && styles.aiRowUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Sparkle icon — no avatar */}
      <View style={styles.sparkleContainer}>
        <View style={styles.sparkleBg}>
          <Text style={styles.sparkleIcon}>✦</Text>
        </View>
      </View>

      {/* Text */}
      <View style={styles.aiContent}>
        <Text style={styles.aiTitle}>{notification.message}</Text>
        <Text style={styles.aiSub}>
          Based on your pets · {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>

      {/* Arrow right */}
      <View style={styles.aiArrow}>
        <Icon name="chevron-right" color="#A78BFA" size={18} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(124,58,237,0.06)',
    gap: 14,
  },
  aiRowUnread: {
    backgroundColor: 'rgba(124,58,237,0.12)',
  },
  sparkleContainer: {
    flexShrink: 0,
  },
  sparkleBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(124,58,237,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleIcon: {
    fontSize: 22,
    color: '#A78BFA',
  },
  aiContent: {
    flex: 1,
    minWidth: 0,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 3,
  },
  aiSub: {
    fontSize: 12,
    color: 'rgba(167,139,250,0.6)',
  },
  aiArrow: {
    flexShrink: 0,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
