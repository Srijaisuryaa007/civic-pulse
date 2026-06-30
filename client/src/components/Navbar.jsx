import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLogout, IconUser, IconMapPin, IconList, IconChartBar, IconLeaf } from '@tabler/icons-react';
import { Sun, Moon, Compass, Sparkles } from 'lucide-react';
import SpotlightWalkthrough from './ui/SpotlightWalkthrough';
import Shuffle from './ui/Shuffle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [tickerIndex, setTickerIndex] = useState(0);
  const [showTour, setShowTour] = useState(false);

  const handleSatelliteClick = () => {
    const flightData = {
      lat: user?.locationCoordinates?.lat || 37.7749,
      lng: user?.locationCoordinates?.lng || -122.4194,
      city: user?.city || "San Francisco",
      country: user?.country || "United States"
    };
    if (location.pathname !== '/app') {
      sessionStorage.setItem('trigger_gta5_map_zoom', JSON.stringify(flightData));
      window.location.href = '/app';
    } else {
      window.dispatchEvent(new CustomEvent('gta5_flight_trigger', { detail: flightData }));
    }
  };

  useEffect(() => {
    if (user && !localStorage.getItem('civicpulse_tour_completed')) {
      const timer = setTimeout(() => {
        if (location.pathname !== '/app') {
          navigate('/app');
          setTimeout(() => setShowTour(true), 600);
        } else {
          setShowTour(true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const liveEvents = [
    "⚡ Pothole reported in Market St Corridor · 2m ago",
    "✅ Water Leak resolved in Indiranagar Ward 12 · 14m ago",
    "💡 Streetlight audit verified in Mission District · 28m ago",
    "♻️ Illegal Dumping cleared in Kensington · 41m ago"
  ];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % liveEvents.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { name: 'Map View', path: '/app', icon: IconMapPin },
    { name: 'Issue Feed', path: '/issues', icon: IconList },
    { name: 'Dashboard', path: '/dashboard', icon: IconChartBar },
    { name: 'Case Studies', path: '/impact', icon: IconLeaf },
  ];

  return (
    <nav className="sticky top-0 z-[1000] w-full border-b border-[#EBE5DE] bg-[#F9F8F6]/90 backdrop-blur-md transition-all duration-300 shadow-soft">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <a href="/landing.html" className="flex items-center gap-2.5 group cursor-pointer">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A1A] text-[#D4AF37] shadow-soft group-hover:scale-105 transition-transform duration-500">
                <IconLeaf className="h-5 w-5 stroke-[1.5]" />
              </div>
              <Shuffle
                text="CIVICPULSE"
                shuffleDirection="right"
                duration={0.4}
                animationMode="evenodd"
                shuffleTimes={2}
                loop={true}
                loopDelay={5}
                stagger={0.04}
                scrambleCharset="CIVICPULSE0123456789"
                colorFrom="#D4AF37"
                tag="span"
                className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1A1A] cursor-pointer whitespace-nowrap inline-flex items-center flex-shrink-0"
              />
            </a>

            {/* Desktop Navigation Links */}
            <div data-tour="nav-tabs" className="hidden md:ml-8 md:flex md:space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-sans uppercase tracking-[0.12em] font-semibold transition-all duration-300 ${
                      isActive 
                        ? 'text-[#1A1A1A] border-b-2 border-[#D4AF37]' 
                        : 'text-[#6C6863] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Live Activity Ticker (Center/Hidden on small screens) */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-[#1A1A1A] text-[#D4AF37] text-xs font-mono rounded-full border border-[#D4AF37]/30 shadow-soft animate-fadeIn">
            <span className="animate-pulse">●</span>
            <span className="truncate max-w-[240px] text-xs text-[#FFFFFF] font-sans">{liveEvents[tickerIndex]}</span>
          </div>

          {/* Right Profile / Access actions */}
          <div className="flex items-center gap-3">
            {/* 3D Satellite Flight Trigger */}
            <button
              data-tour="satellite-btn"
              onClick={handleSatelliteClick}
              title="GTA5 3D Satellite Zoom"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#D4AF37]/50 bg-[#1A1A1A] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all font-mono text-[12px] uppercase font-bold shadow-soft"
            >
              <Compass className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '10s' }} />
              <span>3D Satellite</span>
            </button>

            {/* Interactive Tour Trigger */}
            <button
              onClick={() => {
                if (location.pathname !== '/app') {
                  navigate('/app');
                  setTimeout(() => setShowTour(true), 600);
                } else {
                  setShowTour(true);
                }
              }}
              title="Spotlight Walkthrough"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#D4AF37] bg-[#D4AF37]/15 text-[#1A1A1A] dark:text-[#D4AF37] hover:bg-[#1A1A1A] hover:text-white transition-all font-mono text-[12px] uppercase font-bold shadow-soft"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Walkthrough</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Dark Mode"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EBE5DE] bg-[#FFFFFF] text-[#1A1A1A] hover:bg-[#D4AF37] hover:text-[#FFFFFF] transition-colors shadow-soft"
            >
              {darkMode ? <Sun className="h-4 w-4 text-[#D4AF37]" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <div data-tour="user-profile" className="flex items-center gap-3">
                {/* Points Badge (Pill) */}
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-xs font-sans font-bold uppercase tracking-[0.12em] text-[#1A1A1A] rounded-full hover:bg-[#D4AF37]/20 transition-colors shadow-soft"
                >
                  {user.points || 0} XP
                </Link>

                {/* Profile Pic Menu (Rounded full) */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#D4AF37] overflow-hidden focus:outline-none hover:scale-105 transition-transform shadow-soft"
                  >
                    <img 
                      src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                      alt="User avatar" 
                      className="h-full w-full object-cover"
                    />
                  </button>

                  {/* Dropdown Menu (editorial styled) */}
                  {menuOpen && (
                    <div className="absolute right-0 mt-3 w-56 border border-[#EBE5DE] bg-[#F9F8F6] p-2 rounded-2xl shadow-soft-xl z-30 overflow-hidden font-sans">
                      <div className="px-4 py-3 border-b border-[#EBE5DE] bg-[#EBE5DE]/30 rounded-t-xl mb-1">
                        <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6C6863]">Active Hero</p>
                        <p className="text-sm font-serif font-bold truncate text-[#1A1A1A] mt-0.5">
                          {user.displayName}
                        </p>
                        {user.username && (
                          <p className="text-[11px] font-sans text-[#D4AF37] font-medium mt-0.5">
                            @{user.username}
                          </p>
                        )}
                      </div>
                      
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-sans font-medium uppercase tracking-[0.08em] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all duration-200"
                      >
                        <IconUser className="h-4 w-4 text-[#D4AF37]" />
                        My Profile
                      </Link>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-sans font-medium uppercase tracking-[0.08em] text-[#6C6863] hover:bg-[#1A1A1A] hover:text-white transition-all duration-200 mt-0.5"
                      >
                        <IconLogout className="h-4 w-4 text-[#D4AF37]" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2.5 text-[13px] font-sans font-bold uppercase tracking-[0.12em] bg-[#1A1A1A] text-[#FFFFFF] hover:bg-[#D4AF37] hover:text-[#1A1A1A] rounded-full active:scale-95 transition-all duration-300 shadow-soft hover:shadow-soft-md"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* SPOTLIGHT WALKTHROUGH TOUR */}
      <SpotlightWalkthrough isOpen={showTour} onClose={() => setShowTour(false)} />
    </nav>
  );
}
