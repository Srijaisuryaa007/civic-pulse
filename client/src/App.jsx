import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IssueProvider } from './context/IssueContext';
import Navbar from './components/Navbar';

// Import Pages
import Home from './pages/Home';
import Report from './pages/Report';
import Issues from './pages/Issues';
import IssueDetail from './pages/IssueDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Award, UserCheck, AlertTriangle } from 'lucide-react';

function RootRedirect() {
  useEffect(() => {
    window.location.replace('/landing.html');
  }, []);
  return null;
}

function AppContent() {
  const { user, setUsername } = useAuth();
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState('');

  const handleOnboardSubmit = (e) => {
    e.preventDefault();
    const cleanUsername = usernameInput.trim().toLowerCase();
    
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    setError('');
    setUsername(cleanUsername);
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-paper text-forest font-sans transition-colors duration-200 relative">
        {/* CRITICAL: Fixed Full-screen Paper Grain Overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.012]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2050/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />

        <Navbar />
        
        <main className="flex-1 w-full relative z-10">
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
            <Route path="/issues" element={<ProtectedRoute><Issues /></ProtectedRoute>} />
            <Route path="/issue/:id" element={<ProtectedRoute><IssueDetail /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            {/* Fallback to app */}
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </main>

        {/* ONBOARDING USERNAME SETUP MODAL OVERLAY */}
        {user && !user.username && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 backdrop-blur-sm">
            <div className="w-full max-w-md border border-stone bg-paper p-6 sm:p-8 text-center rounded-[32px] shadow-soft-xl animate-slideUp relative overflow-hidden">
              {/* Internal graphic lines simulating plant veins */}
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(140,154,132,0.03)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
              
              <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage/10 text-sage mb-4 border border-sage/20">
                <Award className="h-7 w-7" />
              </div>
              
              <h2 className="relative z-10 font-serif text-2xl font-bold text-forest tracking-tight">
                Complete Onboarding
              </h2>
              <p className="relative z-10 text-sm font-body text-neutral-500 mt-2 max-w-xs mx-auto leading-relaxed">
                Welcome to CivicPulse. Set up your citizen signature key to file issues and earn community achievements.
              </p>

              <form onSubmit={handleOnboardSubmit} className="relative z-10 mt-6 space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-widest text-neutral-500 mb-1.5 ml-2">
                    Enter Signature Tag
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 font-mono text-xs font-bold text-neutral-400">@</span>
                    <input
                      type="text"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="citizen_hero"
                      className="w-full pl-8 pr-4 py-2.5 text-xs font-mono border-b border-stone bg-transparent text-forest focus:bg-neutral-50 focus:outline-none"
                    />
                  </div>
                  {error && (
                    <p className="text-[10px] font-sans text-terracotta font-bold mt-2 flex items-center gap-1.5 ml-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-forest hover:bg-[#1f2822] text-white text-xs font-mono font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-1 cursor-pointer transition-all duration-300 shadow-soft hover:shadow-soft-md"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Activate Profile</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <IssueProvider>
        <AppContent />
      </IssueProvider>
    </AuthProvider>
  );
}
