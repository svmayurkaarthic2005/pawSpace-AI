import React, { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

interface AnimatedHeartProps {
  isLiked: boolean;
  onPress: () => void;
}

const AnimatedHeart: React.FC<AnimatedHeartProps> = ({ isLiked, onPress }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isLiked) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1.0, { damping: 10 })
      );
    }
  }, [isLiked]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={animatedStyle}>
        <Icon
          name={isLiked ? 'heart' : 'heart-outline'}
          size={24}
          color={isLiked ? '#EF4444' : 'rgba(255,255,255,0.7)'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedHeart;
