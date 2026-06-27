import React, { useState, useEffect } from 'react';
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
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';

import { AuthStackParamList } from '../../types';
import { authApi } from '../../services/auth.service';
import { useDebounce } from '../../hooks/useDebounce';
import GlassCard from '../../components/ui/GlassCard';
import AuthInput from '../../components/ui/AuthInput';
import { COLORS, FONT_SIZE, SPACING } from '../../constants';
import StepIndicator from '../../components/ui/StepIndicator';

// ─── Auth palette (mirrors LoginScreen) ──────────────────────────────────────
const AUTH_PRIMARY = '#7C3AED';
const AUTH_SECONDARY = '#8B5CF6';

// ─── Validation ───────────────────────────────────────────────────────────────

const registerSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name too long')
    .required('Name is required'),
  username: yup
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .matches(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores')
    .required('Username is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});

type RegisterFormData = yup.InferType<typeof registerSchema>;

// ─── Password strength helper ─────────────────────────────────────────────────

function getPasswordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] ?? 'Strong' };
}

const STRENGTH_COLORS = ['transparent', '#EF4444', '#F59E0B', '#10B981', '#7C3AED'];

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// ─── Component ────────────────────────────────────────────────────────────────

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  // loginAction intentionally omitted — auth store is updated by AddPetScreen after the register API call

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const watchedUsername = watch('username');
  const watchedPassword = watch('password');
  const debouncedUsername = useDebounce(watchedUsername, 600);

  const passwordStrength = getPasswordStrength(watchedPassword ?? '');

  // ─── Username availability check ───────────────────────────────────────────

  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(debouncedUsername)) {
      setUsernameStatus('idle');
      return;
    }

    let cancelled = false;
    setUsernameStatus('checking');

    authApi
      .checkUsername(debouncedUsername)
      .then((available) => {
        if (!cancelled) setUsernameStatus(available ? 'available' : 'taken');
      })
      .catch(() => {
        if (!cancelled) setUsernameStatus('idle');
      });

    return () => { cancelled = true; };
  }, [debouncedUsername]);

  const getUsernameSuffix = () => {
    switch (usernameStatus) {
      case 'checking':
        return <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />;
      case 'available':
        return <Icon name="checkmark-circle" size={22} color={COLORS.success} />;
      case 'taken':
        return <Icon name="close-circle" size={22} color={COLORS.error} />;
      default:
        return null;
    }
  };

  // ─── Submit: validate step 1, then go to AddPet (step 2) ─────────────────

  const onSubmit = async (data: RegisterFormData) => {
    if (usernameStatus === 'taken') {
      Alert.alert('Username Taken', 'Please choose a different username.');
      return;
    }
    if (usernameStatus === 'checking') {
      Alert.alert('Please wait', 'Checking username availability…');
      return;
    }
    // Navigate to AddPet (step 2) — registration API call happens at the end
    navigation.navigate('AddPet', {
      name: data.name,
      username: data.username,
      email: data.email,
      password: data.password,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            hitSlop={12}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Icon name="paw" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>PawSpace</Text>
          </View>

          {/* Step Indicator */}
          <StepIndicator current={1} total={3} />

          {/* Glass Card */}
          <GlassCard style={styles.card}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join the PawSpace community</Text>

            {/* Full Name */}
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconLeft}>
                    <Icon name="person-outline" size={20} color="rgba(255,255,255,0.6)" />
                  </View>
                  <AuthInput
                    label="Full name"
                    placeholder="John Doe"
                    textContentType="name"
                    autoComplete="name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                    style={styles.inputWithIcon}
                  />
                </View>
              )}
            />

            {/* Username with @ prefix */}
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconLeft}>
                      <Icon name="at-outline" size={20} color="rgba(255,255,255,0.6)" />
                    </View>
                    <AuthInput
                      label="Username"
                      placeholder="johndoe"
                      autoCapitalize="none"
                      value={value}
                      onChangeText={(text) => onChange(text.toLowerCase())}
                      onBlur={onBlur}
                      error={
                        errors.username?.message ??
                        (usernameStatus === 'taken' ? 'Username is already taken' : undefined)
                      }
                      style={styles.inputWithIcon}
                      rightElement={getUsernameSuffix()}
                    />
                  </View>
                  {usernameStatus === 'available' && (
                    <Text style={styles.availableText}>Username is available</Text>
                  )}
                </>
              )}
            />

            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconLeft}>
                    <Icon name="mail-outline" size={20} color="rgba(255,255,255,0.6)" />
                  </View>
                  <AuthInput
                    label="Email"
                    placeholder="john.doe@example.com"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    style={styles.inputWithIcon}
                  />
                </View>
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconLeft}>
                      <Icon name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" />
                    </View>
                    <AuthInput
                      label="Password"
                      placeholder="••••••••"
                      secureTextEntry={!showPassword}
                      textContentType="newPassword"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                      style={styles.inputWithIcon}
                      rightElement={
                        <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                          <Icon 
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                            size={22} 
                            color="rgba(255,255,255,0.7)" 
                          />
                        </TouchableOpacity>
                      }
                    />
                  </View>
                  {/* Password Strength Bar */}
                  {!!watchedPassword && (
                    <View style={styles.strengthRow}>
                      <View style={styles.strengthBars}>
                        {[1, 2, 3, 4].map((seg) => (
                          <View
                            key={seg}
                            style={[
                              styles.strengthSegment,
                              {
                                backgroundColor:
                                  seg <= passwordStrength.score
                                    ? STRENGTH_COLORS[passwordStrength.score]
                                    : 'rgba(255,255,255,0.15)',
                              },
                            ]}
                          />
                        ))}
                      </View>
                      {!!passwordStrength.label && (
                        <Text
                          style={[
                            styles.strengthLabel,
                            { color: STRENGTH_COLORS[passwordStrength.score] },
                          ]}
                        >
                          {passwordStrength.label}
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}
            />

            {/* Confirm Password */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconLeft}>
                    <Icon name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" />
                  </View>
                  <AuthInput
                    label="Confirm password"
                    placeholder="••••••••"
                    secureTextEntry={!showConfirm}
                    textContentType="newPassword"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                    style={styles.inputWithIcon}
                    rightElement={
                      <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
                        <Icon 
                          name={showConfirm ? 'eye-off-outline' : 'eye-outline'} 
                          size={22} 
                          color="rgba(255,255,255,0.7)" 
                        />
                      </TouchableOpacity>
                    }
                  />
                </View>
              )}
            />

            {/* Next Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, (isSubmitting || usernameStatus === 'checking') && styles.primaryBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting || usernameStatus === 'checking'}
              activeOpacity={0.85}
            >
              {isSubmitting || usernameStatus === 'checking' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Next</Text>
                  <Icon name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </GlassCard>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0B1E',
  },
  flex: { flex: 1 },
  gradientTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1035',
    opacity: 1,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: '#0D0B1E',
    opacity: 1,
  },
  blob1: {
    position: 'absolute',
    top: -60,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: AUTH_SECONDARY,
    opacity: 0.12,
  },
  blob2: {
    position: 'absolute',
    bottom: 60,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: AUTH_PRIMARY,
    opacity: 0.15,
  },
  backBtn: {
    marginTop: SPACING.sm + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0),
    marginBottom: -SPACING.md,
    alignSelf: 'flex-start',
    padding: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124,58,237,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.5)',
  },
  appName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  },
  card: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: SPACING.lg,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  inputIconLeft: {
    position: 'absolute',
    left: 16,
    top: 42,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  availableText: {
    color: COLORS.success,
    fontSize: FONT_SIZE.xs,
    marginTop: -SPACING.md,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  primaryBtn: {
    backgroundColor: AUTH_PRIMARY,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    shadowColor: AUTH_PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FONT_SIZE.sm,
  },
  footerLink: {
    color: AUTH_SECONDARY,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});

export default RegisterScreen;
