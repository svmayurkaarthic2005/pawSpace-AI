import React from 'react';
import {
  Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle, TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const HEIGHT: Record<ButtonSize, number> = { sm: 36, md: 48, lg: 56 };
const FONT: Record<ButtonSize, number> = { sm: 13, md: 15, lg: 16 };
const PADDING: Record<ButtonSize, number> = { sm: 12, md: 20, lg: 28 };

const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, style, textStyle,
  leftIcon, rightIcon, fullWidth = false,
}) => {
  const { colors, radius, shadows } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    height: HEIGHT[size],
    paddingHorizontal: PADDING[size],
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: fullWidth ? 'stretch' : 'auto',
    opacity: isDisabled ? 0.55 : 1,
    ...(variant === 'primary' && {
      backgroundColor: colors.primary,
      ...(shadows?.purple ?? {}),
    }),
    ...(variant === 'secondary' && {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
    }),
    ...(variant === 'ghost' && {
      backgroundColor: 'transparent',
    }),
    ...(variant === 'danger' && {
      backgroundColor: colors.error,
    }),
  };

  const labelColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'secondary'
      ? colors.primary
      : colors.textSecondary;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[containerStyle, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
      >
        {loading ? (
          <ActivityIndicator color={labelColor} size="small" />
        ) : (
          <>
            {leftIcon}
            <Text style={[styles.label, { fontSize: FONT[size], color: labelColor, fontWeight: '700' }, textStyle]}>
              {label}
            </Text>
            {rightIcon}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  label: { letterSpacing: 0.2 },
});

export default Button;
