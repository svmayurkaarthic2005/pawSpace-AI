import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

// ─── Skeleton Components ──────────────────────────────────────────────────────

const SkeletonCircle: React.FC<{ size: number }> = ({ size }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
        },
      ]}
    />
  );
};

interface SkeletonRectProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonRect: React.FC<SkeletonRectProps> = ({ width, height, borderRadius = 4, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

const SkeletonRow: React.FC = () => {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonCircle size={48} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonRect width="75%" height={13} />
        <SkeletonRect width="55%" height={11} />
      </View>
      <SkeletonRect width={44} height={44} borderRadius={8} />
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const NotificationSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Section header skeleton */}
      <SkeletonRect width={60} height={11} style={styles.sectionHeaderSkeleton} />

      {/* Notification rows */}
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonRow key={`row-1-${i}`} />
      ))}

      {/* Second section header */}
      <SkeletonRect width={80} height={11} style={styles.sectionHeaderSkeleton} />

      {/* More rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonRow key={`row-2-${i}`} />
      ))}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonBase: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 68,
  },
  sectionHeaderSkeleton: {
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 8,
  },
});
