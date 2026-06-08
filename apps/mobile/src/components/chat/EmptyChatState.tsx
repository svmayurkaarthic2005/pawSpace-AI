import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface EmptyChatStateProps {
  onStart: () => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ onStart }) => {
  return (
    <View style={styles.empty}>
      {/* Chat bubble illustration */}
      <View style={styles.bubbleIllustration}>
        <View style={styles.bubbleLarge} />
        <View style={styles.bubbleSmall} />
        <View style={styles.bubbleDots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>
      </View>

      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySub}>Start a conversation with other pet owners</Text>

      <TouchableOpacity style={styles.startBtn} onPress={onStart}>
        <Icon name="plus" color="#fff" size={16} />
        <Text style={styles.startBtnText}>Start a conversation</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  bubbleIllustration: {
    width: 100,
    height: 80,
    position: 'relative',
    marginBottom: 24,
  },
  bubbleLarge: {
    width: 80,
    height: 56,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.4)',
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  bubbleSmall: {
    width: 44,
    height: 32,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.25)',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  bubbleDots: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(124,58,237,0.4)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  startBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
});
