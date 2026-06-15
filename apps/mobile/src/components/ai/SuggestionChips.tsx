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
        <View key={index} style={index > 0 && styles.chipWrapper}>
          <SuggestionChip
            text={suggestion}
            onPress={() => onPress(suggestion)}
            style={style}
          />
        </View>
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
    paddingVertical: 10,
    paddingRight: 32,
  },
  chipWrapper: {
    marginLeft: 10,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  chipFilled: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: 'rgba(124,58,237,0.7)',
  },
  chipText: {
    fontSize: 14,
    color: '#A78BFA',
    fontWeight: '600',
  },
  chipTextFilled: {
    color: '#C4B5FD',
  },
});

export default SuggestionChips;
