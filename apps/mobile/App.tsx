/**
 * PawSpace Mobile App
 */

import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation';
import { configureGoogleSignIn } from './src/services/firebaseAuth.service';
import { useAuthStore } from './src/store/authStore';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

function AppContent() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Configure Google Sign-In
    configureGoogleSignIn();
    
    // Initialize auth
    void initialize();
  }, [initialize]);

  return <RootNavigator />;
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default App;

