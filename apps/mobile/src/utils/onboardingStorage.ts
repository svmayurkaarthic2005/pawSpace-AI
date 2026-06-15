import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'pawspace_onboarding_complete';

/**
 * Returns true if the user has already completed onboarding.
 */
export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
};

/**
 * Marks onboarding as complete. Call this when the user taps "Get Started".
 */
export const markOnboardingComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {
    // silently fail — user will just see onboarding again next launch
  }
};

/**
 * Resets the onboarding flag (useful for testing / logout flows).
 */
export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // ignore
  }
};
