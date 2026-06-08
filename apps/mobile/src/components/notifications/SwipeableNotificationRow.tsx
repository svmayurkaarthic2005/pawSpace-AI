import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import { Notification } from '../../types';
import { NotificationRow } from './NotificationRow';
import { AINotificationRow } from './AINotificationRow';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SwipeableNotificationRowProps {
  notification: Notification;
  onPress: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SwipeableNotificationRow: React.FC<SwipeableNotificationRowProps> = ({
  notification,
  onPress,
  onMarkRead,
  onDelete,
}) => {
  const swipeRef = useRef<Swipeable>(null);

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    // Only show "Mark Read" action if notification is unread
    if (notification.isRead) {
      return null;
    }

    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-80, 0],
    });

    return (
      <Animated.View style={[styles.swipeLeft, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          style={styles.markReadAction}
          onPress={() => {
            onMarkRead();
            swipeRef.current?.close();
          }}
          activeOpacity={0.8}
        >
          <Icon name="check" color="#fff" size={18} />
          <Text style={styles.swipeActionText}>Read</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <Animated.View style={[styles.swipeRight, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => {
            onDelete();
            swipeRef.current?.close();
          }}
          activeOpacity={0.8}
        >
          <Icon name="trash-2" color="#fff" size={18} />
          <Text style={styles.swipeActionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      leftThreshold={40}
      rightThreshold={40}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
    >
      {notification.type === 'ai_suggestion' ? (
        <AINotificationRow notification={notification} onPress={onPress} />
      ) : (
        <NotificationRow notification={notification} onPress={onPress} />
      )}
    </Swipeable>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  swipeLeft: {
    height: '100%',
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
  },
  markReadAction: {
    backgroundColor: '#1D9E75',
    height: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 80,
  },
  swipeRight: {
    height: '100%',
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  deleteAction: {
    backgroundColor: '#C0392B',
    height: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 80,
  },
  swipeActionText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
});
