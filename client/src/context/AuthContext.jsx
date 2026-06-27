import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if user is stored in local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('civicpulse_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Fetch latest points & profile from backend
      fetchUserProfile(parsedUser.uid);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (uid) => {
    try {
      // In a real app, calls GET /api/users/:uid
      const response = await fetch(`/api/issues?reporterId=${uid}`);
      if (response.ok) {
        // Let's also fetch dashboard/leaderboard to find current user details
        const dashResp = await fetch('/api/analytics/dashboard');
        if (dashResp.ok) {
          const dashData = await dashResp.json();
          const userInLeaderboard = dashData.leaderboard?.find(u => u.uid === uid);
          
          if (userInLeaderboard) {
            const updated = {
              ...JSON.parse(localStorage.getItem('civicpulse_user')),
              points: userInLeaderboard.points || 0,
              badges: userInLeaderboard.badges || []
            };
            setUser(updated);
            localStorage.setItem('civicpulse_user', JSON.stringify(updated));
            setLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch latest user profile, keeping cached details.", err);
    }
    setLoading(false);
  };

  const loginWithGoogleSimulated = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simulated user info
    const mockUid = `google-${Math.random().toString(36).substring(2, 9)}`;
    const newUser = {
      uid: mockUid,
      displayName: "Jane Doe",
      email: "jane.doe@gmail.com",
      photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      username: "", // Blank initially to trigger username setup step
      points: 0,
      badges: [],
      isOnboarded: false
    };

    setUser(newUser);
    localStorage.setItem('civicpulse_user', JSON.stringify(newUser));
    setLoading(false);
  };

  const setUsername = async (username) => {
    if (!user) return;
    setLoading(true);

    const updatedUser = {
      ...user,
      username,
      isOnboarded: true
    };

    // Register user to backend
    try {
      await fetch('/api/issues', {
        method: 'GET' // Just a ping, or we can send profile creation if database handles it.
        // The points system automatically sets profile in database on first report/action.
        // We will also send user data to the backend to create a profile!
      });
      
      // Let's send a registration request to the backend
      // We will make a tiny fetch call to create/update user
      // We can patch /api/issues/users if needed, or simply update local storage.
      // Let's create user document by mimicking point award of 0 points!
      // This is a neat trick: it creates the user record in database.
      await fetch(`/api/issues/sim-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          displayName: user.displayName,
          username: username,
          photoURL: user.photoURL
        })
      }).catch(e => console.log("Sim user registration failed:", e));

    } catch (e) {
      console.log(e);
    }

    setUser(updatedUser);
    localStorage.setItem('civicpulse_user', JSON.stringify(updatedUser));
    setShowTutorial(true); // Trigger tutorial tooltip
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('civicpulse_user');
    setShowTutorial(false);
  };

  const dismissTutorial = () => {
    setShowTutorial(false);
  };

  // Recalculate/refresh points
  const refreshPoints = () => {
    if (user?.uid) {
      fetchUserProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login: loginWithGoogleSimulated,
      logout,
      setUsername,
      showTutorial,
      dismissTutorial,
      refreshPoints
    }}>
      {children}
    </AuthContext.Provider>
  );
};
