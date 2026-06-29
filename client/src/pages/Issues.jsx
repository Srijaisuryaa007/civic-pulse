import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronLeft, ChevronRight, ThumbsUp, MapPin, MessageCircle, Share2 } from 'lucide-react';

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

export default function Issues() {
  const { issues, loading, upvoteIssue } = useIssues();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter & Sort Logic
  let filtered = issues.filter(issue => {
    const catMatch = categoryFilter === 'all' || issue.category?.toLowerCase() === categoryFilter.toLowerCase();
    const statusMatch = statusFilter === 'all' || issue.status?.toLowerCase() === statusFilter.toLowerCase();
    
    const sev = Number(issue.severity) || 1;
    let sevMatch = true;
    if (severityFilter === 'critical') sevMatch = sev >= 8;
    else if (severityFilter === 'moderate') sevMatch = sev >= 4 && sev <= 7;
    else if (severityFilter === 'minor') sevMatch = sev <= 3;

    const query = searchTerm.toLowerCase();
    const searchMatch = !searchTerm || 
      (issue.title || '').toLowerCase().includes(query) ||
      (issue.description || '').toLowerCase().includes(query) ||
      (issue.location?.address || '').toLowerCase().includes(query);

    return catMatch && statusMatch && sevMatch && searchMatch;
  });

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'upvotes') {
      return (b.upvotes || 0) - (a.upvotes || 0);
    }
    if (sortBy === 'severity') {
      return (b.severity || 0) - (a.severity || 0);
    }
    return 0;
  });

  // Pagination bounds
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIssues = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-paper min-h-screen">
      
      {/* Page Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone pb-6 mb-8">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-forest">
            Public Incident *Feed*
          </h1>
          <p className="font-body text-sm text-neutral-500 mt-1">Explore and verify community issues in your area.</p>
        </div>
        <Link
          to={user ? "/report" : "/login"}
          className="px-6 py-3 bg-forest hover:bg-terracotta text-white rounded-full text-xs font-mono font-bold uppercase tracking-widest transition-all shadow-soft hover:shadow-soft-md self-stretch md:self-auto text-center"
        >
          File Report
        </Link>
      </div>

      {/* Filter Row */}
      <div className="border border-stone p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-10 bg-paper rounded-[24px] shadow-soft">
        <div className="relative">
          <input
            type="text"
            placeholder="Search feed..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2 text-xs font-mono border border-stone bg-paper rounded-full focus:bg-neutral-50 focus:outline-none"
          />
        </div>
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 text-xs font-mono font-bold border border-stone bg-paper rounded-full focus:bg-neutral-50 focus:outline-none cursor-pointer"
          >
            <option value="all">Category: All</option>
            <option value="pothole">Category: Potholes</option>
            <option value="water leak">Category: Water Leaks</option>
            <option value="streetlight">Category: Streetlights</option>
            <option value="waste">Category: Waste</option>
          </select>
        </div>
        <div>
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 text-xs font-mono font-bold border border-stone bg-paper rounded-full focus:bg-neutral-50 focus:outline-none cursor-pointer"
          >
            <option value="all">Severity: All</option>
            <option value="critical">Severity: Critical (8+)</option>
            <option value="moderate">Severity: Moderate (4-7)</option>
            <option value="minor">Severity: Minor (1-3)</option>
          </select>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 text-xs font-mono font-bold border border-stone bg-paper rounded-full focus:bg-neutral-50 focus:outline-none cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="reported">Reported</option>
            <option value="verified">Verified</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono font-bold border border-stone bg-paper rounded-full focus:bg-neutral-50 focus:outline-none cursor-pointer"
          >
            <option value="newest">Order: Newest First</option>
            <option value="upvotes">Order: Most Upvotes</option>
            <option value="severity">Order: High Severity</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="columns-1 md:columns-2 gap-6 space-y-6 pb-16">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="h-[500px] w-full bg-neutral-100 animate-pulse rounded-[32px] border border-stone break-inside-avoid" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-paper border border-stone rounded-[32px] max-w-lg mx-auto shadow-soft relative overflow-hidden">
          <div className="absolute inset-0 halftone-placeholder opacity-5 pointer-events-none" />
          <h3 className="font-serif text-xl font-bold text-forest">No Records Cataloged</h3>
          <p className="text-xs font-body text-neutral-500 max-w-xs mx-auto mt-2 leading-relaxed">
            The catalog is currently empty within the filtered scope. Reset search parameters or report a new issue.
          </p>
          <div className="mt-5">
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCategoryFilter('all'); setSeverityFilter('all'); }}
              className="px-5 py-2 border border-stone bg-transparent text-xs font-mono font-bold uppercase tracking-wider rounded-full hover:bg-neutral-50 transition-colors shadow-soft"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        /* Social Media Masonry Layout */
        <div className="columns-1 md:columns-2 gap-8 space-y-8 pb-16 max-w-5xl mx-auto">
          {paginatedIssues.map((issue) => {
            const userName = issue.reporter?.displayName || 'Citizen Hero';
            const userHandle = `@${userName.toLowerCase().replace(/\s+/g, '_')}`;
            const userInitial = userName.charAt(0).toUpperCase();
            
            return (
              <div
                key={issue.id}
                onClick={() => navigate(`/issue/${issue.id}`)}
                className="break-inside-avoid bg-[#1a1f1c] rounded-[32px] overflow-hidden shadow-2xl border border-[#2c332e] flex flex-col group cursor-pointer transition-transform duration-500 hover:-translate-y-2 hover:shadow-3xl"
              >
                {/* Full Bleed Image Area */}
                <div className="relative w-full aspect-[4/5] bg-neutral-900 overflow-hidden">
                  <img
                    src={issue.imageUrl}
                    alt={issue.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Top Badges */}
                  <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
                    <span className="px-3.5 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 border border-white/10 shadow-lg">
                      <span className={`h-2 w-2 rounded-full ${
                        issue.severity >= 8 ? 'bg-[#f28b82]' : issue.severity >= 4 ? 'bg-[#f5deb3]' : 'bg-[#a3b899]'
                      }`} />
                      {issue.category}
                    </span>
                    <span className={`px-3.5 py-1.5 backdrop-blur-md rounded-full text-[9px] font-mono font-bold uppercase tracking-widest shadow-lg border border-white/10 ${
                      issue.status === 'Resolved' ? 'bg-[#f28b82]/90 text-white' :
                      issue.status === 'In Progress' ? 'bg-[#f5deb3]/90 text-black' :
                      issue.status === 'Verified' ? 'bg-[#a3b899]/90 text-black' :
                      'bg-white/90 text-black'
                    }`}>
                      {issue.status}
                    </span>
                  </div>

                  {/* Bottom Gradient Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#1a1f1c] via-[#1a1f1c]/80 to-transparent pointer-events-none" />
                  
                  {/* Overlaid User Info */}
                  <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-[#a3b899] flex items-center justify-center text-[#1a1f1c] font-serif font-black text-lg border-2 border-[#1a1f1c] shadow-xl shrink-0">
                      {userInitial}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-sm leading-tight drop-shadow-md">
                        {userName}
                      </span>
                      <span className="text-neutral-400 text-[10px] font-mono uppercase tracking-wider mt-0.5">
                        {userHandle} • {timeAgo(issue.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Below Image */}
                <div className="p-6 pt-4 bg-[#1a1f1c]">
                  <h3 className="font-serif text-xl font-bold text-white leading-snug line-clamp-2 group-hover:text-[#f28b82] transition-colors">
                    {issue.title}
                  </h3>
                  <p className="font-body text-neutral-400 text-sm mt-2 line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>

                  {/* Verified Location */}
                  <div className="mt-5 flex items-center gap-2 text-[#a3b899] text-[10px] font-mono uppercase tracking-widest border border-[#a3b899]/20 bg-[#a3b899]/5 rounded-xl px-3 py-2 w-max">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[220px]">{issue.location?.address}</span>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-neutral-400">
                    <div className="flex items-center gap-5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); upvoteIssue(issue.id); }}
                        className={`flex items-center gap-1.5 transition-colors ${
                          issue.upvotedBy?.includes(user?.uid) ? 'text-[#f28b82]' : 'hover:text-white'
                        }`}
                      >
                        <ThumbsUp className="h-4.5 w-4.5" />
                        <span className="text-xs font-mono font-bold">{issue.upvotes || 0}</span>
                      </button>
                      <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                        <MessageCircle className="h-4.5 w-4.5" />
                        <span className="text-xs font-mono font-bold">{issue.commentsCount || 0}</span>
                      </div>
                      <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <Share2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                    
                    <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-white hover:text-[#f28b82] transition-colors flex items-center gap-1">
                      File Details <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 pb-12">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2.5 rounded-full border border-stone bg-paper disabled:opacity-30 hover:bg-neutral-50 transition-colors shadow-soft"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => handlePageChange(idx + 1)}
              className={`h-9 w-9 text-xs font-mono font-bold rounded-full border transition-colors shadow-soft ${
                currentPage === idx + 1
                  ? 'bg-forest text-white border-transparent'
                  : 'border-stone bg-paper hover:bg-neutral-50 text-forest'
              }`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-full border border-stone bg-paper disabled:opacity-30 hover:bg-neutral-50 transition-colors shadow-soft"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
