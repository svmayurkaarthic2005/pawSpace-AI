import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import SuggestionChips from './SuggestionChips';

interface EmptyAIStateProps {
  petName?: string;
  onQuickAction: (action: string) => void;
}

const QUICK_ACTIONS = [
  { id: 'food', label: 'Food advice' },
  { id: 'grooming', label: 'Grooming tips' },
  { id: 'health', label: 'Health check' },
  { id: 'training', label: 'Training help' },
  { id: 'breed', label: 'Breed info' },
];

const EmptyAIState: React.FC<EmptyAIStateProps> = ({ petName, onQuickAction }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2000, easing: Easing.ease }),
        withTiming(1, { duration: 2000, easing: Easing.ease })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Geometric sparkle illustration */}
      <View style={styles.illustration}>
        {/* Small diamonds around center */}
        <View style={[styles.diamond, styles.diamondTopLeft]} />
        <View style={[styles.diamond, styles.diamondTopRight]} />
        <View style={[styles.diamond, styles.diamondBottomLeft]} />
        <View style={[styles.diamond, styles.diamondBottomRight]} />
        
        {/* Center circle with animation */}
        <Animated.View style={[styles.centerCircle, animatedStyle]}>
          <Icon name="sparkles" size={32} color="#A78BFA" />
        </Animated.View>
      </View>

      {/* Text */}
      <Text style={styles.title}>Hi! I'm PawSpace AI</Text>
      <Text style={styles.subtitle}>
        Ask me anything about {petName || 'your pet'}
      </Text>

      {/* Quick action chips */}
      <View style={styles.chipsContainer}>
        <SuggestionChips
          suggestions={QUICK_ACTIONS.map(action => action.label)}
          onPress={(label) => {
            const action = QUICK_ACTIONS.find(a => a.label === label);
            if (action) onQuickAction(action.id);
          }}
          style="outline"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  illustration: {
    position: 'relative',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  centerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamond: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: 'rgba(124,58,237,0.4)',
    transform: [{ rotate: '45deg' }],
  },
  diamondTopLeft: {
    top: 15,
    left: 15,
  },
  diamondTopRight: {
    top: 15,
    right: 15,
  },
  diamondBottomLeft: {
    bottom: 15,
    left: 15,
  },
  diamondBottomRight: {
    bottom: 15,
    right: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 28,
    textAlign: 'center',
  },
  chipsContainer: {
    width: '100%',
  },
});

export default EmptyAIState;
