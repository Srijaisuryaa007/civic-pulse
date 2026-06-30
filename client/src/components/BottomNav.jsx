import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconMapPin, IconList, IconPlus, IconChartBar, IconLeaf } from '@tabler/icons-react';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { name: 'Map', path: '/app', icon: IconMapPin },
    { name: 'Feed', path: '/issues', icon: IconList },
    { name: 'Report', path: '/report', icon: IconPlus, isSpecial: true },
    { name: 'Stats', path: '/dashboard', icon: IconChartBar },
    { name: 'Impact', path: '/impact', icon: IconLeaf },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F9F8F6]/95 dark:bg-[#111613]/95 backdrop-blur-lg border-t border-[#EBE5DE] dark:border-stone/20 py-2 px-3 shadow-soft-xl">
      <div className="flex items-center justify-around max-w-sm mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-5 bg-[#1A1A1A] dark:bg-[#D4AF37] text-[#D4AF37] dark:text-[#1A1A1A] h-12 w-12 rounded-full shadow-soft-lg border-2 border-[#D4AF37] dark:border-[#1A1A1A] active:scale-95 transition-transform"
              >
                <Icon className="h-6 w-6 stroke-[2]" />
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-[#1A1A1A] dark:text-[#D4AF37] font-bold'
                  : 'text-[#6C6863] dark:text-muted hover:text-[#1A1A1A]'
              }`}
            >
              <Icon className="h-5 w-5 stroke-[1.5]" />
              <span className="text-[10px] font-sans uppercase tracking-wider">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
