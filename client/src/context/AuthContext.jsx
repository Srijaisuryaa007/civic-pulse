import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Create or update user document in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            // First time login — create user profile
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'Citizen',
              photoURL: firebaseUser.photoURL || null,
              username: '', // Let them set it later
              xp: 0,
              role: 'citizen',
              reportsCount: 0,
              verifiedCount: 0,
              badges: [],
              joinedAt: serverTimestamp(),
              lastActive: serverTimestamp()
            });
          } else {
            // Update last active
            await setDoc(userRef, 
              { lastActive: serverTimestamp() }, 
              { merge: true }
            );
          }
          
          // Merge Firebase user + Firestore profile
          const profileSnap = await getDoc(userRef); // Fetch again to get merged data including timestamps
          const profile = profileSnap.exists() ? profileSnap.data() : {};
          setUser({ ...firebaseUser, ...profile });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        if (firebaseUser) {
          setUser({
            ...firebaseUser,
            role: 'citizen',
            xp: 0,
            reportsCount: 0,
            verifiedCount: 0,
            badges: [],
            displayName: firebaseUser.displayName || 'Citizen',
            photoURL: firebaseUser.photoURL || null
          });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  };

  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const registerWithEmail = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    return result.user;
  };

  const logout = () => signOut(auth);

  // Fallback for onboarding the username
  const setUsername = async (username) => {
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { username }, { merge: true });
      setUser(prev => ({ ...prev, username }));
    } catch (error) {
      console.error("Failed to set username:", error);
    }
    setLoading(false);
  };

  const refreshPoints = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const profile = userSnap.data();
        setUser(prev => ({ ...prev, ...profile }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, 
      loginWithGoogle, loginWithEmail, 
      registerWithEmail, logout,
      setUsername, refreshPoints
    }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#080808' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #333', borderTopColor: '#D4AF37', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
