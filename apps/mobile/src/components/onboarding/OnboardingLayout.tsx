import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: H } = Dimensions.get('window');
const IMG_HEIGHT = H * 0.46;

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingLayoutProps {
  /** Illustration asset */
  illustration: ImageSourcePropType;
  /** Big headline */
  title: string;
  /** Supporting copy */
  description: string;
  /** Index of current dot (0-based) */
  currentIndex: number;
  /** Total number of onboarding slides */
  totalSlides: number;
  /** Primary button label */
  buttonLabel: string;
  /** Called when primary button is pressed */
  onNext: () => void;
  /** Called when Skip is pressed — undefined hides the Skip button */
  onSkip?: () => void;
}

// ─── PressableButton ─────────────────────────────────────────────────────────

interface PressableButtonProps {
  label: string;
  onPress: () => void;
}

const PressableButton: React.FC<PressableButtonProps> = ({ label, onPress }) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── OnboardingLayout ─────────────────────────────────────────────────────────

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  illustration,
  title,
  description,
  currentIndex,
  totalSlides,
  buttonLabel,
  onNext,
  onSkip,
}) => {
  const insets = useSafeAreaInsets();

  // Entrance animation
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const contentAnim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const imgAnim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: 0.9 + 0.1 * opacity.value }],
  }));

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom || 24 },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Skip button */}
      {onSkip && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: insets.top + 12 }]}
          onPress={onSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Illustration */}
      <Animated.View style={[styles.illustrationWrapper, imgAnim]}>
        <Image
          source={illustration}
          style={styles.illustration}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

      {/* Text + dots + button */}
      <Animated.View style={[styles.contentCard, contentAnim]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Primary CTA */}
        <PressableButton label={buttonLabel} onPress={onNext} />
      </Animated.View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Skip
  skipBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
  // Illustration
  illustrationWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    maxHeight: IMG_HEIGHT,
  },
  illustration: {
    width: '88%',
    height: '100%',
  },
  // Content card
  contentCard: {
    width: '100%',
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  // Dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  // Button
  button: {
    alignSelf: 'center',
    minWidth: 180,
    paddingHorizontal: 28,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default OnboardingLayout;
