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
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';

import { AuthStackParamList } from '../../types';
import { useAuthStore, useIsRetryingColdStart } from '../../store/authStore';
import { authApi } from '../../services/auth.service';
import { signInWithGoogle, getIdToken } from '../../services/firebaseAuth.service';
import GlassCard from '../../components/ui/GlassCard';
import AuthInput from '../../components/ui/AuthInput';
import { FONT_SIZE, SPACING } from '../../constants';

// ─── Validation ───────────────────────────────────────────────────────────────

const loginSchema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(1, 'Password is required').required('Password is required'),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// ─── Component ────────────────────────────────────────────────────────────────

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { handleFirebaseUser, login: authStoreLogin } = useAuthStore();
  const isRetryingColdStart = useIsRetryingColdStart();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });
      console.log('[LoginScreen] Email login response:', response);

      // Update auth store so the navigator redirects to the main app
      await authStoreLogin(response.user, response.accessToken, response.refreshToken);
    } catch (err: unknown) {
      const message = (err as Error).message || 'Login failed. Please try again.';
      Alert.alert('Login Failed', message);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      console.log('[LoginScreen] Starting Google sign-in...');
      const firebaseUser = await signInWithGoogle();
      console.log('[LoginScreen] Firebase user obtained:', firebaseUser.email);
      
      const idToken = await getIdToken();
      
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      console.log('[LoginScreen] ID token obtained, syncing with backend...');

      // Sync with backend
      await handleFirebaseUser(firebaseUser, idToken);

      console.log('[LoginScreen] Successfully signed in — navigator will redirect automatically.');
    } catch (err: unknown) {
      console.error('[LoginScreen] Google sign-in error:', err);
      const error = err as any;
      let message = 'Failed to sign in with Google';
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      Alert.alert('Google Sign-In Failed', message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Gradient background via layered views */}
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />

      {/* Decorative blobs */}
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
            <Text style={styles.tagline}>Connect with pet lovers</Text>
          </View>

          {/* Glass Card */}
          <GlassCard style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>

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
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    style={styles.inputWithIcon}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconLeft}>
                    <Icon name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" />
                  </View>
                  <AuthInput
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoComplete="password"
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
              )}
            />

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, (isSubmitting || isGoogleLoading) && styles.primaryBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting || isGoogleLoading}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                  <Icon name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Firebase Google Sign In */}
            <TouchableOpacity
              style={styles.googleBtn}
              activeOpacity={0.85}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
            >
              {isGoogleLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.googleBtnText}>
                    {isRetryingColdStart ? 'Connecting to server...' : 'Signing in...'}
                  </Text>
                </View>
              ) : (
                <>
                  <Icon name="logo-google" size={24} color="#FFFFFF" />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </GlassCard>

          {/* Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

// Purple palette for auth screens (override global orange theme)
const AUTH_PRIMARY = '#7C3AED'; // Vibrant purple
const AUTH_SECONDARY = '#8B5CF6'; // Lighter purple for links/accents

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
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: AUTH_PRIMARY,
    opacity: 0.18,
  },
  blob2: {
    position: 'absolute',
    bottom: 60,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: AUTH_SECONDARY,
    opacity: 0.1,
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
    marginBottom: SPACING.xl,
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
  tagline: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  forgotText: {
    color: AUTH_SECONDARY,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: AUTH_PRIMARY,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZE.xs,
    marginHorizontal: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: SPACING.sm,
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
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

export default LoginScreen;
