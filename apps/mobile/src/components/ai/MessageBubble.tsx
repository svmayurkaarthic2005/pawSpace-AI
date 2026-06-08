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
      // Handle bold text **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      
      return (
        <View key={index} style={styles.line}>
          {parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <Text key={partIndex} style={[styles.aiText, styles.boldText]}>
                  {part.slice(2, -2)}
                </Text>
              );
            }
            
            // Handle bullet points
            if (part.startsWith('• ')) {
              return (
                <View key={partIndex} style={styles.bulletContainer}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.aiText}>{part.slice(2)}</Text>
                </View>
              );
            }
            
            return part ? (
              <Text key={partIndex} style={styles.aiText}>
                {part}
              </Text>
            ) : null;
          })}
          {index === lines.length - 1 && message.isStreaming && (
            <Animated.Text style={[styles.cursor, cursorStyle]}>|</Animated.Text>
          )}
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
    marginTop: 6,
    maxWidth: '72%',
  },
  userBubble: {
    backgroundColor: '#7C3AED',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 10,
    paddingHorizontal: 14,
  },
  userText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  aiContainer: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    marginTop: 6,
  },
  aiWrapper: {
    position: 'relative',
  },
  sparkleBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 12,
    paddingHorizontal: 14,
  },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  aiText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
  },
  bulletContainer: {
    flexDirection: 'row',
    marginLeft: 8,
    flex: 1,
  },
  bullet: {
    fontSize: 15,
    color: '#FFFFFF',
    marginRight: 6,
  },
  cursor: {
    fontSize: 15,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  reactionRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  reactionBtn: {
    padding: 4,
  },
});

export default memo(MessageBubble);
