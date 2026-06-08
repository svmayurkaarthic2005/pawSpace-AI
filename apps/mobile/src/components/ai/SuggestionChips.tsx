import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface SuggestionChipsProps {
  suggestions: string[];
  onPress: (suggestion: string) => void;
  style?: 'outline' | 'filled';
}

const SuggestionChip: React.FC<{
  text: string;
  onPress: () => void;
  style?: 'outline' | 'filled';
}> = ({ text, onPress, style = 'outline' }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.chip,
          style === 'filled' && styles.chipFilled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.chipText,
            style === 'filled' && styles.chipTextFilled,
          ]}
          numberOfLines={2}
        >
          {text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onPress,
  style = 'outline',
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {suggestions.map((suggestion, index) => (
        <SuggestionChip
          key={index}
          text={suggestion}
          onPress={() => onPress(suggestion)}
          style={style}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.5)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  chipFilled: {
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  chipText: {
    fontSize: 13,
    color: '#A78BFA',
    fontWeight: '500',
  },
  chipTextFilled: {
    color: '#A78BFA',
  },
});

export default SuggestionChips;
