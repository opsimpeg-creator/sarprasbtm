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

async function sha256Browser(message: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return message;
  }
}

export async function loginAdmin(email: string, pass: string): Promise<AdminSession> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  // 1. Authenticate against Server API (/api/auth/login) which uses Spreadsheet Database ADMINS
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPass })
    });

    const json = await res.json();
    if (res.ok && json.success && json.session) {
      setStoredAdminSession(json.session);
      return json.session;
    } else if (json.message && !json.message.includes('<!DOCTYPE') && !json.message.includes('404')) {
      throw new Error(json.message);
    }
  } catch (err: any) {
    // If the server explicitly returned an auth error (e.g. wrong password or email not found), throw it
    if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch') && !err.message.includes('<!DOCTYPE') && !err.message.includes('JSON')) {
      throw err;
    }
    console.warn('Server auth fetch issue, falling back to direct sheet/local checks:', err?.message);
  }

  // 2. Direct check against Google Apps Script Web App (sheet=ADMINS)
  try {
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbzi4ytGLJtfbDEQqLA-m5MnOTqJsKP5Aj2ALuZyMPhphUPz45o4d1FqvsoeQZt5QC36KA/exec?sheet=ADMINS';
    const res = await fetch(appsScriptUrl);
    if (res.ok) {
      const text = await res.text();
      const trimmed = text.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const admins = JSON.parse(trimmed);
        if (Array.isArray(admins)) {
          const hashedInput = await sha256Browser(cleanPass);
          const found = admins.find((a: any) => {
            const aEmail = String(a.email || '').trim().toLowerCase();
            const aUser = String(a.username || '').trim().toLowerCase();
            return aEmail === cleanEmail || aUser === cleanEmail;
          });

          if (found) {
            const storedPass = String(found.password_hash || found.password || '').trim();
            const isValid = 
              storedPass === cleanPass || 
              storedPass.toLowerCase() === cleanPass.toLowerCase() ||
              storedPass === hashedInput ||
              storedPass.toLowerCase() === hashedInput.toLowerCase();

            if (isValid) {
              const session: AdminSession = {
                uid: found.id || `ADM-${Date.now()}`,
                email: found.email || `${cleanEmail}@smkn1batumandi.sch.id`,
                displayName: found.nama || found.username || 'Admin Sarpras',
                role: found.role || 'Petugas Sarpras'
              };
              setStoredAdminSession(session);
              return session;
            } else {
              throw new Error('Password yang Anda masukkan salah. Periksa kembali password administrator Anda.');
            }
          }
        }
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Password yang Anda masukkan salah')) {
      throw err;
    }
    console.warn('Direct Apps Script auth check notice:', err?.message);
  }

  // 3. Check if real Firebase auth is configured
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
      console.warn('Firebase auth check notice:', err?.message);
    }
  }

  // 4. Check custom created or reset admins from localStorage if offline
  const savedAdminsStr = localStorage.getItem('smk_custom_admins_store');
  if (savedAdminsStr) {
    try {
      const customAdmins = JSON.parse(savedAdminsStr);
      if (Array.isArray(customAdmins)) {
        const found = customAdmins.find((a: any) => 
          (a.email && a.email.toLowerCase() === cleanEmail) || 
          (a.username && a.username.toLowerCase() === cleanEmail)
        );
        if (found && found.custom_password && found.custom_password === pass) {
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
    } catch (e) {}
  }

  throw new Error('Email/Username administrator atau password salah. Pastikan akun terdaftar di database Spreadsheet ADMINS.');
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
