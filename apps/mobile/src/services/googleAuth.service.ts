import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Set to false in production to avoid logging sensitive data
const DEBUG_MODE = __DEV__;

/**
 * Sign in with Google and return user info and ID token
 */
export const signInWithGoogle = async (): Promise<{
  user: {
    email: string;
    name: string | null;
    photo: string | null;
  };
  idToken: string;
}> => {
  try {
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
    
    if (DEBUG_MODE) {
      console.log('[GoogleAuth] Play Services available');
    }
    
    // Sign in and get user info
    const userInfo = await GoogleSignin.signIn();
    
    // Get the ID token
    const tokens = await GoogleSignin.getTokens();
    
    // Access user data from the correct path (v16+ uses data.user)
    const user = userInfo.data?.user;
    
    if (!user || !user.email) {
      console.error('[GoogleAuth] User data missing');
      throw new Error('Failed to retrieve user information from Google Sign-In');
    }
    
    if (DEBUG_MODE) {
      console.log('[GoogleAuth] Sign-in successful');
      console.log('[GoogleAuth] User email:', user.email);
      console.log('[GoogleAuth] User name:', user.name);
      // DO NOT log tokens in production!
    }
    
    return {
      user: {
        email: user.email,
        name: user.name || null,
        photo: user.photo || null,
      },
      idToken: tokens.idToken,
    };
  } catch (error: any) {
    console.error('[GoogleAuth] Sign-in failed');
    
    if (DEBUG_MODE) {
      console.error('[GoogleAuth] Error code:', error.code);
      console.error('[GoogleAuth] Error message:', error.message);
    }
    
    // Handle specific error codes
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('[GoogleAuth] User cancelled the sign-in');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('[GoogleAuth] Sign-in already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('[GoogleAuth] Play Services not available on this device');
    }
    
    throw error;
  }
};

/**
 * Sign out from Google
 */
export const signOutGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
    if (DEBUG_MODE) {
      console.log('[GoogleAuth] Signed out successfully');
    }
  } catch (error) {
    console.error('[GoogleAuth] Sign-out error:', error);
  }
};
