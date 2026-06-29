import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLogout, IconUser, IconMapPin, IconList, IconChartBar, IconLeaf } from '@tabler/icons-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: 'Map View', path: '/map', icon: IconMapPin },
    { name: 'Issue Feed', path: '/issues', icon: IconList },
    { name: 'Dashboard', path: '/dashboard', icon: IconChartBar },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-stone bg-paper/85 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/10 text-sage hover:scale-105 transition-transform duration-500">
                <IconLeaf className="h-5 w-5 stroke-[1.5]" />
              </div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-forest">
                Civic<span className="italic font-normal text-sage">Pulse</span>
              </span>
            </a>

            {/* Desktop Navigation Links */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold transition-all duration-300 ${
                      isActive 
                        ? 'text-forest font-bold border-b border-forest' 
                        : 'text-neutral-500 hover:text-forest'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Profile / Access actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Points Badge (Pill) */}
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 border border-[#8C9A84] px-4 py-1.5 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#8C9A84] rounded-full hover:bg-sage/10 transition-colors"
                >
                  {user.points || 0} XP
                </Link>

                {/* Profile Pic Menu (Rounded full) */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-stone overflow-hidden focus:outline-none hover:border-sage transition-colors"
                  >
                    <img 
                      src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                      alt="User avatar" 
                      className="h-full w-full object-cover"
                    />
                  </button>

                  {/* Dropdown Menu (highly rounded) */}
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 border border-stone bg-paper p-1 rounded-2xl shadow-soft-lg z-30 overflow-hidden">
                      <div className="px-3.5 py-2.5 border-b border-stone bg-neutral-50/50">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-450">Active Hero</p>
                        <p className="text-xs font-bold truncate text-forest">
                          {user.displayName}
                        </p>
                        {user.username && (
                          <p className="text-[10px] font-mono text-terracotta mt-0.5">
                            @{user.username}
                          </p>
                        )}
                      </div>
                      
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-[#2D3A31] hover:bg-neutral-50 transition-colors"
                      >
                        <IconUser className="h-3.5 w-3.5" />
                        My Profile
                      </Link>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-terracotta hover:bg-neutral-50 transition-colors"
                      >
                        <IconLogout className="h-3.5 w-3.5" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2.5 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider bg-forest text-white hover:bg-terracotta rounded-full active:scale-95 transition-all duration-300 shadow-soft hover:shadow-soft-md"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
