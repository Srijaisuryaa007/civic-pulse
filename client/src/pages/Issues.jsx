import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronLeft, ChevronRight, ThumbsUp, Calendar, MapPin, Eye } from 'lucide-react';

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
  const itemsPerPage = 6;

  // Selected issue for similar issues sidebar widget
  const [selectedForSidebar, setSelectedForSidebar] = useState(null);

  const getCategoryEmoji = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c === 'pothole') return '🚧';
    if (c === 'water leak') return '💧';
    if (c === 'streetlight') return '💡';
    if (c === 'waste') return '🗑️';
    return '📋';
  };

  const getSeverityLabel = (severity) => {
    const sev = Number(severity) || 1;
    if (sev >= 8) return 'Critical';
    if (sev >= 4) return 'Moderate';
    return 'Minor';
  };

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

  const activeSidebarIssue = selectedForSidebar || filtered[0] || null;

  const getSimilarIssues = (activeIssue) => {
    if (!activeIssue) return [];
    const lat1 = Number(activeIssue.location?.latitude);
    const lon1 = Number(activeIssue.location?.longitude);

    return issues.filter(issue => {
      if (issue.id === activeIssue.id) return false;
      if (issue.category !== activeIssue.category) return false;

      const lat2 = Number(issue.location?.latitude);
      const lon2 = Number(issue.location?.longitude);
      if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return false;

      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;

      return dist <= 2.0;
    }).slice(0, 3);
  };

  const similarIssues = getSimilarIssues(activeSidebarIssue);

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-paper">
      
      {/* Page Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone pb-6 mb-8">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-forest">
            Public Incident *Catalog*
          </h1>
          <p className="font-body text-sm text-neutral-500 mt-1">Explore and verify community issues. Your coordinates help validate regional priorities.</p>
        </div>
        <Link
          to={user ? "/report" : "#"}
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              alert("Please sign in first to report issues.");
            }
          }}
          className="px-6 py-3 bg-forest hover:bg-terracotta text-white rounded-full text-xs font-mono font-bold uppercase tracking-widest transition-all shadow-soft hover:shadow-soft-md self-stretch md:self-auto text-center"
        >
          File Report
        </Link>
      </div>

      {/* Filter Row (Pill styling inputs) */}
      <div className="border border-stone p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-10 bg-paper rounded-[24px] shadow-soft">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search catalog details..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2 text-xs font-mono border border-stone bg-paper rounded-full focus:bg-neutral-50 focus:outline-none"
          />
        </div>

        {/* Category */}
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

        {/* Severity */}
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

        {/* Status */}
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

        {/* Sort */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="h-44 w-full bg-neutral-100 animate-pulse rounded-[32px] border border-stone" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
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
        /* Staggered Grid Layout split */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
          
          {/* Feed Card Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {paginatedIssues.map((issue, idx) => {
                const badgeLabel = getSeverityLabel(issue.severity);
                const emoji = getCategoryEmoji(issue.category);
                const isSelected = activeSidebarIssue?.id === issue.id;

                // Alternate cards are translated vertically to break the grid (Organic/Botanical staggered feel)
                const isStaggered = idx % 2 === 1;

                return (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedForSidebar(issue)}
                    className={`group relative flex flex-col bg-paper border rounded-[32px] transition-all duration-500 overflow-hidden cursor-pointer shadow-soft hover:shadow-soft-xl ${
                      isStaggered ? 'md:translate-y-6' : ''
                    } ${
                      isSelected 
                        ? 'border-sage ring-2 ring-sage/10' 
                        : 'border-stone hover:-translate-y-1'
                    }`}
                  >
                    {/* Thumbnail Image (Roman Arch style) */}
                    <div className="aspect-video w-full overflow-hidden bg-neutral-100 border-b border-stone relative">
                      <img
                        src={issue.imageUrl}
                        alt={issue.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase bg-paper/90 text-forest backdrop-blur-sm border border-stone/55 shadow-soft">
                        {emoji} {issue.category}
                      </span>

                      {/* Status Badge */}
                      <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider shadow-soft border ${
                        issue.status === 'Resolved' ? 'bg-terracotta text-white border-transparent' :
                        issue.status === 'In Progress' ? 'bg-[#DCCFC2] text-forest border-transparent' :
                        issue.status === 'Verified' ? 'bg-forest text-white border-transparent' : 'bg-paper text-forest border-stone'
                      }`}>
                        {issue.status}
                      </span>
                    </div>

                    {/* Card details */}
                    <div className="p-5 flex-1 flex flex-col relative">
                      {/* Leaf overlay texture */}
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(140,154,132,0.02)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                      <div className="relative z-10 flex items-center justify-between gap-2 mb-1.5 text-[9px] font-mono uppercase tracking-wider text-neutral-500">
                        <span className={`px-2 py-0.5 rounded-full border border-stone bg-[#FDFDFB] ${
                          badgeLabel === 'Critical' ? 'text-terracotta border-terracotta/30' : 'text-neutral-500'
                        }`}>
                          {badgeLabel} INDEX: {issue.severity}/10
                        </span>
                        <span className="flex items-center gap-0.5 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-sage" />
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="relative z-10 font-serif text-lg font-bold text-forest leading-snug hover:text-terracotta transition-colors mt-2">
                        {issue.title}
                      </h3>
                      <p className="relative z-10 font-body text-xs text-neutral-500 mt-2 line-clamp-2 leading-relaxed flex-1">
                        {issue.description}
                      </p>

                      {/* Card Footer Actions */}
                      <div className="relative z-10 flex items-center justify-between border-t border-stone pt-3.5 mt-4 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            upvoteIssue(issue.id);
                          }}
                          className={`flex items-center gap-1 font-bold transition-colors ${
                            issue.upvotedBy?.includes(user?.uid)
                              ? 'text-terracotta'
                              : 'text-neutral-500 hover:text-forest'
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span>Votes: {issue.upvotes || 0}</span>
                        </button>

                        <Link
                          to={`/issue/${issue.id}`}
                          className="flex items-center gap-1 font-bold text-neutral-500 hover:text-terracotta"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>File Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-10">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full border border-stone bg-paper disabled:opacity-30 hover:bg-neutral-50 transition-colors shadow-soft"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(idx + 1)}
                    className={`h-8 w-8 text-xs font-mono font-bold rounded-full border transition-colors shadow-soft ${
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
                  className="p-2 rounded-full border border-stone bg-paper disabled:opacity-30 hover:bg-neutral-50 transition-colors shadow-soft"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar Widget - Styled like a detailed news column box */}
          <div className="space-y-6">
            {activeSidebarIssue && (
              <div className="sticky top-20 border border-stone bg-paper p-5 rounded-[32px] shadow-soft-md relative overflow-hidden">
                {/* Botanical layout grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(140,154,132,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

                <div className="relative z-10 border-b border-stone pb-3 mb-4">
                  <h3 className="font-serif text-lg font-bold text-forest">
                    Active Catalog File
                  </h3>
                  <p className="text-[9px] font-mono text-neutral-400 mt-1 tracking-wider uppercase">REFERENCE: {activeSidebarIssue.id}</p>
                </div>

                <div className="relative z-10 space-y-3.5 text-xs mb-5">
                  <div className="aspect-video w-full border border-stone overflow-hidden relative bg-neutral-100 arch-image shadow-soft">
                    <img src={activeSidebarIssue.imageUrl} alt="Active preview" className="w-full h-full object-cover grayscale" />
                    <div className="absolute inset-0 halftone-placeholder pointer-events-none opacity-5" />
                  </div>
                  
                  <h4 className="font-serif text-sm font-bold text-forest leading-snug">{activeSidebarIssue.title}</h4>
                  
                  <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                    <MapPin className="h-3.5 w-3.5 text-terracotta shrink-0" />
                    <span className="truncate">{activeSidebarIssue.location?.address}</span>
                  </div>
                </div>

                {/* Similar Issues nearby */}
                <div className="relative z-10 border-t border-stone pt-4">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 mb-3">
                    Proximity Duplicates (2km)
                  </h4>
                  
                  {similarIssues.length === 0 ? (
                    <div className="text-center py-5 bg-neutral-50/50 border border-stone border-dashed rounded-[20px]">
                      <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wide">No duplicates found in range</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {similarIssues.map(sim => (
                        <div
                          key={sim.id}
                          onClick={() => setSelectedForSidebar(sim)}
                          className="p-3 bg-neutral-50/50 hover:bg-neutral-50 border border-stone rounded-2xl cursor-pointer transition-colors shadow-soft"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h5 className="font-serif font-bold text-xs text-forest line-clamp-1 leading-snug">{sim.title}</h5>
                            <span className="shrink-0 px-2 py-0.5 border border-stone rounded-full text-[8px] font-mono font-bold text-terracotta">
                              SEV {sim.severity}
                            </span>
                          </div>
                          <p className="text-[9px] font-mono text-neutral-450 mt-1.5 line-clamp-1 leading-normal">{sim.location?.address}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone/50 text-[9px] font-mono uppercase tracking-widest">
                            <span className="text-neutral-450">{sim.status}</span>
                            <span className="font-bold text-terracotta hover:underline">Select &rarr;</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
