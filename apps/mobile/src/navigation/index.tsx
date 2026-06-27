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

// ─── Error Boundary Wrapper for Navigator ────────────────────────────────────

class NavigatorErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[NavigatorErrorBoundary] Fatal render/mount error caught:', error.message, error.stack, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={[bootStyles.root, { padding: 20 }]}>
          <Text style={[bootStyles.name, { color: '#EF4444', marginBottom: 10 }]}>App Navigation Error</Text>
          <Text style={{ color: '#FFFFFF', textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || 'Unknown error occurred during navigation setup'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Root Navigator ──────────────────────────────────────────────────────────

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const user = useUser(); // Use the selector hook to ensure re-renders
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  // Task 5: Add this as the very first line inside the Navigator component
  console.log('[Navigator] rendering screen for auth state:', { isAuthenticated: !!isAuthenticated, isLoading: !!isLoading, hasUser: !!user });

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

  try {
    // Both async checks must resolve before rendering navigator
    if (isLoading || onboardingDone === null) {
      console.log('[Navigator] Decision: Rendering BootScreen');
      return <BootScreen />;
    }

    // Check if user is authenticated but profile is incomplete
    const needsProfileCompletion = isAuthenticated && user && user.isProfileComplete === false;

    const targetStack = needsProfileCompletion 
      ? 'AuthStack (CompleteProfile)' 
      : isAuthenticated 
        ? 'MainStack' 
        : `AuthStack (skipOnboarding: ${onboardingDone || false})`;
    console.log('[Navigator] Decision: Rendering target ->', targetStack);

    return (
      <NavigatorErrorBoundary>
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
      </NavigatorErrorBoundary>
    );
  } catch (renderError: any) {
    console.error('[Navigator] Synchronous render error:', renderError?.message, renderError?.stack);
    return <BootScreen />;
  }
};

export default RootNavigator;
