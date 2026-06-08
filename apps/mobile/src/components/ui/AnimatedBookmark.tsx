import React, { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

interface AnimatedBookmarkProps {
  isBookmarked: boolean;
  onPress: () => void;
}

const AnimatedBookmark: React.FC<AnimatedBookmarkProps> = ({ isBookmarked, onPress }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isBookmarked) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1.0, { damping: 10 })
      );
    }
  }, [isBookmarked]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={animatedStyle}>
        <Icon
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={24}
          color={isBookmarked ? '#7C3AED' : 'rgba(255,255,255,0.7)'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedBookmark;
