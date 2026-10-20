import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

// This is the SAME Firebase/Google Cloud project that was already provisioned
// for "myday2" (the Google AI Studio build). A Firebase web config is meant to
// be public - it is not a secret, so it is safe to ship inside the app.
// If you ever want to point this app at a brand-new Firebase project instead,
// just replace the object below with the one from your new project's
// Project Settings > General > "Your apps" > Web app > SDK setup and config.
const firebaseConfig = {
  projectId: 'gen-lang-client-0342296457',
  appId: '1:839925471105:web:b0401aa486b2a0783b7a80',
  apiKey: 'AIzaSyAO9yvuZwsll3_ehsn0HBpwZECJREz980o',
  authDomain: 'gen-lang-client-0342296457.firebaseapp.com',
  databaseId: 'ai-studio-160d302d-a86d-46be-be2c-d92dfd96ca4e',
  storageBucket: 'gen-lang-client-0342296457.firebasestorage.app',
  messagingSenderId: '839925471105',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.databaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
// Extra scopes needed for the real Google Calendar + Google Tasks sync.
// These only take effect once Calendar API / Tasks API are enabled and the
// OAuth consent screen lists these scopes in Google Cloud Console (one-time
// setup - see SETUP.md).
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleProvider.addScope('https://www.googleapis.com/auth/tasks');
googleProvider.setCustomParameters({ prompt: 'consent' });

const isNative = Capacitor.isNativePlatform();

// Keeps the last-issued Google OAuth access token (and its expiry) in memory
// for this session, so Calendar/Tasks REST calls can reuse it without
// re-prompting the user every single time.
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export function cacheGoogleAccessToken(token: string) {
  // Google OAuth access tokens are short-lived (~1 hour).
  cachedAccessToken = { token, expiresAt: Date.now() + 55 * 60 * 1000 };
}

export function getCachedGoogleAccessToken(): string | null {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }
  return null;
}

/**
 * Signs the user in with Google. On native Android (inside the packaged
 * app) this uses a native Google Sign-In flow via @capacitor-firebase/authentication
 * when available; on web/dev it falls back to the standard Firebase popup.
 * Either way, a fresh Google OAuth access token (with Calendar + Tasks
 * scopes) is captured and cached for immediate use.
 */
export const signInWithGoogle = async () => {
  try {
    if (isNative) {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      const result = await FirebaseAuthentication.signInWithGoogle({
        scopes: [
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/tasks',
        ],
      });
      const idToken = result.credential?.idToken;
      const accessToken = result.credential?.accessToken;
      if (accessToken) cacheGoogleAccessToken(accessToken);
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        const webResult = await signInWithCredential(auth, credential);
        return webResult.user;
      }
      // Fallback: native plugin already created the Firebase session.
      return auth.currentUser;
    }

    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) cacheGoogleAccessToken(credential.accessToken);
    return result.user;
  } catch (error: any) {
    if (error.code !== 'auth/user-cancelled' && error.code !== 'auth/popup-closed-by-user') {
      console.error('Error signing in with Google', error);
    }
    throw error;
  }
};

/**
 * Re-requests a fresh Google OAuth access token with Calendar + Tasks
 * scopes, prompting the sign-in flow again if needed. Call this right
 * before a Calendar/Tasks API call if there's no valid cached token.
 */
export const refreshGoogleAccessToken = async (): Promise<string> => {
  const cached = getCachedGoogleAccessToken();
  if (cached) return cached;

  if (isNative) {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    const result = await FirebaseAuthentication.signInWithGoogle({
      scopes: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/tasks',
      ],
    });
    const accessToken = result.credential?.accessToken;
    if (!accessToken) throw new Error('Could not obtain a Google access token.');
    cacheGoogleAccessToken(accessToken);
    return accessToken;
  }

  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) throw new Error('Could not obtain a Google access token.');
  cacheGoogleAccessToken(credential.accessToken);
  return credential.accessToken;
};

/**
 * Local-only guest mode - works immediately, with zero setup, on every
 * build. Your data still saves (under an anonymous Firebase account), it
 * just isn't tied to a Google identity yet and Calendar/Tasks sync and
 * cross-device sync aren't available in this mode.
 */
export const continueAsGuest = async () => {
  const result = await signInAnonymously(auth);
  return result.user;
};

export const signOut = () => auth.signOut();

// Error handling helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, getDocFromServer, onAuthStateChanged };
export type { User };
