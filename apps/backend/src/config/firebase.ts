import * as admin from 'firebase-admin';
import { env } from './env';

// ─── Initialize Firebase Admin (Singleton) ────────────────────────────────────

let firebaseApp: admin.app.App | null = null;

export const getFirebaseApp = (): admin.app.App => {
  if (firebaseApp) return firebaseApp;

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (err) {
    // If already initialized (in tests, etc), get the default app
    if ((err as Error).message.includes('already exists')) {
      firebaseApp = admin.app();
      console.log('✅ Firebase Admin already initialized');
    } else {
      console.error('❌ Firebase Admin init failed:', err);
      throw err;
    }
  }

  return firebaseApp;
};

export const getFirebaseAuth = (): admin.auth.Auth => {
  return admin.auth(getFirebaseApp());
};
