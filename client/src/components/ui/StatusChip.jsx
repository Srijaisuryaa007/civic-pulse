import React from 'react';

export const StatusChip = ({ status, className = '' }) => {
  const normalized = (status || 'Reported').toLowerCase();
  
  let bgClass = 'bg-yellow-500';
  let textClass = 'text-white';
  
  if (normalized === 'resolved') {
    bgClass = 'bg-green-500';
  } else if (normalized === 'in progress') {
    bgClass = 'bg-blue-500';
  }
  
  return (
    <span className={`px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase rounded-full ${bgClass} ${textClass} ${className}`}>
      {status}
    </span>
  );
};
