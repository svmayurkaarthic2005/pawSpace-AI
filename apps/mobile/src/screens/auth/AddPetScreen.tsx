import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/auth.service';
import { FONT_SIZE, SPACING } from '../../constants';

// ─── Auth palette ─────────────────────────────────────────────────────────────
const AUTH_PRIMARY = '#7C3AED';
const AUTH_SECONDARY = '#8B5CF6';

// ─── Step Indicator (shared style) ───────────────────────────────────────────
const StepIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <View style={stepStyles.row}>
    {Array.from({ length: total }).map((_, i) => {
      const step = i + 1;
      const active = step === current;
      const done = step < current;
      return (
        <React.Fragment key={step}>
          <View style={[stepStyles.circle, (active || done) && stepStyles.circleActive]}>
            <Text style={[stepStyles.circleText, (active || done) && stepStyles.circleTextActive]}>
              {step}
            </Text>
          </View>
          {step < total && (
            <View style={[stepStyles.line, done && stepStyles.lineActive]} />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: AUTH_PRIMARY,
    borderColor: AUTH_PRIMARY,
  },
  circleText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  circleTextActive: {
    color: '#FFFFFF',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 4,
    maxWidth: 48,
  },
  lineActive: {
    backgroundColor: AUTH_PRIMARY,
  },
});

// ─── Species options ──────────────────────────────────────────────────────────
const SPECIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'] as const;
type Species = typeof SPECIES[number];

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<AuthStackParamList, 'AddPet'>;

// ─── Component ────────────────────────────────────────────────────────────────
const AddPetScreen: React.FC<Props> = ({ navigation, route }) => {
  const { name, username, email, password } = route.params;
  const loginAction = useAuthStore((s) => s.login);

  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState<Species>('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerAndProceed = async (skipPet = false) => {
    setIsSubmitting(true);
    try {
      const result = await authApi.register({
        name,
        username,
        email,
        password,
        ...(!skipPet && petName.trim()
          ? { pet: { name: petName.trim(), species, breed: breed.trim(), age } }
          : {}),
      });
      await loginAction(result.user, result.accessToken, result.refreshToken);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => registerAndProceed(false);
  const handleSkip = () => registerAndProceed(true);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Background layers */}
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
            <Text style={styles.backArrow}>←</Text>
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Text style={styles.logo}>🐾</Text>
            </View>
            <Text style={styles.appName}>PawSpace</Text>
          </View>

          {/* Step Indicator — step 2 active, step 1 done */}
          <StepIndicator current={2} total={3} />

          {/* Title */}
          <Text style={styles.title}>Add your first pet 🐾</Text>
          <Text style={styles.subtitle}>Optional but encouraged</Text>

          {/* Card */}
          <View style={styles.card}>
            {/* Photo Picker */}
            <TouchableOpacity
              style={styles.photoPicker}
              activeOpacity={0.75}
              onPress={() => Alert.alert('Coming Soon', 'Photo upload will be available soon.')}
            >
              <View style={styles.photoDashedCircle}>
                <Text style={styles.photoIcon}>🐾</Text>
              </View>
              <Text style={styles.photoLabel}>Tap to add photo</Text>
            </TouchableOpacity>

            {/* Pet Name */}
            <Text style={styles.inputLabel}>Pet name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Buddy"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={petName}
                onChangeText={setPetName}
                autoCorrect={false}
              />
            </View>

            {/* Species Selector */}
            <Text style={styles.inputLabel}>Species</Text>
            <View style={styles.speciesRow}>
              {SPECIES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.speciesChip,
                    species === s && styles.speciesChipActive,
                  ]}
                  onPress={() => setSpecies(s)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.speciesChipText,
                      species === s && styles.speciesChipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Breed */}
            <Text style={styles.inputLabel}>Breed</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Golden-Retriever"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={breed}
                onChangeText={setBreed}
                autoCorrect={false}
              />
            </View>

            {/* Age Stepper */}
            <Text style={styles.inputLabel}>Age</Text>
            <View style={styles.ageStepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setAge((v) => Math.max(0, v - 1))}
                activeOpacity={0.8}
              >
                <Text style={styles.stepperIcon}>−</Text>
              </TouchableOpacity>

              <View style={styles.ageCenter}>
                <Text style={styles.ageValue}>{age}</Text>
                <Text style={styles.ageUnit}>years</Text>
              </View>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setAge((v) => v + 1)}
                activeOpacity={0.8}
              >
                <Text style={styles.stepperIcon}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Buttons Row */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.skipBtn, isSubmitting && { opacity: 0.5 }]}
                onPress={handleSkip}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={styles.skipBtnText}>Skip for now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.nextBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleNext}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.nextBtnText}>Next</Text>
                )}
              </TouchableOpacity>
            </View>
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
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: AUTH_PRIMARY,
    opacity: 0.14,
  },
  blob2: {
    position: 'absolute',
    bottom: 80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: AUTH_SECONDARY,
    opacity: 0.10,
  },
  backBtn: {
    marginTop: SPACING.sm,
    marginBottom: -SPACING.sm,
    alignSelf: 'flex-start',
    padding: SPACING.xs,
  },
  backArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(124,58,237,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  logo: {
    fontSize: 30,
  },
  appName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  // ─── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: SPACING.lg,
  },
  // ─── Photo picker ──────────────────────────────────────────────────────────
  photoPicker: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  photoDashedCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: SPACING.sm,
  },
  photoIcon: {
    fontSize: 40,
    opacity: 0.45,
  },
  photoLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZE.sm,
  },
  // ─── Inputs ───────────────────────────────────────────────────────────────
  inputLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    height: 52,
    justifyContent: 'center',
  },
  input: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
  },
  // ─── Species chips ─────────────────────────────────────────────────────────
  speciesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  speciesChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  speciesChipActive: {
    backgroundColor: AUTH_PRIMARY,
    borderColor: AUTH_PRIMARY,
  },
  speciesChipText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  speciesChipTextActive: {
    color: '#FFFFFF',
  },
  // ─── Age stepper ──────────────────────────────────────────────────────────
  ageStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    height: 58,
  },
  stepperBtn: {
    width: 58,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stepperIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 26,
  },
  ageCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageValue: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    lineHeight: 22,
  },
  ageUnit: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  // ─── Buttons ──────────────────────────────────────────────────────────────
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  skipBtn: {
    flex: 1,
    height: 52,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 1,
    height: 52,
    borderRadius: 50,
    backgroundColor: AUTH_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AUTH_PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default AddPetScreen;
