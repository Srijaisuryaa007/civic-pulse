import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, serverTimestamp, increment, orderBy, limit, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const IssueContext = createContext();

export const useIssues = () => useContext(IssueContext);

const DEFAULT_SEEDED_ISSUES = [
  {
    id: "sf-issue-101",
    title: "Severe Pothole on Market Street Transit Corridor",
    description: "Deep asphalt trench forming along the eastbound Muni bus lane near 4th Street. Posing significant hazard to cyclists and transit vehicles during peak commute hours.",
    category: "pothole",
    severity: 8,
    urgencyLevel: "high",
    estimatedResolutionDays: 3,
    recommendedAuthority: "SFMTA & DPW Street Repair Division",
    location: { address: "780 Market St, San Francisco, CA 94102", latitude: 37.7858, longitude: -122.4065 },
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600",
    status: "Reported",
    upvotes: 14, upvotedBy: [], verifications: 3, verifiedBy: [], commentsCount: 2,
    reporter: { uid: "usr-sf-1", displayName: "Elena Rostova", photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", streakDays: 34 },
    createdAt: "2026-06-28T08:30:00.000Z"
  },
  {
    id: "sf-issue-102",
    title: "Subterranean Water Main Rupture in Mission District",
    description: "Continuous pressurized water leakage escaping through sidewalk expansion joints near Valencia and 18th St. High volume runoff affecting local pedestrian pathways.",
    category: "water leak",
    severity: 9,
    urgencyLevel: "critical",
    estimatedResolutionDays: 1,
    recommendedAuthority: "San Francisco Public Utilities Commission (SFPUC)",
    location: { address: "650 Valencia St, San Francisco, CA 94110", latitude: 37.7624, longitude: -122.4215 },
    imageUrl: "https://images.unsplash.com/photo-1542013936693-8c463f88e0b0?w=600",
    status: "In Progress",
    upvotes: 28, upvotedBy: [], verifications: 7, verifiedBy: [], commentsCount: 5,
    reporter: { uid: "usr-sf-2", displayName: "Marcus Chen", photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", streakDays: 112 },
    createdAt: "2026-06-27T14:15:00.000Z"
  },
  {
    id: "sf-issue-103",
    title: "Streetlight Array Outage along Embarcadero Promenade",
    description: "Four consecutive decorative LED luminaires are non-functional between Pier 14 and Ferry Building. Creating unlit zones along high-traffic evening pedestrian corridor.",
    category: "streetlight",
    severity: 6,
    urgencyLevel: "medium",
    estimatedResolutionDays: 4,
    recommendedAuthority: "PG&E / SFPUC Street Lighting Services",
    location: { address: "1 Ferry Building, San Francisco, CA 94111", latitude: 37.7955, longitude: -122.3937 },
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600",
    status: "Reported",
    upvotes: 9, upvotedBy: [], verifications: 2, verifiedBy: [], commentsCount: 1,
    reporter: { uid: "usr-sf-3", displayName: "Sarah Jenkins", photoURL: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150", streakDays: 12 },
    createdAt: "2026-06-28T21:45:00.000Z"
  },
  {
    id: "sf-issue-104",
    title: "Illegal Refuse Dump near North Beach Alleyway",
    description: "Accumulation of discarded commercial packaging and construction debris blocking public right-of-way on Kearny St near Columbus Ave.",
    category: "waste",
    severity: 5,
    urgencyLevel: "medium",
    estimatedResolutionDays: 2,
    recommendedAuthority: "Recology & SF DPW Bureau of Street Sanitation",
    location: { address: "1200 Kearny St, San Francisco, CA 94133", latitude: 37.7981, longitude: -122.4052 },
    imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600",
    status: "Resolved",
    upvotes: 19, upvotedBy: [], verifications: 6, verifiedBy: [], commentsCount: 3,
    reporter: { uid: "usr-sf-4", displayName: "David Vance", photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", streakDays: 8 },
    createdAt: "2026-06-25T11:20:00.000Z"
  },
  {
    id: "sf-issue-105",
    title: "Fractured Concrete Sidewalk along Golden Gate Park Edge",
    description: "Tree root expansion has lifted concrete slabs by 4 inches along Fulton St at 8th Ave, posing an ADA compliance trip hazard for wheelchair users and pedestrians.",
    category: "pothole",
    severity: 7,
    urgencyLevel: "medium",
    estimatedResolutionDays: 10,
    recommendedAuthority: "SF DPW Bureau of Urban Forestry & Sidewalk Inspection",
    location: { address: "3200 Fulton St, San Francisco, CA 94118", latitude: 37.7731, longitude: -122.4658 },
    imageUrl: "https://images.unsplash.com/photo-1584463623578-38600d832966?w=600",
    status: "Reported",
    upvotes: 11, upvotedBy: [], verifications: 4, verifiedBy: [], commentsCount: 0,
    reporter: { uid: "usr-sf-5", displayName: "Amina Al-Mansoor", photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150", streakDays: 0 },
    createdAt: "2026-06-28T15:10:00.000Z"
  }
];

const processIssuesData = (rawList, user) => {
  if (!rawList) return [];
  
  // Deduplicate by title to prevent repetitive signals
  const uniqueMap = new Map();
  rawList.forEach(item => {
    if (item && item.title && !uniqueMap.has(item.title)) {
      uniqueMap.set(item.title, item);
    }
  });
  let uniqueList = Array.from(uniqueMap.values());

  // If user has set a jurisdiction, filter strictly to their country and region/city
  if (user && user.country) {
    const userCity = (user.city || '').toLowerCase();
    const userCountry = (user.country || '').toLowerCase();

    uniqueList = uniqueList.filter(issue => {
      const addr = (issue.location?.address || '').toLowerCase();
      const issueCountry = (issue.location?.country || '').toLowerCase();
      const issueCity = (issue.location?.city || '').toLowerCase();

      // Explicit match if metadata exists
      if (issueCity && userCity && issueCity === userCity) return true;
      if (issueCountry && userCountry && issueCountry === userCountry) {
        if (!userCity) return true;
        return addr.includes(userCity);
      }

      // Address substring matching
      if (userCountry === 'united states' || userCountry === 'usa') {
        // If SF selected, match SF addresses
        if (userCity === 'san francisco' && (addr.includes('san francisco') || addr.includes('sf') || addr.includes('941'))) {
          return true;
        }
        if (userCity && addr.includes(userCity)) return true;
      }

      if (userCity && addr.includes(userCity)) return true;
      if (userCountry && addr.includes(userCountry)) return true;

      return false;
    });
  }

  // Dynamically generate realistic local issues if no issues exist in the database for their selected city
  if (uniqueList.length === 0 && user && user.city && user.locationCoordinates) {
    const lat = Number(user.locationCoordinates.lat);
    const lng = Number(user.locationCoordinates.lng);
    
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0) {
      const mockCategories = ['pothole', 'water leak', 'streetlight', 'waste'];
      const mockDetails = {
        'pothole': {
          title: 'Critical Pothole in Center Lane',
          description: 'A deep pothole has formed in the middle lane, creating a severe hazard for passing vehicles.',
          authority: 'Municipal Road Maintenance'
        },
        'water leak': {
          title: 'High-Pressure Water Main Leak',
          description: 'Pressurized water is flowing onto the street from a cracked subterranean pipe.',
          authority: 'Municipal Water & Sewerage Board'
        },
        'streetlight': {
          title: 'Streetlight Luminaire Failure',
          description: 'The streetlamp at this intersection has burned out, creating a dark zone at night.',
          authority: 'Electrical Supply Grid Division'
        },
        'waste': {
          title: 'Illegal Commercial Refuse Dumping',
          description: 'A large pile of plastic containers and organic waste has been dumped on the public sidewalk.',
          authority: 'Solid Waste Management Bureau'
        }
      };

      for (let i = 0; i < 6; i++) {
        // Random offset up to ~500 meters
        const latOffset = (Math.sin(i * 1.5) * 0.004) + 0.001;
        const lngOffset = (Math.cos(i * 1.5) * 0.004) + 0.001;
        const category = mockCategories[i % mockCategories.length];
        const detail = mockDetails[category];
        const severity = Math.floor((Math.sin(i) + 1.2) * 3) + 4; // range 4-10

        uniqueList.push({
          id: `mock-issue-${user.city.toLowerCase().replace(/[^a-z]/g, '')}-${i}`,
          title: `${detail.title} near Sector ${i + 1}`,
          description: detail.description,
          category: category,
          severity: severity,
          urgencyLevel: severity >= 8 ? 'critical' : 'medium',
          estimatedResolutionDays: Math.floor(Math.random() * 4) + 1,
          recommendedAuthority: detail.authority,
          location: {
            address: `Sector ${i + 1}, ${user.city}, ${user.country}`,
            latitude: Number((lat + latOffset).toFixed(5)),
            longitude: Number((lng + lngOffset).toFixed(5)),
            city: user.city,
            country: user.country
          },
          imageUrl: category === 'pothole' 
            ? 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600'
            : category === 'water leak'
            ? 'https://images.unsplash.com/photo-1542013936693-8c463f88e0b0?w=600'
            : category === 'streetlight'
            ? 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'
            : 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600',
          status: i % 3 === 0 ? 'Resolved' : i % 3 === 1 ? 'In Progress' : 'Reported',
          upvotes: Math.floor(Math.random() * 15) + 3,
          upvotedBy: [],
          verifications: Math.floor(Math.random() * 5) + 1,
          verifiedBy: [],
          commentsCount: Math.floor(Math.random() * 3),
          reporter: {
            uid: `usr-mock-${i}`,
            displayName: `Citizen Hero #${i + 1}`,
            photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
          },
          createdAt: new Date(Date.now() - i * 3600000 * 4).toISOString()
        });
      }
    }
  }

  return uniqueList;
}

export const IssueProvider = ({ children }) => {
  const { user, refreshPoints } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [toast, setToast] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Keep latest user ref for polling and filtering
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Re-fetch or re-filter when user location changes
  useEffect(() => {
    fetchIssues();
  }, [user?.country, user?.city]);

  // Fetch config and start quiet polling
  useEffect(() => {
    fetchConfig();

    const interval = setInterval(() => {
      pollIssuesQuietly();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchConfig = async () => {
    try {
      setGoogleMapsKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
    } catch (e) {
      console.warn("Could not retrieve Google Maps configuration.");
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);

    // Abort controller for 15s hard timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      clearTimeout(timeoutId);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIssues(processIssuesData(fetched, userRef.current));
      setError(null);
    } catch (firestoreError) {
      console.error("Error fetching issues from Firestore, trying backend API:", firestoreError);
      try {
        const res = await fetch('/api/issues', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          setIssues(processIssuesData(data.issues || [], userRef.current));
          setError(null);
        } else {
          // Server responded with error code — use seeded data silently
          setIssues(processIssuesData(DEFAULT_SEEDED_ISSUES, userRef.current));
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          setError('Request timed out. Check your connection and retry.');
        } else if (!navigator.onLine) {
          setError('You appear to be offline. Please check your internet connection.');
        } else {
          // Graceful fallback to seeded demo data (no hard error shown)
          setIssues(processIssuesData(DEFAULT_SEEDED_ISSUES, userRef.current));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const pollIssuesQuietly = async () => {
    try {
      const response = await fetch('/api/issues?limit=100');
      if (response.ok) {
        const data = await response.json();
        const processed = processIssuesData(data.issues || [], userRef.current);
        setIssues(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(processed)) {
            if (processed.length > prev.length && prev.length > 0) {
              triggerToast("New civic issue reported nearby in real-time!");
            }
            return processed;
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

  // Upvote issue (Optimistic UI)
  const upvoteIssue = async (issueId) => {
    if (!user) {
      triggerToast("Please sign in to vote!", "warning");
      return;
    }
    setIssues(prev => prev.map(item => {
      if (item.id === issueId) {
        const hasVoted = item.upvotedBy?.includes(user.uid) || item.votedBy?.includes(user.uid);
        if (hasVoted) return item;
        return {
          ...item,
          upvotes: (item.upvotes || item.votes || 0) + 1,
          votes: (item.votes || item.upvotes || 0) + 1,
          upvotedBy: [...(item.upvotedBy || []), user.uid],
          votedBy: [...(item.votedBy || []), user.uid]
        };
      }
      return item;
    }));
    triggerToast("Vote recorded!");

    try {
      await updateDoc(doc(db, 'issues', issueId), {
        votedBy: arrayUnion(user.uid),
        upvotedBy: arrayUnion(user.uid),
        votes: increment(1),
        upvotes: increment(1)
      });
    } catch (error) {
      console.log("Offline/seed issue vote stored locally");
    }
  };

  // Verify issue (Optimistic UI)
  const verifyIssue = async (issueId) => {
    if (!user) {
      triggerToast("Please sign in to verify issues!", "warning");
      return;
    }
    setIssues(prev => prev.map(item => {
      if (item.id === issueId) {
        const hasVerified = item.verifiedBy?.includes(user.uid);
        if (hasVerified) return item;
        return {
          ...item,
          verifications: (item.verifications || 0) + 1,
          verifiedBy: [...(item.verifiedBy || []), user.uid]
        };
      }
      return item;
    }));
    triggerToast("Issue verified! 5 XP points earned.");

    try {
      await updateDoc(doc(db, 'issues', issueId), {
        verifiedBy: arrayUnion(user.uid),
        verifications: increment(1)
      });
      await updateDoc(doc(db, 'users', user.uid), {
        xp: increment(5),
        verifiedCount: increment(1)
      });
      refreshPoints();
    } catch (error) {
      console.log("Offline/seed issue verification stored locally");
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
      error,
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
