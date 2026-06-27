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
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';

import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import GlassCard from '../../components/ui/GlassCard';
import AuthInput from '../../components/ui/AuthInput';
import { FONT_SIZE, SPACING } from '../../constants';
import { useDebounce } from '../../hooks/useDebounce';
import Toast from 'react-native-toast-message';

// ─── Validation ───────────────────────────────────────────────────────────────

const profileSchema = yup.object({
  username: yup
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .matches(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
    .required('Username is required'),
  bio: yup
    .string()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional(),
});

type ProfileFormData = yup.InferType<typeof profileSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AuthStackParamList, 'CompleteProfile'>;

// ─── Component ────────────────────────────────────────────────────────────────

const CompleteProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, setUser } = useAuthStore();
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: { 
      username: user?.username || '', 
      bio: user?.bio || '' 
    },
  });

  const username = watch('username');

  const debouncedUsername = useDebounce(username, 500);

  // Check username availability (debounced via useDebounce hook)
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    // Don't check if unchanged from saved username
    if (debouncedUsername === user?.username) {
      setUsernameAvailable(true);
      return;
    }
    if (!/^[a-z0-9_]+$/.test(debouncedUsername)) {
      setUsernameAvailable(null);
      return;
    }

    let cancelled = false;
    setIsCheckingUsername(true);
    api
      .get<{ success: boolean; data: { available: boolean } }>(
        `/auth/check-username/${debouncedUsername}`,
      )
      .then(({ data }) => {
        if (!cancelled) setUsernameAvailable(data.data.available);
      })
      .catch(() => {
        if (!cancelled) setUsernameAvailable(null);
      })
      .finally(() => {
        if (!cancelled) setIsCheckingUsername(false);
      });

    return () => { cancelled = true; };
  }, [debouncedUsername, user?.username]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      if (!usernameAvailable && data.username !== user?.username) {
        Alert.alert('Username Taken', 'Please choose a different username');
        return;
      }

      // Update profile and use backend response to update the store
      const { data: responseData } = await api.put<{ data: { user: any } }>(
        '/users/profile',
        {
          username: data.username,
          bio: data.bio || '',
          isProfileComplete: true,
        },
      );

      if (user) {
        if (responseData?.data?.user) {
          // Prefer authoritative backend user object
          setUser({ ...user, ...responseData.data.user });
        } else {
          // Fallback: client-side merge
          setUser({
            ...user,
            username: data.username,
            bio: data.bio || undefined,
            isProfileComplete: true,
          });
        }
      }

      // Toast instead of Alert — navigator redirect handles confirmation
      Toast.show({
        type: 'success',
        text1: 'Profile complete!',
        position: 'bottom',
        visibilityTime: 2000,
      });

      // Navigation handled automatically by root navigator when isProfileComplete → true
    } catch (err: unknown) {
      const message = (err as Error).message || 'Failed to update profile';
      Alert.alert('Error', message);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Gradient background */}
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Icon name="person-add" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>Complete Your Profile</Text>
            <Text style={styles.tagline}>Tell us a bit more about yourself</Text>
          </View>

          {/* Glass Card */}
          <GlassCard style={styles.card}>
            <Text style={styles.title}>Welcome, {user?.displayName || 'Friend'}!</Text>
            <Text style={styles.subtitle}>
              Let's set up your unique username and add a bio to help others find you.
            </Text>

            {/* Username Input */}
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconLeft}>
                    <Icon name="at" size={20} color="rgba(255,255,255,0.6)" />
                  </View>
                  <AuthInput
                    label="Username"
                    placeholder="your_unique_username"
                    autoCapitalize="none"
                    autoComplete="username"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.username?.message}
                    style={styles.inputWithIcon}
                    rightElement={
                      value.length >= 3 && (
                        <View>
                          {isCheckingUsername ? (
                            <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
                          ) : usernameAvailable !== null ? (
                            <Icon
                              name={usernameAvailable ? 'checkmark-circle' : 'close-circle'}
                              size={24}
                              color={usernameAvailable ? '#10B981' : '#EF4444'}
                            />
                          ) : null}
                        </View>
                      )
                    }
                  />
                  {value.length >= 3 && usernameAvailable === false && (
                    <Text style={styles.errorText}>Username is already taken</Text>
                  )}
                </View>
              )}
            />

            {/* Bio Input */}
            <Controller
              control={control}
              name="bio"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <View style={[styles.inputIconLeft, { top: 36 }]}>
                    <Icon name="create-outline" size={20} color="rgba(255,255,255,0.6)" />
                  </View>
                  <View>
                    <Text style={styles.label}>Bio (Optional)</Text>
                    <TextInput
                      placeholder="Tell us about yourself and your pets..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      multiline
                      numberOfLines={4}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      style={[styles.textArea, styles.inputWithIcon]}
                      maxLength={500}
                    />
                    <Text style={styles.charCount}>{value?.length || 0}/500</Text>
                  </View>
                </View>
              )}
            />

            {/* Complete Profile Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, (isSubmitting || isCheckingUsername || usernameAvailable === false) && styles.primaryBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting || isCheckingUsername || (usernameAvailable === false)}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Complete Profile</Text>
                  <Icon name="checkmark" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const AUTH_PRIMARY = '#7C3AED';
const AUTH_SECONDARY = '#8B5CF6';

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
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.xl,
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
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  },
  tagline: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    textAlign: 'center',
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
    lineHeight: 20,
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
  label: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  textArea: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZE.xs,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: AUTH_PRIMARY,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
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
});

export default CompleteProfileScreen;
