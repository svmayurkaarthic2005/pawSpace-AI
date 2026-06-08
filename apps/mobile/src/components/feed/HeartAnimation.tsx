import React, { forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

export interface HeartAnimationRef {
  trigger: () => void;
}

const HeartAnimation = forwardRef<HeartAnimationRef>((_, ref) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    trigger: () => {
      opacity.value = 0;
      scale.value = 0;

      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(500, withTiming(0, { duration: 200 }))
      );

      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1.0, { damping: 10 })
      );
    },
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.heartContainer, animatedStyle]}>
        <Icon name="heart" size={100} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HeartAnimation;
