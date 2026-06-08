import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * Configure Google Sign-In
 * Call this once during app initialization
 */
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: '611728351672-ae8rcm9oou8bo05mhs4ifjv84q8qp3u2.apps.googleusercontent.com', // From Firebase Console
  });
};

/**
 * Sign in with Google using Firebase
 */
export const signInWithGoogle = async () => {
  try {
    // Check if device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Get user info from Google
    const response = await GoogleSignin.signIn();
    
    console.log('[FirebaseAuth] Google Sign-In response:', {
      hasData: !!response.data,
      hasIdToken: !!response.data?.idToken,
    });
    
    // Extract idToken from response.data (newer versions of the library)
    const idToken = response.data?.idToken;
    
    if (!idToken) {
      console.error('[FirebaseAuth] No ID token found in response:', response);
      throw new Error('No ID token found in Google Sign-In response');
    }
    
    // Create Firebase credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    
    // Sign in with Firebase
    const userCredential = await auth().signInWithCredential(googleCredential);
    
    console.log('[FirebaseAuth] User signed in:', userCredential.user.email);
    
    return userCredential.user;
  } catch (error) {
    console.error('[FirebaseAuth] Google sign-in error:', error);
    throw error;
  }
};

/**
 * Sign out from Firebase and Google
 */
export const signOut = async () => {
  try {
    await auth().signOut();
    await GoogleSignin.signOut();
    console.log('[FirebaseAuth] User signed out');
  } catch (error) {
    console.error('[FirebaseAuth] Sign out error:', error);
    throw error;
  }
};

/**
 * DEPRECATED: Use onAuthStateChanged() instead
 * This method is only kept for backward compatibility
 * @deprecated - Firebase recommends using onAuthStateChanged for auth state
 */
export const getCurrentUser = () => {
  console.warn('[FirebaseAuth] getCurrentUser() is deprecated. Use onAuthStateChanged() instead.');
  return auth().currentUser;
};

/**
 * Get Firebase ID token for backend authentication
 * Uses onAuthStateChanged for real-time auth state
 */
export const getIdToken = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    const unsubscribe = auth().onAuthStateChanged(async (user: any) => {
      unsubscribe(); // Unsubscribe immediately after getting user
      if (!user) {
        resolve(null);
        return;
      }
      
      try {
        const token = await user.getIdToken();
        resolve(token);
      } catch (error) {
        console.error('[FirebaseAuth] Failed to get ID token:', error);
        resolve(null);
      }
    });
  });
};

/**
 * Listen to Firebase auth state changes
 */
export const onAuthStateChanged = (callback: (user: any) => void) => {
  return auth().onAuthStateChanged(callback);
};
