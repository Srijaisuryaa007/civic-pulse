import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconHeart, IconMessageCircle, IconShare, IconMapPin, IconArrowRight } from '@tabler/icons-react';
import { AvatarInitials } from './AvatarInitials';
import { StatusChip } from './StatusChip';
import { CategoryPill } from './CategoryPill';

const timeAgo = (dateStr) => {
  if (!dateStr) return 'unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export const IssueCard = ({ issue, onUpvote, userUid }) => {
  const navigate = useNavigate();
  const userName = issue.reporter?.displayName || 'Citizen Hero';
  const userHandle = `@${userName.toLowerCase().replace(/\s+/g, '_')}`;
  
  const hasUpvoted = issue.upvotedBy?.includes(userUid);

  return (
    <div 
      onClick={() => navigate(`/issue/${issue.id}`)}
      className="break-inside-avoid bg-surface rounded-[14px] overflow-hidden border border-border flex flex-col group cursor-pointer issue-card-hover mb-6 active:scale-[0.99] transition-all duration-200"
    >
      {/* Header Image Area - 190px tall */}
      <div className="relative w-full h-[190px] bg-inverted-surface overflow-hidden">
        <img
          src={issue.imageUrl}
          alt={issue.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
          <CategoryPill category={issue.category} className="shadow-none border-none bg-inverted-surface/60 backdrop-blur-md !text-white" />
          <StatusChip status={issue.status} className="shadow-none border-none" />
        </div>

        {/* Bottom Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-inverted/90 to-transparent pointer-events-none" />
        
        {/* Overlaid User Info */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5">
          <AvatarInitials name={userName} size={32} />
          <div className="flex flex-col">
            <span className="text-white font-medium text-[13px] leading-tight drop-shadow-sm">
              {userName}
            </span>
            <span className="text-white/70 text-[11px] mt-0.5 drop-shadow-sm">
              {userHandle} • {timeAgo(issue.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-[15px] font-medium text-inverted leading-snug line-clamp-1">
          {issue.title}
        </h3>
        <p className="text-[13px] text-muted line-clamp-2 leading-relaxed">
          {issue.description}
        </p>

        {/* Location Tag */}
        <div className="mt-2 flex items-center gap-1.5 text-muted text-[11px] w-max max-w-full">
          <IconMapPin size={14} className="shrink-0" />
          <span className="truncate">{issue.location?.address}</span>
        </div>
      </div>

      {/* Footer Action Row */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-base/50">
        <div className="flex items-center gap-4 text-muted">
          <button 
            onClick={(e) => { e.stopPropagation(); onUpvote(issue.id); }}
            className={`flex items-center gap-1.5 transition-colors ${hasUpvoted ? 'text-accent-pothole' : 'hover:text-inverted'}`}
          >
            <IconHeart size={18} stroke={1.5} className={hasUpvoted ? 'fill-accent-pothole' : ''} />
            <span className="text-[12px] font-medium">{issue.upvotes || 0}</span>
          </button>
          
          <div className="flex items-center gap-1.5 hover:text-inverted transition-colors cursor-pointer">
            <IconMessageCircle size={18} stroke={1.5} />
            <span className="text-[12px] font-medium">{issue.commentsCount || 0}</span>
          </div>
          
          <button className="flex items-center gap-1.5 hover:text-inverted transition-colors" onClick={(e) => e.stopPropagation()}>
            <IconShare size={18} stroke={1.5} />
          </button>
        </div>
        
        <div className="text-[11px] font-medium text-muted group-hover:text-inverted transition-colors flex items-center gap-1">
          File details <IconArrowRight size={14} stroke={2} />
        </div>
      </div>
    </div>
  );
};
