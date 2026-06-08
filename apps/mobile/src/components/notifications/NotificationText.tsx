import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Notification } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationTextProps {
  notification: Notification;
}

interface NotificationTextParts {
  bold: string;
  rest: string;
  suffix: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const getNotificationText = (notification: Notification): NotificationTextParts => {
  const username = notification.sender?.username ?? 'Someone';

  switch (notification.type) {
    case 'like':
      return {
        bold: username,
        rest: ' liked your post',
        suffix: notification.entityName ? ` about ${notification.entityName}` : '',
      };
    case 'comment':
      return {
        bold: username,
        rest: ' commented: ',
        suffix: notification.entityName ? `"${notification.entityName}"` : '',
      };
    case 'follow':
      return {
        bold: username,
        rest: ' started following you',
        suffix: '',
      };
    case 'event_rsvp':
      return {
        bold: username,
        rest: ' is going to ',
        suffix: notification.entityName ?? 'your event',
      };
    case 'chat':
      return {
        bold: username,
        rest: ' sent you a message',
        suffix: '',
      };
    case 'community_post':
      return {
        bold: username,
        rest: ' posted in ',
        suffix: notification.entityName ?? 'a community',
      };
    default:
      return {
        bold: username,
        rest: notification.message,
        suffix: '',
      };
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

export const NotificationText: React.FC<NotificationTextProps> = ({ notification }) => {
  const { bold, rest, suffix } = getNotificationText(notification);

  return (
    <Text style={styles.text} numberOfLines={2}>
      <Text style={styles.bold}>{bold}</Text>
      <Text style={styles.normal}>{rest}</Text>
      {suffix ? <Text style={styles.muted}>{suffix}</Text> : null}
    </Text>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: '#fff',
  },
  normal: {
    fontWeight: '400',
    color: 'rgba(255,255,255,0.75)',
  },
  muted: {
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
  },
});
