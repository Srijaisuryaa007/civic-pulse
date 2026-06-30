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
import { GlobalTabSwitchLoader } from '../components/ui/CivicLoaders';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Check local cache for persistence across offline or simulation states
          const localCache = localStorage.getItem(`civicpulse_profile_${firebaseUser.uid}`);
          const parsedCache = localCache ? JSON.parse(localCache) : {};

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
              username: parsedCache.username || '',
              country: parsedCache.country || '',
              region: parsedCache.region || '',
              city: parsedCache.city || '',
              ward: parsedCache.ward || '',
              age: parsedCache.age || null,
              locationCoordinates: parsedCache.locationCoordinates || null,
              onboardingCompleted: parsedCache.onboardingCompleted || false,
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
          
          // Merge Firebase user + Firestore profile + local cache
          const profileSnap = await getDoc(userRef);
          const profile = profileSnap.exists() ? profileSnap.data() : {};
          const mergedUser = { ...firebaseUser, ...profile, ...parsedCache };
          setUser(mergedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        if (firebaseUser) {
          const localCache = localStorage.getItem(`civicpulse_profile_${firebaseUser.uid}`);
          const parsedCache = localCache ? JSON.parse(localCache) : {};
          setUser({
            ...firebaseUser,
            role: 'citizen',
            xp: 0,
            reportsCount: 0,
            verifiedCount: 0,
            badges: [],
            displayName: firebaseUser.displayName || 'Citizen',
            photoURL: firebaseUser.photoURL || null,
            ...parsedCache
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
      const updated = { ...user, username };
      setUser(updated);
      localStorage.setItem(`civicpulse_profile_${user.uid}`, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to set username:", error);
    }
    setLoading(false);
  };

  const completeOnboarding = async (onboardingData) => {
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        username: onboardingData.username || user.username || '',
        country: onboardingData.country || '',
        region: onboardingData.region || '',
        city: onboardingData.city || '',
        ward: onboardingData.ward || '',
        age: Number(onboardingData.age) || null,
        locationCoordinates: onboardingData.locationCoordinates || null,
        onboardingCompleted: true
      };

      const updatedUser = { ...user, ...payload };
      setUser(updatedUser);
      localStorage.setItem(`civicpulse_profile_${user.uid}`, JSON.stringify(updatedUser));

      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, payload, { merge: true });
        // Also sync to backend sim-user if needed
        fetch('/api/issues/sim-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            displayName: user.displayName,
            username: payload.username,
            photoURL: user.photoURL
          })
        }).catch(() => {});
      } catch (firestoreErr) {
        console.warn("Firestore save failed during onboarding, relied on localStorage persistence:", firestoreErr);
      }
    } catch (err) {
      console.error("Error completing onboarding:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshPoints = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const profile = userSnap.data();
        const localCache = localStorage.getItem(`civicpulse_profile_${user.uid}`);
        const parsedCache = localCache ? JSON.parse(localCache) : {};
        setUser(prev => ({ ...prev, ...profile, ...parsedCache }));
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
      setUsername, completeOnboarding, refreshPoints
    }}>
      {loading ? (
        <GlobalTabSwitchLoader text="Connecting to CivicPulse..." />
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
