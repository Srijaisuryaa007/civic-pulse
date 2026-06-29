import React from 'react';

export const SeverityBadge = ({ severity, className = '' }) => {
  const num = Number(severity) || 1;
  
  let bgClass = 'bg-accent-pothole'; // Red for 7-10
  if (num <= 3) bgClass = 'bg-status-resolved'; // Green for 1-3
  else if (num <= 6) bgClass = 'bg-status-reported'; // Amber for 4-6

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[11px] font-medium tracking-wide uppercase shadow-sm border border-border ${className}`}>
      <span className={`w-2 h-2 rounded-full ${bgClass}`} />
      <span className="text-inverted">SEV {num}</span>
    </span>
  );
};
