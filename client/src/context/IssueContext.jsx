import React, { createContext, useContext, useState, useEffect } from 'react';
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
      // To prevent leaking, backend returns key or we can fetch a config status
      // We will make a simple check
      setGoogleMapsKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
    } catch (e) {
      console.warn("Could not retrieve Google Maps configuration.");
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/issues?limit=100');
      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
      triggerToast("Failed to fetch reports. Operating in offline/simulated mode.", "error");
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
              triggerToast("📢 New civic issue reported nearby in real-time!");
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

  // Report a new issue
  const reportIssue = async (formData) => {
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        body: formData // contains file + location info
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error reporting issue');
      }

      const createdIssue = await response.json();
      setIssues(prev => [createdIssue, ...prev]);
      triggerToast("🎉 Issue reported successfully! 10 XP points earned.");
      refreshPoints();
      return createdIssue;
    } catch (error) {
      console.error("Error reporting issue:", error);
      triggerToast(error.message || "Failed to submit report", "error");
      throw error;
    }
  };

  // Upvote issue
  const upvoteIssue = async (issueId) => {
    if (!user) {
      triggerToast("Please sign in to upvote!", "warning");
      return;
    }
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upvote',
          userId: user.uid
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIssues(prev => prev.map(issue => {
          if (issue.id === issueId) {
            return { ...issue, upvotes: data.upvotes, upvotedBy: data.upvotedBy };
          }
          return issue;
        }));
      }
    } catch (error) {
      console.error("Error upvoting issue:", error);
    }
  };

  // Verify issue
  const verifyIssue = async (issueId) => {
    if (!user) {
      triggerToast("Please sign in to verify issues!", "warning");
      return;
    }
    
    // Check if the current user is the reporter
    const targetIssue = issues.find(i => i.id === issueId);
    if (targetIssue && targetIssue.reporter?.uid === user.uid) {
      triggerToast("You cannot verify your own reported issues!", "error");
      return;
    }

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          userId: user.uid,
          userName: user.displayName,
          userPhoto: user.photoURL
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to verify');
      }

      const data = await response.json();
      setIssues(prev => prev.map(issue => {
        if (issue.id === issueId) {
          return { 
            ...issue, 
            verifications: data.verifications, 
            verifiedBy: data.verifiedBy,
            status: data.status || issue.status 
          };
        }
        return issue;
      }));

      triggerToast("✅ Issue verified! 5 XP points earned.");
      refreshPoints();
    } catch (error) {
      triggerToast(error.message, "error");
    }
  };

  // Update status (e.g. resolve issue - typically admin/municipal authority simulation)
  const updateIssueStatus = async (issueId, status, note = '') => {
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          note
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIssues(prev => prev.map(issue => {
          if (issue.id === issueId) {
            return { ...issue, status: data.status, history: data.history };
          }
          return issue;
        }));
        
        triggerToast(`Status updated to: ${status}!`);
        refreshPoints();
      }
    } catch (error) {
      console.error("Error updating status:", error);
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
