import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'smkn1batumandi.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'smkn1batumandi',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'smkn1batumandi.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:demo'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export interface AdminSession {
  uid: string;
  email: string;
  displayName: string;
  role: string;
}

// Local Session storage helper for smooth admin demo / fallback testing
const ADMIN_SESSION_KEY = 'smkn1_admin_session';

export function getStoredAdminSession(): AdminSession | null {
  try {
    const data = localStorage.getItem(ADMIN_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setStoredAdminSession(session: AdminSession | null) {
  if (session) {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export async function loginAdmin(email: string, pass: string): Promise<AdminSession> {
  // Check if real Firebase auth is configured
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'demo-api-key') {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const session: AdminSession = {
        uid: res.user.uid,
        email: res.user.email || email,
        displayName: res.user.displayName || 'Admin Sarpras SMKN 1 Batumandi',
        role: email.includes('herman') ? 'Super Admin' : 'Petugas Sarpras'
      };
      setStoredAdminSession(session);
      return session;
    } catch (err: any) {
      console.warn('Firebase auth failed or not configured, checking demo credential fallback:', err);
    }
  }

  // Check custom created or reset admins from localStorage
  const savedAdminsStr = localStorage.getItem('smk_custom_admins_store');
  if (savedAdminsStr) {
    try {
      const customAdmins = JSON.parse(savedAdminsStr);
      if (Array.isArray(customAdmins)) {
        const found = customAdmins.find((a: any) => 
          a.email.toLowerCase() === email.toLowerCase() || 
          (a.username && a.username.toLowerCase() === email.toLowerCase())
        );
        if (found && found.custom_password) {
          if (found.custom_password === pass) {
            const session: AdminSession = {
              uid: found.id || `custom-uid-${Date.now()}`,
              email: found.email,
              displayName: found.nama,
              role: found.role || 'Petugas Sarpras'
            };
            setStoredAdminSession(session);
            return session;
          }
        }
      }
    } catch (e) {}
  }

  // Demo Admin Fallback for instant testing
  if (email === 'admin@smkn1batumandi.sch.id' && (pass === 'admin123' || pass === 'smkn1batumandi')) {

    const session: AdminSession = {
      uid: 'demo-admin-uid-1',
      email: 'admin@smkn1batumandi.sch.id',
      displayName: 'Petugas Sarpras SMKN 1 Batumandi',
      role: 'Petugas Sarpras'
    };
    setStoredAdminSession(session);
    return session;
  }

  if (email === 'hermansyaufi96@admin.smk.belajar.id' && (pass === 'admin123' || pass === 'superadmin')) {
    const session: AdminSession = {
      uid: 'demo-admin-uid-2',
      email: 'hermansyaufi96@admin.smk.belajar.id',
      displayName: 'Herman Syaufi (Super Admin)',
      role: 'Super Admin'
    };
    setStoredAdminSession(session);
    return session;
  }

  // Generic fallback if pass is 'admin123'
  if (pass === 'admin123') {
    const session: AdminSession = {
      uid: `demo-uid-${Date.now()}`,
      email: email,
      displayName: email.split('@')[0].toUpperCase(),
      role: 'Petugas Sarpras'
    };
    setStoredAdminSession(session);
    return session;
  }

  throw new Error('Email atau password salah! (Demo password: admin123)');
}

export async function logoutAdmin(): Promise<void> {
  try {
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
  } catch (e) {
    console.warn('Firebase logout notice:', e);
  }
  setStoredAdminSession(null);
}
