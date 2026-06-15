import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Message } from '../../services/aiAssistant.service';

interface MessageBubbleProps {
  message: Message;
  onReaction?: (messageId: string, reaction: 'up' | 'down') => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onReaction }) => {
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    if (message.isStreaming) {
      cursorOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 600, easing: Easing.ease }),
          withTiming(1, { duration: 600, easing: Easing.ease })
        ),
        -1,
        false
      );
    } else {
      cursorOpacity.value = 0;
    }
  }, [message.isStreaming]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const renderContent = () => {
    const content = message.content;
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Check for bullet points (*, -, •)
      const isBullet = /^\\s*[\\*\\-\\•]\\s/.test(line);
      const lineContent = isBullet ? line.replace(/^\\s*[\\*\\-\\•]\\s/, '') : line;
      
      // Handle bold text **text**
      const parts = lineContent.split(/(\\**.*?\\**)/g);
      
      return (
        <View key={index} style={[styles.line, isBullet && styles.bulletLine]}>
          {isBullet && <Text style={styles.bullet}>•</Text>}
          <View style={isBullet ? styles.bulletTextContainer : undefined}>
            <Text style={styles.aiText}>
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <Text key={partIndex} style={styles.boldText}>
                      {part.slice(2, -2)}
                    </Text>
                  );
                }
                return part;
              })}
              {index === lines.length - 1 && message.isStreaming && (
                <Animated.Text style={[styles.cursor, cursorStyle]}>|</Animated.Text>
              )}
            </Text>
          </View>
        </View>
      );
    });
  };

  if (message.role === 'user') {
    return (
      <View style={styles.userContainer}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiContainer}>
      <View style={styles.aiWrapper}>
        {/* Sparkle badge */}
        <View style={styles.sparkleBadge}>
          <Icon name="sparkles" size={10} color="#FFFFFF" />
        </View>
        
        {/* AI bubble */}
        <View style={styles.aiBubble}>
          {message.content ? (
            renderContent()
          ) : (
            <Text style={styles.aiText}>Thinking...</Text>
          )}
        </View>
      </View>

      {/* Reaction row - only show when message is complete */}
      {!message.isStreaming && message.content && (
        <View style={styles.reactionRow}>
          <TouchableOpacity
            style={styles.reactionBtn}
            onPress={() => onReaction?.(message.id, 'up')}
          >
            <Icon name="thumbs-up-outline" size={14} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reactionBtn}
            onPress={() => onReaction?.(message.id, 'down')}
          >
            <Icon name="thumbs-down-outline" size={14} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  userContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
  },
  aiContainer: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    marginTop: 8,
    marginBottom: 4,
  },
  aiWrapper: {
    position: 'relative',
  },
  sparkleBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#0D0D1A',
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  line: {
    marginBottom: 6,
  },
  bulletLine: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  bulletTextContainer: {
    flex: 1,
  },
  aiText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
  },
  bullet: {
    fontSize: 15,
    color: '#FFFFFF',
    marginRight: 8,
    marginTop: 0,
  },
  cursor: {
    fontSize: 15,
    color: '#A78BFA',
    marginLeft: 2,
  },
  reactionRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
    marginLeft: 4,
  },
  reactionBtn: {
    padding: 6,
  },
});

export default memo(MessageBubble);
