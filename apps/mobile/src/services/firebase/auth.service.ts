import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail, 
  updateProfile, 
  updateEmail, 
  updatePassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  FirebaseAuthTypes 
} from '@react-native-firebase/auth';

/**
 * Firebase Authentication Service
 * Handles user authentication operations
 */

export class FirebaseAuthService {
  /**
   * Sign in with email and password
   */
  static async signInWithEmail(
    email: string,
    password: string
  ): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      return await signInWithEmailAndPassword(getAuth(), email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  /**
   * Create user with email and password
   */
  static async createUserWithEmail(
    email: string,
    password: string
  ): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      return await createUserWithEmailAndPassword(getAuth(), email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create user');
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(getAuth());
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser(): FirebaseAuthTypes.User | null {
    return getAuth().currentUser;
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(getAuth(), email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: {
    displayName?: string;
    photoURL?: string;
  }): Promise<void> {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('No user signed in');
      await updateProfile(user, updates);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  /**
   * Update user email
   */
  static async updateEmail(newEmail: string): Promise<void> {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('No user signed in');
      await updateEmail(user, newEmail);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update email');
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('No user signed in');
      await updatePassword(user, newPassword);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update password');
    }
  }

  /**
   * Get ID token for current user
   */
  static async getIdToken(forceRefresh = false): Promise<string> {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('No user signed in');
      return await user.getIdToken(forceRefresh);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get ID token');
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(
    callback: (user: FirebaseAuthTypes.User | null) => void
  ) {
    return firebaseOnAuthStateChanged(getAuth(), callback);
  }
}

export default FirebaseAuthService;
