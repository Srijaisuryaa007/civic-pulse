import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';
import { useAuth } from '../context/AuthContext';
import { IconSearch, IconChevronLeft, IconChevronRight, IconFilter } from '@tabler/icons-react';
import { IssueCard } from '../components/ui/IssueCard';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { StatusChip } from '../components/ui/StatusChip';
import { CompassMappingLoader } from '../components/ui/CivicLoaders';

export default function Issues() {
  const { issues, loading, error, refreshIssues, upvoteIssue } = useIssues();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Sidebar state
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter & Sort Logic
  let filtered = issues.filter(issue => {
    const catMatch = categoryFilter === 'all' || issue.category?.toLowerCase() === categoryFilter.toLowerCase();
    const statusMatch = statusFilter === 'all' || issue.status?.toLowerCase() === statusFilter.toLowerCase();
    
    const query = searchTerm.toLowerCase();
    const searchMatch = !searchTerm || 
      (issue.title || '').toLowerCase().includes(query) ||
      (issue.description || '').toLowerCase().includes(query) ||
      (issue.location?.address || '').toLowerCase().includes(query);

    return catMatch && statusMatch && searchMatch;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'upvotes') return (b.upvotes || 0) - (a.upvotes || 0);
    return 0;
  });

  const activeIssue = selectedIssue || filtered[0] || null;
  const similarIssues = activeIssue ? filtered.filter(i => i.id !== activeIssue.id).slice(0, 3) : [];

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIssues = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-base min-h-screen pb-20">
      
      {/* Sticky Top Filter Bar */}
      <div className="sticky top-0 z-40 bg-base/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-medium text-inverted tracking-tight">Active Issues</h1>
            <div className="h-6 w-px bg-border hidden md:block" />
            <div className="relative w-full md:w-64">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-full text-[13px] text-inverted placeholder:text-muted focus:outline-none focus:border-inverted transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 bg-white border border-border rounded-full text-[13px] font-medium text-inverted focus:outline-none cursor-pointer hover:bg-surface transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="pothole">Potholes</option>
              <option value="water leak">Water Leaks</option>
              <option value="streetlight">Streetlights</option>
              <option value="waste">Waste</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white border border-border rounded-full text-[13px] font-medium text-inverted focus:outline-none cursor-pointer hover:bg-surface transition-colors"
            >
              <option value="newest">Newest</option>
              <option value="upvotes">Most Voted</option>
            </select>
            
            <Link
              to={user ? "/report" : "/login"}
              className="px-5 py-2 bg-inverted text-white rounded-full text-[13px] font-medium lift-hover whitespace-nowrap"
            >
              Report Issue
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Feed: 2-col masonry */}
          <div className="lg:col-span-2">
            {error ? (
              <CompassMappingLoader loading={false} error={error} onRetry={refreshIssues || (() => window.location.reload())} isOverlay={false} />
            ) : loading ? (
              <CompassMappingLoader loading={true} error={null} onRetry={refreshIssues || (() => window.location.reload())} text="Loading Issue Feed..." isOverlay={false} />
            ) : paginatedIssues.length === 0 ? (
              <div className="text-center py-24 px-6 bg-[#F9F8F6] border border-[#EBE5DE] rounded-none my-6 relative overflow-hidden shadow-soft">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(212,175,55,0.03)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                <div className="relative z-10 max-w-lg mx-auto">
                  <span className="inline-block text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-[#D4AF37] mb-3">
                    {user?.city ? `${user.city} Registry` : 'Unpopulated Jurisdiction'}
                  </span>
                  <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] tracking-tight">
                    No Issues Reported in Your Area Yet
                  </h3>
                  <p className="text-sm font-sans text-[#6C6863] mt-3 leading-relaxed">
                    Be the first citizen hero to register an infrastructure audit or municipal road hazard in your locality. Your report sets the standard for civic accountability.
                  </p>
                  <div className="mt-8">
                    <Link
                      to="/report"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1A1A1A] text-[#FFFFFF] hover:bg-[#D4AF37] hover:text-[#1A1A1A] font-mono text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 shadow-soft"
                    >
                      <span>File First Municipal Audit</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="columns-1 sm:columns-2 gap-6 space-y-6">
                  {paginatedIssues.map((issue) => (
                    <div key={issue.id} onClick={() => setSelectedIssue(issue)}>
                      <IssueCard 
                        issue={issue} 
                        userUid={user?.uid} 
                        onUpvote={upvoteIssue}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => { setCurrentPage(c => c - 1); window.scrollTo(0,0); }}
                      disabled={currentPage === 1}
                      className="p-2 border border-border rounded-full bg-white text-inverted disabled:opacity-30 hover:bg-surface"
                    >
                      <IconChevronLeft size={16} />
                    </button>
                    <span className="text-[13px] font-medium text-muted mx-2">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => { setCurrentPage(c => c + 1); window.scrollTo(0,0); }}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-border rounded-full bg-white text-inverted disabled:opacity-30 hover:bg-surface"
                    >
                      <IconChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar: Active Catalog */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 bg-white border border-border rounded-[14px] p-5 shadow-sm">
              <h3 className="text-[13px] font-medium text-inverted uppercase tracking-widest mb-4">Active Catalog</h3>
              
              {activeIssue ? (
                <>
                  <div className="mb-6 pb-6 border-b border-border">
                    <div className="w-full h-32 bg-base rounded-[10px] overflow-hidden mb-3">
                      <img src={activeIssue.imageUrl} className="w-full h-full object-cover" />
                    </div>
                    <h4 className="text-[15px] font-medium text-inverted leading-snug">{activeIssue.title}</h4>
                    <p className="text-[12px] text-muted mt-1">{activeIssue.location?.address}</p>
                    <Link to={`/issue/${activeIssue.id}`} className="mt-3 inline-block text-[13px] font-medium text-inverted border-b border-inverted pb-0.5">
                      Open full details →
                    </Link>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-medium text-muted uppercase tracking-wider mb-3">Proximity Duplicates (2km)</h4>
                    {similarIssues.length > 0 ? (
                      <div className="space-y-3">
                        {similarIssues.map(sim => (
                          <div key={sim.id} onClick={() => setSelectedIssue(sim)} className="group cursor-pointer p-3 bg-base/50 rounded-[10px] border border-transparent hover:border-border transition-colors">
                            <h5 className="text-[13px] font-medium text-inverted line-clamp-1">{sim.title}</h5>
                            <div className="flex items-center justify-between mt-2">
                              <StatusChip status={sim.status} />
                              <span className="text-[11px] font-medium text-accent-streetlight opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-muted bg-base/50 p-4 rounded-[10px] text-center">No duplicates found in range.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-muted text-center py-10">Select an issue to view details.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
