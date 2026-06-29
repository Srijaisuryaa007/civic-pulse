import React from 'react';

const SEED_COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#14B8A6', '#8B5CF6', '#EC4899'];

export const AvatarInitials = ({ name = 'Citizen', size = 32 }) => {
  // Simple hash function for consistent color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % SEED_COLORS.length;
  const bgColor = SEED_COLORS[colorIndex];
  
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <div 
      className="rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: Math.max(10, size * 0.4)
      }}
    >
      {initials}
    </div>
  );
};
