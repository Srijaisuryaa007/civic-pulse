import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp, increment, orderBy, limit, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const IssueContext = createContext();

export const useIssues = () => useContext(IssueContext);

export const IssueProvider = ({ children }) => {
  const { user, refreshPoints } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [toast, setToast] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all issues initially and retrieve maps key
  useEffect(() => {
    fetchIssues();
    fetchConfig();

    // Set up a real-time polling listener (simulates Firebase Firestore live listeners)
    // Every 5 seconds, poll the backend for any updates
    const interval = setInterval(() => {
      pollIssuesQuietly();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchConfig = async () => {
    try {
      // Fetch Google Maps API Key from backend dynamically
      setGoogleMapsKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
    } catch (e) {
      console.warn("Could not retrieve Google Maps configuration.");
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIssues(fetched);
    } catch (error) {
      console.error("Error fetching issues:", error);
      triggerToast("Failed to fetch reports from Firebase.", "error");
    } finally {
      setLoading(false);
    }
  };

  const pollIssuesQuietly = async () => {
    try {
      const response = await fetch('/api/issues?limit=100');
      if (response.ok) {
        const data = await response.json();
        const newIssues = data.issues || [];
        
        // Check if there is a difference in length or updates
        setIssues(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newIssues)) {
            // If length increased, a new issue was reported!
            if (newIssues.length > prev.length && prev.length > 0) {
              triggerToast("New civic issue reported nearby in real-time!");
            }
            return newIssues;
          }
          return prev;
        });
      }
    } catch (e) {
      // Silently fail polling
    }
  };

  // Haversine distance in meters
  const getDistanceMeters = (loc1, loc2) => {
    const R = 6371000;
    const lat1 = loc1.lat * Math.PI / 180;
    const lat2 = loc2.lat * Math.PI / 180;
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // Report a new issue
  const reportIssue = async (issueData) => {
    if (!user) throw new Error("Must be logged in");
    
    // Duplicate check — same user, same location, last 24hrs
    const twentyFourHrsAgo = new Date(Date.now() - 86400000);
    const duplicateQuery = query(
      collection(db, 'issues'),
      where('authorId', '==', user.uid),
      where('category', '==', issueData.category),
      where('createdAt', '>', twentyFourHrsAgo)
    );
    const duplicates = await getDocs(duplicateQuery);
    
    if (!duplicates.empty) {
      // Check location proximity (within 100 meters)
      const tooClose = duplicates.docs.some(docSnap => {
        const existing = docSnap.data();
        if (!existing.location || !issueData.location) return false;
        const distance = getDistanceMeters(
          { lat: Number(existing.location.latitude), lng: Number(existing.location.longitude) },
          { lat: Number(issueData.location.latitude), lng: Number(issueData.location.longitude) }
        );
        return distance < 100;
      });
      if (tooClose) {
        throw new Error('You have already reported a similar issue at this location in the last 24 hours.');
      }
    }
    
    // Add UID + timestamp to every issue
    const docRef = await addDoc(collection(db, 'issues'), {
      ...issueData,
      authorId: user.uid,
      authorName: user.displayName || user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'reported',
      votedBy: [],
      verifiedBy: [],
      votes: 0,
      verifications: 0,
      comments: []
    });
    
    // Award XP to user
    await updateDoc(doc(db, 'users', user.uid), {
      xp: increment(10),
      reportsCount: increment(1)
    });

    const newIssue = { id: docRef.id, ...issueData };
    setIssues(prev => [newIssue, ...prev]);
    triggerToast("Issue reported successfully! 10 XP points earned.");
    refreshPoints();
    return newIssue;
  };

  // Upvote issue
  const upvoteIssue = async (issueId) => {
    if (!user) {
      triggerToast("Please sign in to vote!", "warning");
      return;
    }
    try {
      await updateDoc(doc(db, 'issues', issueId), {
        votedBy: arrayUnion(user.uid),
        votes: increment(1)
      });
      // UI update is now handled by real-time listener in IssueDetail
      triggerToast("Vote recorded!");
    } catch (error) {
      console.error("Error upvoting issue:", error);
      triggerToast("Error recording vote", "error");
    }
  };

  // Verify issue
  const verifyIssue = async (issueId) => {
    if (!user) {
      triggerToast("Please sign in to verify issues!", "warning");
      return;
    }

    try {
      await updateDoc(doc(db, 'issues', issueId), {
        verifiedBy: arrayUnion(user.uid),
        verifications: increment(1)
      });
      
      // Award XP to verifier
      await updateDoc(doc(db, 'users', user.uid), {
        xp: increment(5),
        verifiedCount: increment(1)
      });

      triggerToast("Issue verified! 5 XP points earned.");
      refreshPoints();
    } catch (error) {
      triggerToast(error.message, "error");
    }
  };

  // Update status (e.g. resolve issue - typically admin/municipal authority simulation)
  const updateIssueStatus = async (issueId, status, note = '') => {
    try {
      await updateDoc(doc(db, 'issues', issueId), {
        status,
        updatedAt: serverTimestamp()
      });
      triggerToast(`Status updated to: ${status}!`);
    } catch (error) {
      console.error("Error updating status:", error);
      triggerToast("Failed to update status", "error");
    }
  };

  // Delete issue (for authors)
  const deleteIssue = async (issueId) => {
    try {
      await deleteDoc(doc(db, 'issues', issueId));
      triggerToast("Issue successfully deleted.");
    } catch (error) {
      console.error("Error deleting issue:", error);
      triggerToast("Failed to delete issue", "error");
      throw error;
    }
  };

  // Add comment
  const addComment = async (issueId, text) => {
    if (!user) {
      triggerToast("Please sign in to comment!", "warning");
      return;
    }
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName,
          userPhoto: user.photoURL,
          text
        })
      });

      if (response.ok) {
        const comment = await response.json();
        triggerToast("Comment posted! 2 XP points earned.");
        refreshPoints();
        return comment;
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  return (
    <IssueContext.Provider value={{
      issues,
      loading,
      googleMapsKey,
      reportIssue,
      upvoteIssue,
      verifyIssue,
      updateIssueStatus,
      deleteIssue,
      addComment,
      refreshIssues: fetchIssues,
      toast,
      triggerToast
    }}>
      {children}
      
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur animate-slideUp">
          <div className={`h-2.5 w-2.5 rounded-full ${
            toast.type === 'error' ? 'bg-rose-500' :
            toast.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
          }`} />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {toast.message}
          </span>
        </div>
      )}
    </IssueContext.Provider>
  );
};
