import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MapView from '../components/MapView';
import { useIssues } from '../context/IssueContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Flame, CheckCircle2, Users, Map, HelpCircle, X, Leaf, Globe } from 'lucide-react';
import LocationSwitcherModal from '../components/ui/LocationSwitcherModal';

export default function Home() {
  const { issues } = useIssues();
  const { user, showTutorial, dismissTutorial } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [stats, setStats] = useState({
    resolved: 0,
    citizensHelped: 0,
    neighborhoodsCovered: 0
  });

  // Calculate statistics from issues and users
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const queryParams = new URLSearchParams({
          country: user?.country || '',
          city: user?.city || ''
        }).toString();
        const res = await fetch(`/api/analytics/dashboard?${queryParams}`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            resolved: data.summary?.resolved || 0,
            citizensHelped: data.summary?.citizensHelped || 0,
            neighborhoodsCovered: data.summary?.neighborhoodsCovered || 0
          });
        }
      } catch (e) {
        const resCount = issues.filter(i => i.status === 'Resolved').length;
        setStats({
          resolved: resCount,
          citizensHelped: resCount * 14 + issues.length * 8,
          neighborhoodsCovered: new Set(issues.map(i => i.location?.address?.split(',')[0])).size
        });
      }
    };

    fetchDashboardStats();
  }, [issues, user?.country, user?.city]);

  const categories = [
    { id: 'all', name: 'All Issues' },
    { id: 'pothole', name: 'Potholes' },
    { id: 'water leak', name: 'Water Leaks' },
    { id: 'streetlight', name: 'Streetlights' },
    { id: 'waste', name: 'Waste / Garbage' }
  ];

  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-paper">
      
      {/* 1. Header Stats Bar */}
      <div className="bg-[#F9F8F6] border-b border-[#EBE5DE] px-4 py-3 z-20 transition-all duration-300">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <h2 className="text-[11px] font-sans font-semibold uppercase tracking-[0.15em] text-[#6C6863] flex items-center gap-1.5">
              <span>Hyperlocal Status:</span>
              <span className="text-[#1A1A1A] font-bold font-mono text-[10px] normal-case bg-stone/20 px-2 py-0.5 rounded-full">
                📍 {user?.city || 'San Francisco'}, {user?.country || 'United States'}
              </span>
            </h2>
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-2.5 py-0.5 border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#1A1A1A] text-[#D4AF37] rounded-full transition-all text-[9px] font-mono uppercase font-bold shadow-soft"
            >
              Change Location
            </button>
          </div>
          
          <div className="flex items-center gap-6 sm:gap-10 font-sans text-[11px] uppercase tracking-[0.15em] font-semibold text-[#6C6863]">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37]">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>Resolved: <strong className="font-serif font-bold text-sm text-[#1A1A1A] ml-1">{stats.resolved}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-[#1A1A1A]/10 text-[#1A1A1A]">
                <Users className="h-4 w-4" />
              </div>
              <span>Citizens Helped: <strong className="font-serif font-bold text-sm text-[#1A1A1A] ml-1">{stats.citizensHelped}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37]">
                <Leaf className="h-4 w-4" />
              </div>
              <span>Wards: <strong className="font-serif font-bold text-sm text-[#1A1A1A] ml-1">{stats.neighborhoodsCovered}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Map Layout */}
      <div className="relative flex-1">
        <MapView 
          issues={issues} 
          showHeatmap={showHeatmap} 
          activeCategory={activeCategory} 
        />

        {/* 3. Floating Overlay: Category Filters (Pill design) */}
        <div data-tour="map-filters" className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 max-w-[calc(100%-8rem)]">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-sans uppercase tracking-[0.15em] font-semibold border transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-[#1A1A1A] text-[#FFFFFF] border-transparent rounded-full shadow-soft'
                  : 'bg-[#F9F8F6] text-[#1A1A1A] hover:bg-[#EBE5DE]/50 border-[#EBE5DE] rounded-full shadow-soft'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* 4. Floating Overlay: Heatmap Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-sans uppercase tracking-[0.15em] font-semibold border transition-all duration-300 ${
              showHeatmap
                ? 'bg-[#D4AF37] text-[#1A1A1A] border-transparent rounded-full shadow-soft-md'
                : 'bg-[#F9F8F6] text-[#1A1A1A] hover:bg-[#EBE5DE]/50 border-[#EBE5DE] rounded-full shadow-soft'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Heatmap Overlay</span>
          </button>
        </div>

        {/* 5. Floating Action Button (FAB) */}
        <div className="absolute bottom-6 right-6 z-30">
          <Link
            data-tour="report-btn"
            to={user ? "/report" : "/login"}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1A1A] text-[#D4AF37] shadow-soft-md hover:scale-105 active:scale-95 transition-all duration-300 hover:bg-[#D4AF37] hover:text-[#1A1A1A] relative group border border-[#D4AF37]/30"
            id="fab-report-button"
          >
            <Plus className="h-5 w-5" />
            <span className="absolute right-14 bg-[#1A1A1A] text-[#FFFFFF] text-[10px] font-sans uppercase tracking-[0.15em] px-3.5 py-2 rounded-full shadow-soft pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap border border-[#EBE5DE]/20">
              Report Issue
            </span>
          </Link>

          {/* 6. Onboarding Tutorial Tooltip (Highly rounded, Sage border) */}
          {showTutorial && (
            <div className="absolute bottom-14 right-0 w-72 rounded-[24px] border border-sage/30 bg-paper p-5 shadow-soft-xl animate-slideUp z-30">
              <div className="flex items-start justify-between">
                <div className="flex gap-2">
                  <HelpCircle className="h-5 w-5 text-terracotta shrink-0" />
                  <div>
                    <h4 className="font-serif text-sm font-bold text-forest leading-tight">Welcome, Hero</h4>
                    <p className="text-xs font-body text-neutral-500 mt-2 leading-relaxed">
                      Your keys are registered. Click this **circular "+" button** to submit incident evidence. The AI engine will index details dynamically.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={dismissTutorial}
                  className="text-neutral-400 hover:text-forest focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={dismissTutorial}
                  className="bg-forest hover:bg-terracotta text-white rounded-full py-1.5 px-4 text-[9px] font-mono uppercase tracking-widest transition-colors shadow-soft"
                >
                  Acknowledge Instructions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LocationSwitcherModal 
        isOpen={showLocationModal} 
        onClose={() => setShowLocationModal(false)} 
      />
    </div>
  );
}
