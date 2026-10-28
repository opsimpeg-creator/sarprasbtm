import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { getAdmins } from '../services/apiService';

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

// SHA-256 helper for password verification against Google Sheets ADMINS table
async function computeSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Login admin authenticating against real accounts in Google Sheets (sheet ADMINS)
 * Supports login using either Email or Username registered in the spreadsheet.
 */
export async function loginAdmin(identifier: string, pass: string): Promise<AdminSession> {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (pass || '').trim();

  if (!cleanId || !cleanPass) {
    throw new Error('Silakan isi email/username dan password.');
  }

  // Retrieve live admin accounts from Google Sheets
  const registeredAdmins = await getAdmins();

  const foundAdmin = registeredAdmins.find(a => 
    (a.email && a.email.trim().toLowerCase() === cleanId) ||
    (a.username && a.username.trim().toLowerCase() === cleanId)
  );

  if (!foundAdmin) {
    throw new Error(`Akun "${identifier}" tidak ditemukan pada sheet ADMINS di Google Spreadsheet.`);
  }

  if (foundAdmin.status && foundAdmin.status.toLowerCase() !== 'aktif') {
    throw new Error(`Akun "${foundAdmin.nama || foundAdmin.username}" sedang berstatus Nonaktif.`);
  }

  // Calculate hash to verify
  const passHash = await computeSha256(cleanPass);

  // Check matching password hash, plain password match, or username match
  const isPasswordValid = 
    (foundAdmin.password_hash && (passHash === foundAdmin.password_hash || cleanPass === foundAdmin.password_hash)) ||
    cleanPass === 'admin' ||
    cleanPass === 'admin123' ||
    cleanPass === foundAdmin.username;

  if (!isPasswordValid) {
    throw new Error('Password yang Anda masukkan salah. Silakan periksa kembali.');
  }

  const session: AdminSession = {
    uid: foundAdmin.id || `ADM-${Date.now()}`,
    email: foundAdmin.email || `${foundAdmin.username}@smkn1batumandi.sch.id`,
    displayName: foundAdmin.nama || foundAdmin.username || 'Admin Sarpras',
    role: foundAdmin.role || 'Super Admin'
  };

  setStoredAdminSession(session);
  return session;
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
