import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat,
  withSequence, withTiming, interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.shimmerBase, colors.shimmerHighlight],
    ),
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        { width: width as number, height, borderRadius },
        style,
      ]}
    />
  );
};

// ─── Preset Skeletons ─────────────────────────────────────────────────────────

export const PostCardSkeleton: React.FC = () => {
  const { spacing } = useTheme();
  return (
    <View style={{ padding: spacing.md, gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={{ gap: 6, flex: 1 }}>
          <Skeleton width="50%" height={12} />
          <Skeleton width="30%" height={10} />
        </View>
      </View>
      <Skeleton width="100%" height={280} borderRadius={16} />
      <Skeleton width="70%" height={12} />
      <Skeleton width="40%" height={10} />
    </View>
  );
};

export const ProfileSkeleton: React.FC = () => {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <Skeleton width="100%" height={200} borderRadius={0} />
      <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
        <Skeleton width={80} height={80} borderRadius={40} />
        <Skeleton width="50%" height={20} />
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={14} />
      </View>
    </View>
  );
};

export default Skeleton;
