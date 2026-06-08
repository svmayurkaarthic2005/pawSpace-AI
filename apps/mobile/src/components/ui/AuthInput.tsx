import React, { forwardRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { COLORS, FONT_SIZE, SPACING } from '../../constants';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const AuthInput = forwardRef<TextInput, AuthInputProps>(
  ({ label, error, containerStyle, leftElement, rightElement, ...props }, ref) => {
    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrapper, error ? styles.inputError : styles.inputNormal]}>
          {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
          <TextInput
            ref={ref}
            style={styles.input}
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoCapitalize="none"
            autoCorrect={false}
            {...props}
          />
          {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  },
);

AuthInput.displayName = 'AuthInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.md,
  },
  inputNormal: {
    borderColor: 'rgba(255,255,255,0.3)',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    height: 52,
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
  },
  rightElement: {
    marginLeft: SPACING.sm,
  },
  leftElement: {
    marginRight: 2,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default AuthInput;
