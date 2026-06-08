import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList, RootStackParamList } from '../types';
import { useUser } from '../store/authStore';
import SplashScreen from '../screens/SplashScreen';
import OnboardingWelcome from '../screens/onboarding/OnboardingWelcome';
import OnboardingProfile from '../screens/onboarding/OnboardingProfile';
import OnboardingDiscover from '../screens/onboarding/OnboardingDiscover';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import AddPetScreen from '../screens/auth/AddPetScreen';
import CompleteProfileScreen from '../screens/auth/CompleteProfileScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

/**
 * AuthStack
 *
 * Handles the full pre-authentication flow:
 *   Splash → OnboardingWelcome → OnboardingProfile → OnboardingDiscover → Login
 *
 * Receives `skipOnboarding` via route.params from RootNavigator.
 * When true, initialRouteName is set to "Login" so onboarding is bypassed.
 */
const AuthStack: React.FC<Props> = ({ route }) => {
  const user = useUser();
  
  // @ts-ignore – initialParams is typed as unknown on the root stack
  const skipOnboarding = route?.params?.skipOnboarding as boolean | undefined;
  
  // Determine initial route
  let initialRoute: keyof AuthStackParamList;
  
  // If user is authenticated but profile incomplete, show CompleteProfile
  if (user && user.isProfileComplete === false) {
    initialRoute = 'CompleteProfile';
  } else if (skipOnboarding) {
    initialRoute = 'Login';
  } else {
    initialRoute = 'Splash';
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0D0D1A' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcome} />
      <Stack.Screen name="OnboardingProfile" component={OnboardingProfile} />
      <Stack.Screen name="OnboardingDiscover" component={OnboardingDiscover} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="AddPet" component={AddPetScreen} />
      {/* RegisterComplete — placeholder until step-3 screen is built */}
      <Stack.Screen 
        name="RegisterComplete" 
        component={CompleteProfileScreen as any} 
      />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
