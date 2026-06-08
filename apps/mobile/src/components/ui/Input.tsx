import React, { useState, useRef } from 'react';
import {
  View, TextInput, TextInputProps, Text, TouchableOpacity,
  StyleSheet, ViewStyle, Animated as RNAnimated,
} from 'react-native';
import { useTheme } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, leftIcon, rightIcon, isPassword, value, onFocus, onBlur, ...props }, ref) => {
    const { colors, radius } = useTheme();
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const labelAnim = useRef(new RNAnimated.Value(value ? 1 : 0)).current;

    const handleFocus = (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setFocused(true);
      RNAnimated.timing(labelAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
      onFocus?.(e);
    };

    const handleBlur = (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setFocused(false);
      if (!value) {
        RNAnimated.timing(labelAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
      }
      onBlur?.(e);
    };

    const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 4] });
    const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 11] });
    const labelColor = error
      ? colors.error
      : focused
      ? colors.primary
      : colors.textTertiary;

    const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

    return (
      <View style={[styles.wrapper, containerStyle]}>
        <View
          style={[
            styles.container,
            {
              borderColor,
              borderWidth: focused ? 1.5 : 1,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
            },
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <View style={styles.inputWrapper}>
            <RNAnimated.Text
              style={[styles.label, { top: labelTop, fontSize: labelSize, color: labelColor }]}
            >
              {label}
            </RNAnimated.Text>
            <TextInput
              ref={ref}
              style={[styles.input, { color: colors.textPrimary, paddingLeft: leftIcon ? 0 : 0 }]}
              onFocus={handleFocus}
              onBlur={handleBlur}
              value={value}
              secureTextEntry={isPassword && !showPassword}
              placeholderTextColor={colors.textTertiary}
              {...props}
            />
          </View>

          {isPassword ? (
            <TouchableOpacity style={styles.rightIcon} onPress={() => setShowPassword((v) => !v)}>
              <Text style={{ color: colors.textTertiary, fontSize: 13 }}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          ) : rightIcon ? (
            <View style={styles.rightIcon}>{rightIcon}</View>
          ) : null}
        </View>

        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 14,
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 10 },
  inputWrapper: { flex: 1, position: 'relative', justifyContent: 'center' },
  label: {
    position: 'absolute',
    left: 0,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    paddingTop: 18,
    paddingBottom: 4,
    minHeight: 48,
  },
  error: { fontSize: 12, marginTop: 4, marginLeft: 2 },
});

export default Input;
