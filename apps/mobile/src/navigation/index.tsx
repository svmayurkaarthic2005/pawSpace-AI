import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { Text } from 'react-native';
import { useAuthStore, useUser } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { api } from '../services/api';
import { socketService } from '../services/socket.service';
import { RootStackParamList } from '../types';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import IncomingCallScreen from '../screens/call/IncomingCallScreen';
import VideoCallScreen from '../screens/call/VideoCallScreen';
import Toast from '../components/ui/Toast';
import { hasCompletedOnboarding } from '../utils/onboardingStorage';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Animated Boot Screen ────────────────────────────────────────────────────
// Shown while AsyncStorage + auth checks are running

const BootScreen: React.FC = () => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={bootStyles.root}>
      <Animated.View style={[bootStyles.content, anim]}>
        <Text style={bootStyles.paw}>🐾</Text>
        <Text style={bootStyles.name}>PawSpace</Text>
      </Animated.View>
    </View>
  );
};

const bootStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center' },
  paw: { fontSize: 52, marginBottom: 12 },
  name: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
});

// ─── Root Navigator ──────────────────────────────────────────────────────────

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const user = useUser(); // Use the selector hook to ensure re-renders
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  // Debug: log auth/navigation state to help track crash during navigator mount
  // This log is intentionally lightweight to avoid leaking sensitive data.
  console.log('[Navigator] render attempt:', {
    isAuthenticated: !!isAuthenticated,
    isLoading: !!isLoading,
    hasUser: !!user,
    userId: user?.id ?? null,
  });
  
  /**
   * null  = still checking
   * true  = onboarding done
   * false = needs onboarding
   */
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Initialize backend auth state on mount
  useEffect(() => {
    void initialize();
    hasCompletedOnboarding().then(setOnboardingDone);
  }, [initialize]);

  // Fetch unread notification count when authenticated
  // Use socket event as the source of truth, fallback to REST API if socket isn't ready
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let hasReceivedSocketCount = false;

    // Listen for initial count from socket (sent on connection)
    const handleSocketCount = ({ count }: { count: number }) => {
      hasReceivedSocketCount = true;
      setUnreadCount(count);
    };

    // Listen for updates
    const handleCountUpdate = ({ count }: { count: number }) => {
      setUnreadCount(count);
    };

    socketService.on('notification:count', handleSocketCount);
    socketService.on('notification:count_update', handleCountUpdate);

    // Fallback: If socket doesn't send count within 2 seconds, fetch via REST
    const timeoutId = setTimeout(() => {
      if (!hasReceivedSocketCount) {
        api
          .get('/notifications/unread-count')
          .then((response) => {
            const count = response.data?.data?.count ?? 0;
            setUnreadCount(count);
          })
          .catch((err) => {
            console.error('[RootNavigator] Failed to fetch unread count:', err);
          });
      }
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      socketService.off('notification:count', handleSocketCount);
      socketService.off('notification:count_update', handleCountUpdate);
    };
  }, [isAuthenticated, user, setUnreadCount]);

  // Both async checks must resolve before rendering navigator
  if (isLoading || onboardingDone === null) {
    return <BootScreen />;
  }

  // Check if user is authenticated but profile is incomplete
  const needsProfileCompletion = isAuthenticated && user && user.isProfileComplete === false;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {needsProfileCompletion ? (
          // User is authenticated but needs to complete profile
          <Stack.Screen 
            name="Auth" 
            component={AuthStack} 
            initialParams={{ skipOnboarding: true } as any}
          />
        ) : isAuthenticated ? (
          // Already logged in with complete profile → go to main app
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          /**
           * AuthStack contains:
           *   - Splash (initial screen when onboarding not done)
           *   - OnboardingWelcome / Profile / Discover
           *   - Login / Register
           *
           * When onboarding IS done we still use AuthStack but tell it to
           * start at Login by passing initialRouteName via screenOptions.
           * We achieve this with a wrapper component.
           */
          <Stack.Screen
            name="Auth"
            component={AuthStack}
            initialParams={{ skipOnboarding: onboardingDone || false } as any}
          />
        )}

        {/* Global Modal Screens */}
        <Stack.Screen 
          name="IncomingCall" 
          component={IncomingCallScreen} 
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen 
          name="VideoCall" 
          component={VideoCallScreen} 
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>

      {/* Global Toast overlay */}
      <Toast />
    </NavigationContainer>
  );
};

export default RootNavigator;
