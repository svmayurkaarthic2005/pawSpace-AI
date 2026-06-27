import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';

import { AuthStackParamList } from '../../types';
import { FirebaseAuthService } from '../../services/firebase/auth.service';
import AuthInput from '../../components/ui/AuthInput';
import GlassCard from '../../components/ui/GlassCard';
import { FONT_SIZE, SPACING } from '../../constants';

// ─── Validation ───────────────────────────────────────────────────────────────

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
});

type FormData = yup.InferType<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

// ─── Component ────────────────────────────────────────────────────────────────

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await FirebaseAuthService.sendPasswordResetEmail(data.email);
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Icon name="lock-open-outline" size={36} color="#7C3AED" />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {sent
                ? `A reset link has been sent to ${getValues('email')}. Check your inbox.`
                : "Enter your email and we'll send you a link to reset your password."}
            </Text>
          </View>

          {!sent ? (
            <GlassCard style={styles.card}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label="Email"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                  />
                )}
              />

              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Send Reset Link</Text>
                    <Icon name="send-outline" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </GlassCard>
          ) : (
            <GlassCard style={styles.card}>
              <View style={styles.successContainer}>
                <Icon name="checkmark-circle-outline" size={56} color="#10B981" />
                <Text style={styles.successTitle}>Check your inbox</Text>
                <Text style={styles.successText}>
                  Didn't receive it? Check your spam folder, or try again with a different address.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => setSent(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>Try again</Text>
              </TouchableOpacity>
            </GlassCard>
          )}

          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Icon name="arrow-back-outline" size={16} color="#A78BFA" />
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingTop: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  successTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successText: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  backToLoginText: {
    color: '#A78BFA',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
