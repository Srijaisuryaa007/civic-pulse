import React, { useState, useEffect } from 'react';
import { useIssues } from '../context/IssueContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Award, Zap, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { issues } = useIssues();

  const [selectedArea, setSelectedArea] = useState('Metro Area');
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    avgResolutionTime: '5.2 days',
    topAreas: [],
    leaderboard: []
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await fetch('/api/analytics/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats({
            total: data.summary?.total || 0,
            resolved: data.summary?.resolved || 0,
            pending: data.summary?.pending || 0,
            avgResolutionTime: data.avgResolutionTime || '5.2 days',
            topAreas: data.topAreas || [],
            leaderboard: data.leaderboard || []
          });
        }
      } catch (err) {
        console.error("Dashboard stats fetch failed:", err);
      }
    };

    fetchDashboardStats();
  }, [issues]);

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

  // Chart Data: Statuses (Botanical palette: forest, sage, clay, terracotta)
  const statusData = [
    { name: 'Reported', value: issues.filter(i => i.status === 'Reported').length, color: '#DCCFC2' }, // Soft Clay
    { name: 'Verified', value: issues.filter(i => i.status === 'Verified').length, color: '#8C9A84' }, // Sage Green
    { name: 'In Progress', value: issues.filter(i => i.status === 'In Progress').length, color: '#2D3A31' }, // Deep Forest
    { name: 'Resolved', value: issues.filter(i => i.status === 'Resolved').length, color: '#C27B66' } // Terracotta
  ].filter(item => item.value > 0);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 bg-paper">
      
      {/* Title */}
      <div className="border-b border-stone pb-6 mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-forest">
          Registry *Analytics* Dashboard
        </h1>
        <p className="font-body text-sm text-neutral-500 mt-1">Aggregated statistics, leaderboard data, and regional hazard forecast audits.</p>
      </div>

      {/* Stats Counter Row (Botanical highly rounded layout) */}
      <div className="border border-stone grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-paper rounded-[32px] shadow-soft overflow-hidden">
        <div className="p-5 border-b sm:border-b-0 sm:border-r border-stone text-center">
          <p className="text-3xl font-serif font-bold text-forest">{stats.total}</p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mt-1">Total Audits</p>
        </div>
        <div className="p-5 border-b sm:border-b-0 sm:border-r border-stone text-center">
          <p className="text-3xl font-serif font-bold text-terracotta">{stats.resolved}</p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mt-1">Resolved Reports</p>
        </div>
        <div className="p-5 border-b lg:border-b-0 lg:border-r border-stone text-center">
          <p className="text-3xl font-serif font-bold text-forest">{stats.pending}</p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mt-1">Active Backlog</p>
        </div>
        <div className="p-5 text-center">
          <p className="text-3xl font-serif font-bold text-forest">{stats.avgResolutionTime}</p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mt-1">Avg Lead Time</p>
        </div>
      </div>

      {/* Charts & Leaderboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category distribution BarChart */}
        <div className="bg-paper border border-stone p-5 flex flex-col h-80 rounded-[32px] shadow-soft relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(140,154,132,0.02)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          <h3 className="relative z-10 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-450 mb-4 ml-1">Issues by Category</h3>
          <div className="relative z-10 flex-1 w-full text-[10px] font-mono">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-400 uppercase">No catalog data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DA" vertical={false} />
                  <XAxis dataKey="name" stroke="#2D3A31" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#2D3A31" tick={{ fontSize: 9 }} />
                  <Tooltip cursor={{ fill: '#F2F0EB', opacity: 0.5 }} />
                  <Bar dataKey="count" fill="#8C9A84" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status distribution PieChart */}
        <div className="bg-paper border border-stone p-5 flex flex-col h-80 rounded-[32px] shadow-soft relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(140,154,132,0.02)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          <h3 className="relative z-10 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-450 mb-4 ml-1">Issues by Status</h3>
          <div className="relative z-10 flex-1 w-full flex items-center justify-center">
            {statusData.length === 0 ? (
              <div className="text-neutral-400 uppercase text-[10px] font-mono">No status data</div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#F9F8F4" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-x-3.5 gap-y-1 text-[9px] font-mono uppercase tracking-wider text-neutral-500">
                  {statusData.map((entry, idx) => (
                    <span key={idx} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      {entry.name} ({entry.value})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Community Leaderboard */}
        <div className="bg-paper border border-stone p-5 flex flex-col h-80 rounded-[32px] shadow-soft relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(140,154,132,0.02)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          <h3 className="relative z-10 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-450 mb-3 ml-1 flex items-center gap-1">
            <Award className="h-4 w-4 text-terracotta" />
            <span>Leaderboard Contribution Log</span>
          </h3>

          <div className="relative z-10 flex-1 overflow-y-auto space-y-2.5 pr-1">
            {stats.leaderboard.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-400 text-[10px] font-mono uppercase">No active records</div>
            ) : (
              stats.leaderboard.map((usr, index) => (
                <div key={usr.uid} className="flex items-center justify-between p-2.5 bg-[#FAF9F6] border border-stone rounded-2xl text-[11px] font-mono uppercase tracking-wider shadow-soft">
                  <div className="flex items-center gap-2">
                    <span className="w-5 font-bold text-center text-forest">
                      {index + 1}.
                    </span>
                    <div className="h-7 w-7 border border-stone text-forest bg-neutral-100 font-bold flex items-center justify-center text-[10px] rounded-full">
                      {usr.displayName?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-forest leading-tight">{usr.displayName}</p>
                      <div className="flex gap-1 mt-0.5">
                        {usr.badges.slice(0, 2).map((b, i) => (
                          <span key={i} className="px-2 py-0.2 border border-stone rounded-full text-[7px] font-mono bg-paper text-neutral-500">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-terracotta">{usr.points} XP</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* GEMINI AGENTIC PREDICTIVE INSIGHTS CARD */}
      <div className="bg-paper border border-stone p-6 rounded-[32px] shadow-soft-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(140,154,132,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        {/* Insights Title & selector */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone pb-4 mb-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-forest flex items-center gap-1.5">
              <Zap className="h-5 w-5 text-terracotta" />
              <span>Predictive Hazard Forecasting</span>
            </h3>
            <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-450 mt-1">AI modeling forecasts regional risk points based on catalog reports.</p>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="text-[9px] font-bold text-neutral-400 uppercase shrink-0">Wards:</span>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="border border-stone bg-paper px-3 py-1.5 text-xs font-bold rounded-full focus:outline-none cursor-pointer shadow-soft"
            >
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {loadingInsights ? (
          <div className="space-y-4 py-6">
            <div className="h-6 w-1/4 bg-neutral-100 animate-pulse rounded-full border border-stone" />
            <div className="h-16 w-full bg-neutral-100 animate-pulse rounded-2xl border border-stone" />
          </div>
        ) : !insights ? (
          <div className="text-center py-8 text-neutral-400 text-[10px] font-mono uppercase">No reports cataloged inside this ward</div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Risk Predictions list */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 mb-2 ml-1">Threat Projections</h4>
              <div className="space-y-3.5">
                {insights.predictions?.map((pred, idx) => (
                  <div key={idx} className="p-4 bg-[#FDFDFB] border border-stone rounded-2xl flex items-start gap-3 shadow-soft">
                    <div className="p-2 border border-stone bg-neutral-150 rounded-full shrink-0 text-terracotta">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap text-[9px] font-mono uppercase tracking-wider">
                        <span className="px-2.5 py-0.5 rounded-full border border-terracotta bg-terracotta/5 text-terracotta">
                          {pred.escalationRisk} threat
                        </span>
                        <span className="text-neutral-450 font-bold">Timeline: {pred.impactTimeframe}</span>
                      </div>
                      <p className="text-xs font-body text-forest leading-relaxed mt-2.5">{pred.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Authority Priority Actions list */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-450 mb-2 ml-1">Priority Directives</h4>
              <div className="space-y-3 font-mono">
                {insights.priorityActions?.map((act, idx) => (
                  <div key={idx} className="p-4 border-l-4 border-sage border-t border-r border-b border-stone bg-[#FDFDFB] rounded-2xl shadow-soft space-y-2">
                    <div className="flex items-center justify-between text-[8px] font-bold">
                      <span className="px-2 py-0.5 border border-stone rounded-full bg-paper uppercase tracking-wider">{act.urgency}</span>
                      <span className="text-terracotta uppercase">{act.targetDepartment}</span>
                    </div>
                    <p className="text-xs font-bold text-forest leading-snug">{act.action}</p>
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
