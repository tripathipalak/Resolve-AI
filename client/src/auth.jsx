import { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { auth as firebaseAuth } from './firebase';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Runs on page load and whenever the Firebase session changes.
  useEffect(() => onAuthStateChanged(firebaseAuth, async fbUser => {
    if (fbUser) {
      try {
        setProfile(await api('/auth/me', { auth: true }));
      } catch {
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
    setLoading(false);
  }), []);

  // Confirms the Firebase user is a registered agent. Signs out if not.
  async function loadProfile() {
    try {
      setProfile(await api('/auth/me', { auth: true }));
    } catch (err) {
      await signOut(firebaseAuth);
      throw new Error(
        err.message.includes('not registered')
          ? 'This account is not registered as an agent. Ask an admin to invite you.'
          : err.message
      );
    }
  }

  async function loginWithEmail(email, password, rememberMe) {
    await setPersistence(
      firebaseAuth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
    await signInWithEmailAndPassword(firebaseAuth, email, password);
    await loadProfile();
  }

  async function loginWithGoogle() {
    await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    await loadProfile();
  }

  async function logout() {
    await signOut(firebaseAuth);
  }

  return (
    <AuthContext.Provider value={{
      user: profile, loading, isAuthed: Boolean(profile),
      loginWithEmail, loginWithGoogle, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);