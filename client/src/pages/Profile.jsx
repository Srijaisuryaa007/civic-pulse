import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useIssues } from '../context/IssueContext';
import { Link } from 'react-router-dom';
import { Award, Trophy, Heart, BookOpen, MapPin, ChevronRight, Leaf } from 'lucide-react';

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
      <div className="mx-auto max-w-md px-4 py-16 text-center bg-paper border border-stone rounded-[32px] shadow-soft-md">
        <Trophy className="h-10 w-10 text-neutral-400 mx-auto mb-2" />
        <h3 className="font-serif text-lg font-bold text-forest uppercase tracking-wider">No Profile Selected</h3>
        <p className="text-xs font-body text-neutral-500 mt-1">Please sign in to view your community points, achievements, and reports history.</p>
      </div>
    );
  }

  const badgeDetails = {
    'First Reporter': { icon: Trophy, color: 'border-stone', desc: 'Reported first civic issue' },
    'First Verification': { icon: Heart, color: 'border-stone', desc: 'Verified first community report' },
    'Verified 10 Issues': { icon: BookOpen, color: 'border-stone', desc: 'Contributed 10 verifications' },
    'Local Legend': { icon: Award, color: 'border-stone', desc: 'Accumulated over 100 XP points' }
  };

  const userBadges = user.badges || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 bg-paper">
      
      {/* Profile Header card (Soft rounded) */}
      <div className="border border-stone p-6 bg-paper rounded-[32px] shadow-soft flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(140,154,132,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="h-16 w-16 border-2 border-stone bg-[#FDFDFB] flex items-center justify-center font-mono font-bold text-forest text-2xl uppercase rounded-full shadow-soft">
            {user.displayName?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-forest leading-tight">
              {user.displayName}
            </h2>
            {user.username && <p className="text-xs font-mono text-terracotta">@{user.username}</p>}
            <p className="text-xs font-mono uppercase tracking-wider text-neutral-450 mt-1">Registered Hero</p>
          </div>
        </div>

        {/* Level & points details */}
        <div className="relative z-10 flex items-center gap-6 divide-x divide-stone font-mono uppercase tracking-widest text-forest">
          <div className="text-center px-4">
            <p className="text-xs font-bold text-neutral-400">Level</p>
            <p className="text-2xl font-black text-forest mt-0.5">
              {Math.floor((user.points || 0) / 100) + 1}
            </p>
          </div>
          <div className="text-center px-6">
            <p className="text-xs font-bold text-neutral-400">Total Score</p>
            <p className="text-2xl font-black text-terracotta mt-0.5">{user.points || 0} XP</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: My Reports & Point Ledger */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* My Reports */}
          <div className="bg-paper border border-stone p-5 rounded-[32px] shadow-soft">
            <h3 className="font-serif text-base font-bold text-forest mb-4 border-b border-stone pb-2 ml-1">
              My Filed Reports ({myIssues.length})
            </h3>

            {myIssues.length === 0 ? (
              <div className="text-center py-10 border border-stone border-dashed rounded-[20px] bg-[#FDFDFB]">
                <p className="text-xs font-mono text-neutral-400 uppercase tracking-wide">No filings cataloged</p>
                <Link to="/report" className="mt-4 inline-block px-5 py-2 bg-forest hover:bg-terracotta text-white text-xs font-mono font-bold uppercase tracking-widest rounded-full transition-colors shadow-soft">
                  File Report
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {myIssues.map(issue => (
                  <Link
                    key={issue.id}
                    to={`/issue/${issue.id}`}
                    className="flex items-center justify-between p-3.5 bg-paper hover:bg-[#FDFDFB] border border-stone rounded-[20px] transition-colors shadow-soft"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 border border-stone rounded-xl overflow-hidden shrink-0 relative bg-neutral-100 shadow-soft">
                        <img src={issue.imageUrl} alt={issue.title} className="h-full w-full object-cover grayscale" />
                        <div className="absolute inset-0 halftone-placeholder pointer-events-none opacity-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-serif font-bold text-xs text-forest truncate leading-snug">{issue.title}</h4>
                        <div className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-neutral-450 mt-1">
                          <MapPin className="h-3 w-3 text-terracotta shrink-0" />
                          <span className="truncate">{issue.location?.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <span className={`px-3 py-1 border border-stone rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                        issue.status === 'Resolved' ? 'bg-terracotta text-white border-transparent' : 'bg-[#FDFDFB] text-forest'
                      }`}>
                        {issue.status}
                      </span>
                      <ChevronRight className="h-4 w-4 text-neutral-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Points Ledger */}
          <div className="bg-paper border border-stone p-5 rounded-[32px] shadow-soft relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(140,154,132,0.02)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
            <h3 className="relative z-10 font-serif text-base font-bold text-forest mb-4 border-b border-stone pb-2 ml-1">
              XP Transaction Ledger
            </h3>

            {activityLedger.length === 0 ? (
              <div className="relative z-10 text-center py-8 text-neutral-400 text-xs font-mono uppercase">No transaction logs</div>
            ) : (
              <div className="relative z-10 space-y-3 font-mono text-[11px] uppercase tracking-wider ml-1">
                {activityLedger.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-[#FDFDFB] border border-stone rounded-2xl shadow-soft">
                    <div className="flex gap-2">
                      <span className="text-sage mt-0.5">●</span>
                      <div>
                        <p className="font-bold text-forest leading-snug">{item.description}</p>
                        <p className="text-xs text-neutral-450 mt-0.5">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="font-bold text-terracotta shrink-0 ml-3">
                      +{item.points} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Badges Rack (Pill badges stamp grid style) */}
        <div className="space-y-6">
          <div className="bg-paper border border-stone p-5 rounded-[32px] shadow-soft space-y-4">
            <div className="border-b border-stone pb-3 mb-2">
              <h3 className="font-serif text-base font-bold text-forest ml-1">
                Citizen Achievements ({userBadges.length}/4)
              </h3>
              <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 mt-1 ml-1">Badges unlocked via active community filings.</p>
            </div>

            <div className="space-y-3">
              {Object.keys(badgeDetails).map(badgeName => {
                const b = badgeDetails[badgeName];
                const Icon = b.icon;
                const isEarned = userBadges.includes(badgeName);

                return (
                  <div
                    key={badgeName}
                    className={`flex items-center gap-3 p-3 border border-stone rounded-[20px] transition-all duration-300 shadow-soft ${
                      isEarned 
                        ? 'bg-paper opacity-100' 
                        : 'bg-neutral-50/50 opacity-30 grayscale'
                    }`}
                  >
                    <div className="p-2 border border-stone rounded-full bg-paper shrink-0 text-terracotta">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-serif text-xs font-bold text-forest">{badgeName}</h4>
                      <p className="text-xs font-body text-neutral-400 leading-snug mt-0.5">{b.desc}</p>
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
