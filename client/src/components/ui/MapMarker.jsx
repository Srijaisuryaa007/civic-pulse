import React from 'react';

export const MapMarker = ({ category, severity, isPulsing = false }) => {
  const normalized = (category || 'other').toLowerCase();
  
  let color = '#737373'; // default muted
  if (normalized.includes('pothole')) color = '#EF4444';
  else if (normalized.includes('light')) color = '#3B82F6';
  else if (normalized.includes('waste') || normalized.includes('garbage')) color = '#F59E0B';
  else if (normalized.includes('water') || normalized.includes('leak')) color = '#14B8A6';

  const num = Number(severity) || 1;
  const size = Math.max(20, Math.min(36, 16 + (num * 2))); // Scale 20 to 36

  return (
    <div className="relative flex items-center justify-center pointer-events-none" style={{ width: size, height: size }}>
      {isPulsing && (
        <div 
          className="absolute inset-0 rounded-full animate-ping opacity-75"
          style={{ backgroundColor: color }}
        />
      )}
      <svg 
        viewBox="0 0 24 24" 
        fill={color} 
        stroke="#141414" 
        strokeWidth="1.5"
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ width: '100%', height: '100%', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))' }}
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="#ffffff" stroke="none"></circle>
      </svg>
    </div>
  );
};
