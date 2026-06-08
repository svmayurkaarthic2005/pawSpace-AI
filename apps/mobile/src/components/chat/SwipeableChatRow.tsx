import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import { ChatRowContent } from './ChatRowContent';

interface SwipeableChatRowProps {
  chat: any;
  currentUserId?: string;
  onPress: () => void;
  onMute: () => void;
  onDelete: () => void;
}

export const SwipeableChatRow: React.FC<SwipeableChatRowProps> = ({
  chat,
  currentUserId,
  onPress,
  onMute,
  onDelete,
}) => {
  const swipeableRef = useRef<Swipeable>(null);

  const confirmDelete = () => {
    Alert.alert(
      'Delete conversation',
      'This will delete the conversation for you only.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete();
            swipeableRef.current?.close();
          },
        },
      ],
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const muteTranslate = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [160, 0],
    });

    const deleteTranslate = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <View style={styles.actionsContainer}>
        <Animated.View style={{ transform: [{ translateX: muteTranslate }] }}>
          <TouchableOpacity
            style={styles.swipeMute}
            onPress={() => {
              onMute();
              swipeableRef.current?.close();
            }}
          >
            <Icon name="bell-off" color="#fff" size={18} />
            <Text style={styles.swipeActionText}>Mute</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ translateX: deleteTranslate }] }}>
          <TouchableOpacity style={styles.swipeDelete} onPress={confirmDelete}>
            <Icon name="trash" color="#fff" size={18} />
            <Text style={styles.swipeActionText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      friction={2}
      overshootRight={false}
    >
      <ChatRowContent chat={chat} currentUserId={currentUserId} onPress={onPress} />
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  swipeMute: {
    backgroundColor: '#B87A17',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
    justifyContent: 'center',
  },
  swipeDelete: {
    backgroundColor: '#C0392B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
    justifyContent: 'center',
  },
  swipeActionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
});
