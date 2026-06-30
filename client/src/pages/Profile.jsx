import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useIssues } from '../context/IssueContext';
import { Link } from 'react-router-dom';
import { Award, Trophy, Heart, BookOpen, MapPin, ChevronRight, Flame } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { issues } = useIssues();
  const [myIssues, setMyIssues] = useState([]);
  const [activityLedger, setActivityLedger] = useState([]);

  useEffect(() => {
    if (user?.uid) {
      const filtered = issues.filter(i => i.authorId === user.uid);
      setMyIssues(filtered);

      const ledger = [];
      
      filtered.forEach(issue => {
        ledger.push({
          points: 10,
          description: `Filed civic report: "${issue.title}"`,
          timestamp: issue.createdAt,
          activity: 'report'
        });

        if (issue.status === 'Resolved') {
          const resolveEv = (issue.history || []).find(h => h.status === 'Resolved');
          ledger.push({
            points: 50,
            description: `Received resolution bonus: "${issue.title}" resolved!`,
            timestamp: resolveEv?.timestamp || issue.updatedAt,
            activity: 'resolve_bonus'
          });
        }
      });

      issues.forEach(issue => {
        if (issue.verifiedBy?.includes(user.uid)) {
          ledger.push({
            points: 5,
            description: `Verified report: "${issue.title}"`,
            timestamp: issue.updatedAt || issue.createdAt,
            activity: 'verify'
          });
        }
      });

      ledger.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivityLedger(ledger);
    }
  }, [user, issues]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center bg-surface dark:bg-[#111613] border border-border rounded-2xl shadow-soft">
        <Trophy className="h-10 w-10 text-muted mx-auto mb-2" />
        <h3 className="font-serif text-lg font-bold text-inverted uppercase tracking-wider">No Profile Selected</h3>
        <p className="text-xs font-sans text-muted mt-1">Please sign in to view your community points, achievements, and streak logs.</p>
      </div>
    );
  }

  const badgeDetails = {
    'First Reporter': { icon: Trophy, desc: 'Reported first civic issue' },
    'First Verification': { icon: Heart, desc: 'Verified first community report' },
    'Verified 10 Issues': { icon: BookOpen, desc: 'Contributed 10 verifications' },
    'Local Legend': { icon: Award, desc: 'Accumulated over 100 XP points' },
    '🥉 7-Day Flame': { icon: Flame, desc: 'Maintain 7 consecutive active participation days' },
    '🥈 30-Day Flame': { icon: Flame, desc: 'Maintain 30 consecutive active participation days' },
    '🥇 100-Day Flame': { icon: Flame, desc: 'Maintain 100 consecutive active participation days' }
  };

  const userBadges = user.badges || [];
  const streakDays = user.streakDays || 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 bg-base dark:bg-[#0A0D0B] min-h-screen text-inverted transition-colors">
      
      {/* Profile Header card */}
      <div className="border border-border p-6 sm:p-8 bg-surface dark:bg-[#111613] rounded-2xl shadow-soft flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.08),transparent_60%)] pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
          <div className="h-16 w-16 border-2 border-[#D4AF37] bg-base flex items-center justify-center font-mono font-bold text-[#D4AF37] text-2xl uppercase rounded-full shadow-soft shrink-0">
            {user.displayName?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-inverted leading-tight">
              {user.displayName}
            </h2>
            {user.username && <p className="text-xs font-mono text-[#D4AF37] mt-0.5">@{user.username}</p>}
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted px-2.5 py-0.5 rounded border border-border">Registered Citizen</span>
              
              {/* Streak Badge */}
              {streakDays > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] font-mono text-xs font-bold border border-[#D4AF37]/30">
                  🔥 {streakDays}d active streak
                </span>
              ) : (
                <Link to="/report" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#D4AF37] text-[#1A1A1A] font-mono text-xs font-bold hover:opacity-90 transition-opacity">
                  Start your streak →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Level & points details */}
        <div className="relative z-10 flex items-center gap-6 divide-x divide-border font-mono uppercase tracking-widest text-inverted shrink-0">
          <div className="text-center px-4">
            <p className="text-[10px] font-bold text-muted">Level</p>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-inverted mt-0.5">
              {Math.floor((user.points || 0) / 100) + 1}
            </p>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] font-bold text-muted">Streak</p>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#D4AF37] mt-0.5">
              {streakDays}d
            </p>
          </div>
          <div className="text-center pl-6">
            <p className="text-[10px] font-bold text-muted">Score</p>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#D4AF37] mt-0.5">{user.points || 0} XP</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: My Reports & Point Ledger */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* My Reports */}
          <div className="bg-surface dark:bg-[#111613] border border-border p-6 rounded-2xl shadow-soft">
            <h3 className="font-serif text-lg font-bold text-inverted mb-4 border-b border-border pb-3">
              My Filed Reports ({myIssues.length})
            </h3>

            {myIssues.length === 0 ? (
              <div className="text-center py-12 border border-border border-dashed rounded-xl bg-base/50 dark:bg-black/20">
                <p className="text-xs font-mono text-muted uppercase tracking-wider">No filings cataloged yet</p>
                <Link to="/report" className="mt-4 inline-block px-6 py-2.5 bg-[#1A1A1A] dark:bg-[#D4AF37] hover:opacity-90 text-white dark:text-[#1A1A1A] text-xs font-mono font-bold uppercase tracking-widest rounded-full transition-colors shadow-soft">
                  File First Report
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {myIssues.map(issue => (
                  <Link
                    key={issue.id}
                    to={`/issue/${issue.id}`}
                    className="flex items-center justify-between p-4 bg-base/60 dark:bg-black/30 hover:border-[#D4AF37]/50 border border-border rounded-xl transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 border border-border rounded-xl overflow-hidden shrink-0 relative bg-surface">
                        <img src={issue.imageUrl} alt={issue.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-serif font-bold text-sm text-inverted truncate leading-snug">{issue.title}</h4>
                        <div className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-muted mt-1">
                          <MapPin className="h-3 w-3 text-[#D4AF37] shrink-0" />
                          <span className="truncate">{issue.location?.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <span className="px-3 py-1 border border-border rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-surface dark:bg-[#111613] text-[#D4AF37]">
                        {issue.status}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Points Ledger */}
          <div className="bg-surface dark:bg-[#111613] border border-border p-6 rounded-2xl shadow-soft relative overflow-hidden">
            <h3 className="font-serif text-lg font-bold text-inverted mb-4 border-b border-border pb-3">
              XP & Streak Activity Log
            </h3>

            {activityLedger.length === 0 ? (
              <div className="text-center py-8 text-muted text-xs font-mono uppercase">No activity logs recorded</div>
            ) : (
              <div className="space-y-3 font-mono text-xs uppercase tracking-wider">
                {activityLedger.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-base/60 dark:bg-black/30 border border-border rounded-xl shadow-sm">
                    <div className="flex gap-2.5 items-center">
                      <span className="text-[#D4AF37]">●</span>
                      <div>
                        <p className="font-bold text-inverted leading-snug">{item.description}</p>
                        <p className="text-[10px] text-muted mt-0.5">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#D4AF37] shrink-0 ml-3">
                      +{item.points} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Badges Rack */}
        <div className="space-y-6">
          <div className="bg-surface dark:bg-[#111613] border border-border p-6 rounded-2xl shadow-soft space-y-4">
            <div className="border-b border-border pb-3 mb-2">
              <h3 className="font-serif text-lg font-bold text-inverted">
                Citizen Achievements ({userBadges.length}/{Object.keys(badgeDetails).length})
              </h3>
              <p className="text-xs font-mono uppercase tracking-wider text-muted mt-1">Badges unlocked via active streaks and community filings.</p>
            </div>

            <div className="space-y-3">
              {Object.keys(badgeDetails).map(badgeName => {
                const b = badgeDetails[badgeName];
                const Icon = b.icon;
                const isEarned = userBadges.includes(badgeName) || badgeName.includes('Flame') && (
                  (badgeName.includes('7') && streakDays >= 7) ||
                  (badgeName.includes('30') && streakDays >= 30) ||
                  (badgeName.includes('100') && streakDays >= 100)
                );

                return (
                  <div
                    key={badgeName}
                    className={`flex items-center gap-3.5 p-3.5 border rounded-xl transition-all shadow-sm ${
                      isEarned 
                        ? 'bg-base dark:bg-black/40 border-[#D4AF37]/60 opacity-100' 
                        : 'bg-surface dark:bg-[#111613] border-border opacity-40 grayscale'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg shrink-0 ${isEarned ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-base text-muted'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-serif text-sm font-bold text-inverted flex items-center gap-1.5">
                        <span>{badgeName}</span>
                        {isEarned && <span className="text-[9px] font-mono text-[#D4AF37] uppercase font-bold">[Unlocked]</span>}
                      </h4>
                      <p className="text-xs font-sans text-muted leading-snug mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
