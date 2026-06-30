import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IssueProvider } from './context/IssueContext';
import Navbar from './components/Navbar';
import { GlobalTabSwitchLoader } from './components/ui/CivicLoaders';

// Import Pages
import Home from './pages/Home';
import Report from './pages/Report';
import Issues from './pages/Issues';
import IssueDetail from './pages/IssueDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import MapView from './pages/Map';
import Impact from './pages/Impact';
import BottomNav from './components/BottomNav';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import OnboardingGate from './components/OnboardingGate';
import { ProtectedRoute } from './components/ProtectedRoute';

function RootRedirect() {
  useEffect(() => {
    window.location.replace('/landing.html');
  }, []);
  return null;
}

function TabTransitionLoader() {
  const location = useLocation();
  const [transitioning, setTransitioning] = useState(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setTransitioning(true);
      const timer = setTimeout(() => setTransitioning(false), 580);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  if (!transitioning) return null;
  return <GlobalTabSwitchLoader text="Switching View..." />;
}

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <TabTransitionLoader />
      <div className="flex flex-col min-h-screen bg-base dark:bg-[#0A0D0B] text-inverted dark:text-[#F9F8F6] font-sans transition-colors duration-200 relative">

        <Navbar />
        
        <main className="flex-1 w-full relative z-10 pb-12 md:pb-0">
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
            <Route path="/issues" element={<ProtectedRoute><Issues /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
            <Route path="/issue/:id" element={<ProtectedRoute><IssueDetail /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/impact" element={<ProtectedRoute><Impact /></ProtectedRoute>} />
            {/* Fallback to app */}
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </main>

        {user && <BottomNav />}
        <PwaInstallPrompt />

        {/* ONBOARDING GATE OVERLAY */}
        {user && (!user.onboardingCompleted || !user.country) && (
          <OnboardingGate />
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
