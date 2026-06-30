import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="break-inside-avoid bg-surface rounded-[14px] overflow-hidden border border-border flex flex-col mb-6 animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-[190px] bg-stone/40 dark:bg-stone/20 relative">
        <div className="absolute top-3 left-3 w-20 h-6 rounded-full bg-stone/60 dark:bg-stone/30" />
        <div className="absolute top-3 right-3 w-16 h-6 rounded-full bg-stone/60 dark:bg-stone/30" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-stone/60 dark:bg-stone/30" />
          <div className="flex flex-col gap-1">
            <div className="w-24 h-3 rounded bg-stone/60 dark:bg-stone/30" />
            <div className="w-16 h-2 rounded bg-stone/60 dark:bg-stone/30" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 flex flex-col gap-3">
        <div className="w-3/4 h-4 rounded bg-stone/50 dark:bg-stone/20" />
        <div className="w-full h-3 rounded bg-stone/40 dark:bg-stone/20" />
        <div className="w-2/3 h-3 rounded bg-stone/40 dark:bg-stone/20" />
        <div className="w-1/2 h-3 rounded bg-stone/30 dark:bg-stone/10 mt-1" />
      </div>

      {/* Footer Skeleton */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-base/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-4 rounded bg-stone/40 dark:bg-stone/20" />
          <div className="w-10 h-4 rounded bg-stone/40 dark:bg-stone/20" />
        </div>
        <div className="w-16 h-3 rounded bg-stone/40 dark:bg-stone/20" />
      </div>
    </div>
  );
};
