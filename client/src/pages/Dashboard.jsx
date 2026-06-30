import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Award, Zap, AlertTriangle, Flame, ShieldCheck } from 'lucide-react';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { CompassMappingLoader } from '../components/ui/CivicLoaders';

export default function Dashboard() {
  const { issues, loading, error, refreshIssues } = useIssues();
  const { user } = useAuth();

  const [selectedArea, setSelectedArea] = useState('Metro Area');
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState('xp'); // 'xp' or 'streaks'

  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    avgResolutionTime: '3.4 days',
    topAreas: [],
    leaderboard: [],
    wardStreaks: []
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const queryParams = new URLSearchParams({
          country: user?.country || '',
          city: user?.city || ''
        }).toString();
        const res = await fetch(`/api/analytics/dashboard?${queryParams}`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            total: data.summary?.total || 0,
            resolved: data.summary?.resolved || 0,
            pending: data.summary?.pending || 0,
            avgResolutionTime: data.avgResolutionTime || '3.4 days',
            topAreas: data.topAreas || [],
            leaderboard: data.leaderboard || [],
            wardStreaks: data.wardStreaks || []
          });
        }
      } catch (err) {
        console.error("Dashboard stats fetch failed:", err);
      }
    };

    fetchDashboardStats();
  }, [issues, user?.country, user?.city]);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoadingInsights(true);
      try {
        const res = await fetch(`/api/analytics/predictive-insights?area=${encodeURIComponent(selectedArea)}`);
        if (res.ok) {
          const data = await res.json();
          setInsights(data);
        }
      } catch (err) {
        console.error("Predictive insights fetch failed:", err);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchInsights();
  }, [selectedArea, issues]);

  // Chart Data: Statuses
  const rawStatusData = [
    { name: 'Reported', value: issues.filter(i => (i.status || '').toLowerCase() === 'reported').length, color: '#D4AF37' },
    { name: 'Verified', value: issues.filter(i => (i.status || '').toLowerCase() === 'verified').length, color: '#8C7B65' },
    { name: 'In Progress', value: issues.filter(i => (i.status || '').toLowerCase() === 'in progress').length, color: '#6C6863' },
    { name: 'Resolved', value: issues.filter(i => (i.status || '').toLowerCase() === 'resolved').length, color: '#1A1A1A' }
  ];
  const totalStatusValue = rawStatusData.reduce((sum, item) => sum + item.value, 0);
  const statusData = totalStatusValue > 0 ? rawStatusData.filter(item => item.value > 0) : [
    { name: 'Awaiting Reports', value: 1, color: '#D4AF37' }
  ];

  // Chart Data: Categories
  const categoryCounts = issues.reduce((acc, curr) => {
    const cat = curr.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.keys(categoryCounts).map(name => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: categoryCounts[name],
  }));

  const areas = ['Metro Area', 'Downtown Zone', 'Industrial Ward', 'Residential Block B'];

  // Sorted Leaderboard
  const sortedLeaderboard = [...(stats.leaderboard || [])].sort((a, b) => {
    if (leaderboardTab === 'streaks') {
      return (b.streakDays || 0) - (a.streakDays || 0);
    }
    return (b.points || 0) - (a.points || 0);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 bg-base dark:bg-[#0A0D0B] min-h-screen text-inverted transition-colors">
      
      {/* Editorial Header */}
      <div className="border-b border-border pb-6">
        <span className="inline-block text-xs font-mono uppercase tracking-widest font-bold text-[#D4AF37] mb-2">
          Jurisdiction Telemetry
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-inverted">
          Registry Analytics Dashboard
        </h1>
        <p className="font-sans text-sm text-muted mt-1.5 leading-relaxed">
          Real-time aggregated audit metrics, verified citizen contribution ranks, and predictive AI hazard forecasting.
        </p>
      </div>

      {(loading || error) && (
        <CompassMappingLoader loading={loading} error={error} onRetry={refreshIssues || (() => window.location.reload())} text="Loading Analytics Dashboard..." isOverlay={false} />
      )}

      {/* Standardized Stats Counter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface dark:bg-[#111613] p-6 rounded-2xl border border-border shadow-soft text-center flex flex-col justify-center">
          <p className="text-3xl sm:text-4xl font-serif font-bold text-inverted">
            {stats.total === 0 ? 'Getting Started' : stats.total}
          </p>
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted mt-1.5">Total Audits Filed</p>
        </div>
        <div className="bg-surface dark:bg-[#111613] p-6 rounded-2xl border border-border shadow-soft text-center flex flex-col justify-center">
          <p className="text-3xl sm:text-4xl font-serif font-bold text-[#D4AF37]">
            {stats.resolved === 0 ? 'In Progress' : stats.resolved}
          </p>
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted mt-1.5">Resolved Reports</p>
        </div>
        <div className="bg-surface dark:bg-[#111613] p-6 rounded-2xl border border-border shadow-soft text-center flex flex-col justify-center">
          <p className="text-3xl sm:text-4xl font-serif font-bold text-inverted">
            {stats.pending === 0 ? 'Clear Queue' : stats.pending}
          </p>
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted mt-1.5">Active Backlog</p>
        </div>
        <div className="bg-surface dark:bg-[#111613] p-6 rounded-2xl border border-border shadow-soft text-center flex flex-col justify-center">
          <p className="text-3xl sm:text-4xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
            {stats.avgResolutionTime || '3.4 days'}
          </p>
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted mt-1.5">Avg Lead Time</p>
        </div>
      </div>

      {/* Charts & Leaderboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category distribution BarChart */}
        <div className="bg-surface dark:bg-[#111613] border border-border p-6 rounded-2xl shadow-soft flex flex-col h-[380px]">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#D4AF37] mb-4">
            Issues by Category
          </h3>
          <div className="flex-1 w-full text-[11px] font-mono">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted uppercase tracking-wider text-xs">
                Awaiting First Category Audit
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.15)" vertical={false} />
                  <XAxis dataKey="name" stroke="#6C6863" tick={{ fontSize: 10, fill: '#6C6863' }} />
                  <YAxis stroke="#6C6863" tick={{ fontSize: 10, fill: '#6C6863' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#D4AF37', borderRadius: '8px', color: '#FFF' }}
                    cursor={{ fill: 'rgba(212,175,55,0.08)' }} 
                  />
                  <Bar dataKey="count" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status distribution PieChart */}
        <div className="bg-surface dark:bg-[#111613] border border-border p-6 rounded-2xl shadow-soft flex flex-col h-[380px]">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#D4AF37] mb-4">
            Issues by Status
          </h3>
          <div className="flex-1 w-full flex flex-col items-center justify-between">
            <div className="w-full h-[220px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    minAngle={15}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#D4AF37', borderRadius: '8px', color: '#FFF' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[10px] font-mono uppercase tracking-wider text-muted pt-2 border-t border-border/40 w-full">
              {statusData.map((entry, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0 border border-white/20" style={{ backgroundColor: entry.color }} />
                  <span className="font-medium text-inverted">{entry.name}</span>
                  <span className="opacity-60">({entry.value})</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Community Leaderboard with Clean City Streak Toggle */}
        <div className="bg-surface dark:bg-[#111613] border border-border p-6 rounded-2xl shadow-soft flex flex-col h-[380px]">
          <div className="flex items-center justify-between gap-2 mb-4 border-b border-border/60 pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#D4AF37]" />
              <span>Leaderboard Contribution Log</span>
            </h3>

            {/* Tab Toggle */}
            <div className="flex rounded-lg bg-base dark:bg-black/40 p-0.5 border border-border">
              <button
                onClick={() => setLeaderboardTab('xp')}
                className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider font-bold rounded-md transition-colors ${
                  leaderboardTab === 'xp'
                    ? 'bg-[#1A1A1A] dark:bg-[#D4AF37] text-white dark:text-[#1A1A1A]'
                    : 'text-muted hover:text-inverted'
                }`}
              >
                Top XP
              </button>
              <button
                onClick={() => setLeaderboardTab('streaks')}
                className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider font-bold rounded-md transition-colors flex items-center gap-1 ${
                  leaderboardTab === 'streaks'
                    ? 'bg-[#1A1A1A] dark:bg-[#D4AF37] text-white dark:text-[#1A1A1A]'
                    : 'text-muted hover:text-inverted'
                }`}
              >
                <span>🔥</span> Top Streaks
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {sortedLeaderboard.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted text-xs font-mono uppercase tracking-wider">
                Rankings Generating...
              </div>
            ) : (
              sortedLeaderboard.map((usr, index) => (
                <div key={usr.uid || index} className="flex items-center justify-between p-3 bg-base/60 dark:bg-black/30 border border-border rounded-xl shadow-sm hover:border-[#D4AF37]/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 font-mono font-bold text-center text-[#D4AF37] text-xs shrink-0">
                      {index + 1}.
                    </span>
                    <AvatarInitials name={usr.displayName || 'Citizen'} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-sans font-bold text-sm text-inverted truncate leading-tight">{usr.displayName || 'Citizen Hero'}</p>
                      </div>
                      
                      {/* Streak Status & Badges */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {usr.streakDays > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] font-mono text-[10px] font-bold">
                            🔥 {usr.streakDays}d streak
                          </span>
                        ) : (
                          <Link to="/report" className="text-[10px] font-mono font-bold text-[#D4AF37] hover:underline flex items-center gap-0.5">
                            Start your streak →
                          </Link>
                        )}

                        {usr.streakWarning && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 dark:text-amber-400 font-mono text-[9px] animate-pulse">
                            ⚠️ {usr.streakWarningText || 'Streak ending soon'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    {leaderboardTab === 'streaks' ? (
                      <span className="font-mono font-bold text-xs text-[#D4AF37]">
                        {usr.streakDays > 0 ? `🔥 ${usr.streakDays} days` : '0 days'}
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-xs text-[#D4AF37]">
                        {(!usr.points || usr.points === 0) ? 'New Member' : `${usr.points} XP`}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* CLEANEST WARD STREAK BOARD */}
      <div className="bg-surface dark:bg-[#111613] border border-border p-6 sm:p-8 rounded-2xl shadow-soft relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.05),transparent_60%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-6">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest font-bold text-[#D4AF37] mb-1">
              <Flame className="h-3.5 w-3.5" /> Ward Vigilance Standard
            </span>
            <h3 className="font-serif text-2xl font-bold text-inverted flex items-center gap-2">
              <span>Cleanest Ward Streak Board</span>
            </h3>
            <p className="font-sans text-xs text-muted mt-1 leading-relaxed">
              Wards ranked by consecutive weeks maintaining active backlog below threshold (&lt;3 unresolved issues older than 5 days).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(stats.wardStreaks || []).map((ward, idx) => (
            <div key={idx} className="p-5 bg-base/60 dark:bg-black/30 border border-border rounded-xl flex flex-col justify-between space-y-3 shadow-sm hover:border-[#D4AF37]/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] font-mono text-xs font-bold">
                  🔥 {ward.weeksStreak} wk streak
                </span>
                <span className="text-[11px] font-mono text-muted">Rank #{idx + 1}</span>
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-inverted leading-snug">{ward.wardName}</h4>
                <p className="font-mono text-[10px] text-muted mt-1">Backlog: {ward.backlogCount} pending issue</p>
              </div>
              <div className="pt-3 border-t border-border/40 flex items-center gap-1.5 text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="h-3.5 w-3.5" /> {ward.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GEMINI AGENTIC PREDICTIVE INSIGHTS CARD */}
      <div className="bg-surface dark:bg-[#111613] border border-border p-6 sm:p-8 rounded-2xl shadow-soft relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.05),transparent_60%)] pointer-events-none" />
        
        {/* Insights Title & selector */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-6">
          <div>
            <span className="inline-block text-xs font-mono uppercase tracking-widest font-bold text-[#D4AF37] mb-1">
              AI Telemetry Model
            </span>
            <h3 className="font-serif text-2xl font-bold text-inverted flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#D4AF37]" />
              <span>Predictive Hazard Forecasting</span>
            </h3>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="text-[11px] font-bold text-muted uppercase shrink-0">Target Ward:</span>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="border border-border bg-base dark:bg-black/40 text-inverted px-4 py-2 text-xs font-bold rounded-xl focus:outline-none focus:border-[#D4AF37] cursor-pointer shadow-sm transition-colors"
            >
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {loadingInsights ? (
          <div className="space-y-4 py-6">
            <div className="h-6 w-1/4 bg-stone/20 animate-pulse rounded-full" />
            <div className="h-24 w-full bg-stone/20 animate-pulse rounded-2xl" />
          </div>
        ) : !insights ? (
          <div className="text-center py-12 text-muted text-xs font-mono uppercase tracking-wider">
            No predictive hazard reports cataloged inside this ward yet
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Risk Predictions list */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#D4AF37] mb-3">
                Threat Projections
              </h4>
              <div className="space-y-4">
                {insights.predictions?.map((pred, idx) => (
                  <div key={idx} className="p-5 bg-base/50 dark:bg-black/30 border border-border rounded-xl flex items-start gap-3.5 shadow-sm">
                    <div className="p-2.5 bg-[#D4AF37]/15 text-[#D4AF37] rounded-lg shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] font-mono uppercase tracking-wider">
                        <span className="px-2.5 py-1 rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] font-bold">
                          {pred.escalationRisk} Threat
                        </span>
                        <span className="text-muted font-bold">Timeline: {pred.impactTimeframe}</span>
                      </div>
                      <p className="text-sm font-sans text-inverted leading-relaxed mt-2.5">{pred.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Authority Priority Actions list */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#D4AF37] mb-3">
                Priority Agency Directives
              </h4>
              <div className="space-y-3.5">
                {insights.priorityActions?.map((act, idx) => (
                  <div key={idx} className="p-4 border-l-4 border-[#D4AF37] border-t border-r border-b border-border bg-base/50 dark:bg-black/30 rounded-xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                      <span className="px-2 py-0.5 border border-border rounded bg-surface dark:bg-[#111613] uppercase tracking-wider text-inverted">{act.urgency}</span>
                      <span className="text-[#D4AF37] uppercase">{act.targetDepartment}</span>
                    </div>
                    <p className="text-xs font-sans font-medium text-inverted leading-snug">{act.action}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
