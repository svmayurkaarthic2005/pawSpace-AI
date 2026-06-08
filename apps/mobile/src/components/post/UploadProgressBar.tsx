import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface UploadProgressBarProps {
  progress: number; // 0-100
}

const UploadProgressBar: React.FC<UploadProgressBarProps> = ({ progress }) => {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bar: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
});

export default UploadProgressBar;
