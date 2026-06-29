import React from 'react';

const CATEGORY_STYLES = {
  pothole: 'text-accent-pothole',
  streetlight: 'text-accent-streetlight',
  garbage: 'text-accent-garbage',
  water: 'text-accent-water',
  default: 'text-muted'
};

const DOT_STYLES = {
  pothole: 'bg-accent-pothole',
  streetlight: 'bg-accent-streetlight',
  garbage: 'bg-accent-garbage',
  water: 'bg-accent-water',
  default: 'bg-muted'
};

export const CategoryPill = ({ category, className = '' }) => {
  const normalized = (category || 'other').toLowerCase();
  
  let key = 'default';
  if (normalized.includes('pothole')) key = 'pothole';
  else if (normalized.includes('light')) key = 'streetlight';
  else if (normalized.includes('waste') || normalized.includes('garbage')) key = 'garbage';
  else if (normalized.includes('water') || normalized.includes('leak')) key = 'water';

  const dotClass = DOT_STYLES[key];
  const textClass = CATEGORY_STYLES[key];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[11px] font-medium tracking-wide uppercase shadow-sm border border-border ${className}`}>
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
      <span className="text-inverted">{category}</span>
    </span>
  );
};
