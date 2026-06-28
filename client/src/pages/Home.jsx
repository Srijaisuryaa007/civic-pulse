import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MapView from '../components/MapView';
import { useIssues } from '../context/IssueContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Flame, CheckCircle2, Users, Map, HelpCircle, X, Leaf } from 'lucide-react';

export default function Home() {
  const { issues } = useIssues();
  const { user, showTutorial, dismissTutorial } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [stats, setStats] = useState({
    resolved: 0,
    citizensHelped: 0,
    neighborhoodsCovered: 0
  });

  // Calculate statistics from issues and users
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await fetch('/api/analytics/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats({
            resolved: data.summary?.resolved || 0,
            citizensHelped: data.summary?.citizensHelped || 0,
            neighborhoodsCovered: data.summary?.neighborhoodsCovered || 0
          });
        }
      } catch (e) {
        // Fallback calculations
        const resCount = issues.filter(i => i.status === 'Resolved').length;
        setStats({
          resolved: resCount,
          citizensHelped: resCount * 12 + issues.length,
          neighborhoodsCovered: Math.max(1, Math.ceil(issues.length / 3))
        });
      }
    };

    fetchDashboardStats();
  }, [issues]);

  const categories = [
    { id: 'all', name: 'All Issues' },
    { id: 'pothole', name: 'Potholes' },
    { id: 'water leak', name: 'Water Leaks' },
    { id: 'streetlight', name: 'Streetlights' },
    { id: 'waste', name: 'Waste / Garbage' }
  ];

  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-paper">
      
      {/* 1. Header Stats Bar (Soft Botanical Grids) */}
      <div className="bg-paper border-b border-stone px-4 py-3 z-20 transition-all duration-300">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sage animate-ping" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500">Hyperlocal Status</h2>
          </div>
          
          <div className="flex items-center gap-6 sm:gap-10 font-mono text-xs sm:text-sm uppercase tracking-wider text-forest">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-sage/10 text-sage">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>Resolved: <strong className="font-bold text-xs font-mono">{stats.resolved}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-sage/10 text-sage">
                <Users className="h-4 w-4" />
              </div>
              <span>Citizens Helped: <strong className="font-bold text-xs font-mono">{stats.citizensHelped}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-sage/10 text-sage">
                <Leaf className="h-4 w-4" />
              </div>
              <span>Wards: <strong className="font-bold text-xs font-mono">{stats.neighborhoodsCovered}</strong></span>
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
        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 max-w-[calc(100%-8rem)]">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-mono uppercase tracking-wider border transition-all duration-500 ${
                activeCategory === cat.id
                  ? 'bg-forest text-white border-transparent rounded-full shadow-soft'
                  : 'bg-paper text-forest hover:bg-neutral-55 border-stone rounded-full shadow-soft'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* 4. Floating Overlay: Heatmap Toggle (Sage/Pill design) */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-mono uppercase tracking-wider border transition-all duration-500 ${
              showHeatmap
                ? 'bg-terracotta text-white border-transparent rounded-full shadow-soft-md'
                : 'bg-paper text-forest hover:bg-neutral-50 border-stone rounded-full shadow-soft'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Heatmap Overlay</span>
          </button>
        </div>

        {/* 5. Floating Action Button (FAB) (Pill Circle shape) */}
        <div className="absolute bottom-6 right-6 z-25">
          <Link
            to={user ? "/report" : "/login"}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-forest text-white shadow-soft-md hover:scale-105 active:scale-95 transition-all duration-500 hover:bg-terracotta relative group"
            id="fab-report-button"
          >
            <Plus className="h-5 w-5" />
            <span className="absolute right-14 bg-forest text-white text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full shadow-soft pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
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
    </div>
  );
}
