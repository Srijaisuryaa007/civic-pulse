import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';
import { useAuth } from '../context/AuthContext';
import { ThumbsUp, CheckCircle, MapPin, Send, Share2, ChevronLeft, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { upvoteIssue, verifyIssue, updateIssueStatus, deleteIssue, addComment, triggerToast } = useIssues();
  const { user } = useAuth();
  
  const [issue, setIssue] = useState(null);
  const [loadingIssue, setLoadingIssue] = useState(true);
  const [commentText, setCommentText] = useState('');
  
  // Simulation states
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [simStatus, setSimStatus] = useState('In Progress');
  const [simNote, setSimNote] = useState('');

  const [userState, setUserState] = useState({
    isAuthor: false,
    hasVoted: false,
    hasVerified: false,
    isInspector: false
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'issues', id), (snap) => {
      if (!snap.exists()) {
        setIssue(null);
        setLoadingIssue(false);
        return;
      }
      const data = { id: snap.id, ...snap.data() };
      setIssue(data);
      if (user) {
        setUserState({
          isAuthor: data.authorId === user.uid,
          hasVoted: data.votedBy?.includes(user.uid) ?? false,
          hasVerified: data.verifiedBy?.includes(user.uid) ?? false,
          isInspector: user.role === 'inspector' || user.role === 'admin'
        });
      }
      setLoadingIssue(false);
    });
    return () => unsub();
  }, [id, user]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      triggerToast("Please sign in to post comments!", "warning");
      return;
    }

    await addComment(id, commentText);
    setCommentText('');
  };

  const handleSimulateStatus = async (e) => {
    e.preventDefault();
    await updateIssueStatus(id, simStatus, simNote || `Status updated to ${simStatus} by simulated Municipal Authority Inspector.`);
    setSimulationOpen(false);
    setSimNote('');
  };

  const shareIssue = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    triggerToast("Link copied to clipboard.");
  };

  if (loadingIssue) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center bg-paper">
        <div className="h-10 w-10 bg-neutral-100 rounded-full animate-bounce mx-auto mb-4 border border-stone" />
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-450">Loading file index...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center bg-paper border border-stone rounded-[32px] shadow-soft-md">
        <AlertTriangle className="h-10 w-10 text-terracotta mx-auto mb-2" />
        <h3 className="font-serif text-lg font-bold text-forest">REPORT FILE OUT OF SCOPE</h3>
        <p className="text-xs font-body text-neutral-500 mt-1">The referenced file is missing or has been permanently resolved.</p>
        <Link to="/issues" className="mt-5 inline-block text-xs font-mono font-bold uppercase tracking-widest text-terracotta hover:underline">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const statusSteps = [
    { key: 'Reported', label: '01. Reported', description: 'Filed in ledger' },
    { key: 'Verified', label: '02. Verified', description: '3+ Votes met' },
    { key: 'In Progress', label: '03. In Progress', description: 'Assigned crew' },
    { key: 'Resolved', label: '04. Resolved', description: 'Remediated' }
  ];

  const getStepIndex = (status) => {
    if (status === 'Reported') return 0;
    if (status === 'Verified') return 1;
    if (status === 'In Progress') return 2;
    if (status === 'Resolved') return 3;
    return 0;
  };

  const currentStepIdx = getStepIndex(issue.status);

  return (
    <div className="issue-detail-main mx-auto max-w-5xl bg-paper">
      
      {/* Back button */}
      <Link to="/issues" className="flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-widest text-neutral-500 hover:text-terracotta mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Details Section */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <div className="bg-paper border border-stone rounded-[32px] p-6 shadow-soft relative overflow-hidden">
            {/* Plant visual line overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(140,154,132,0.02)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap mb-4 border-b border-stone pb-3">
              <span className="category-tag px-3 py-1 border border-stone rounded-full bg-paper text-sage">
                Category: {issue.category}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={shareIssue}
                  className="p-2 border border-stone hover:bg-neutral-50 text-forest bg-paper rounded-full transition-colors shadow-soft"
                  title="Share Report"
                >
                  <Share2 className="h-4 w-4 stroke-[1.5]" />
                </button>

                 {/* Simulation Inspector Toggle */}
                {userState.isInspector && (
                  <button
                    onClick={() => setSimulationOpen(!simulationOpen)}
                    className="px-4 py-1.5 border border-terracotta bg-transparent text-terracotta hover:bg-terracotta hover:text-white text-sm font-mono font-bold uppercase tracking-widest rounded-full transition-colors"
                  >
                    Inspector Tool
                  </button>
                )}
              </div>
            </div>

            <h1 className="issue-title">
              {issue.title}
            </h1>

            <div className="location-text relative z-10 flex items-center gap-1.5 mt-2.5 ml-1">
              <MapPin className="h-3.5 w-3.5 text-terracotta shrink-0" />
              <span>LOCATION: {issue.location?.address}</span>
            </div>

            <div className="border-t border-stone pt-4 mt-6 flex items-center justify-between ml-1">
              <div className="flex items-center gap-2">
                {userState.isAuthor ? (
                  <>
                    <div className="h-7 w-7 border border-stone text-forest bg-neutral-50 font-mono font-bold flex items-center justify-center text-xs uppercase rounded-full shrink-0">
                      {issue.authorName?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="filer-name">{issue.authorName}</p>
                      <p className="filer-role">FILER</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-7 w-7 border border-stone text-forest bg-neutral-50 font-mono font-bold flex items-center justify-center text-xs uppercase rounded-full shrink-0">
                      CR
                    </div>
                    <div>
                      <p className="filer-name">Citizen Reporter</p>
                      <p className="filer-role">Anonymous</p>
                    </div>
                  </>
                )}
              </div>
              <span className="filed-date flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-sage" /> FILED {new Date(issue.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Simulated Authority Panel (Outline style) */}
            {simulationOpen && (
              <form onSubmit={handleSimulateStatus} className="mt-6 p-4 border border-stone rounded-[20px] bg-paper text-sm text-forest space-y-3 animate-slideUp relative z-20 shadow-soft">
                <div className="flex justify-between items-center border-b border-stone pb-1.5">
                  <h4 className="font-mono font-bold uppercase tracking-widest text-terracotta text-sm">Simulated Inspector Dashboard</h4>
                  <button type="button" onClick={() => setSimulationOpen(false)} className="text-neutral-400 hover:text-forest">✕</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-neutral-455 mb-1">Set Status</label>
                    <select
                      value={simStatus}
                      onChange={(e) => setSimStatus(e.target.value)}
                      className="w-full border border-stone bg-[#FDFDFB] p-2 text-xs rounded-lg"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-neutral-455 mb-1">Log notes</label>
                    <input
                      type="text"
                      value={simNote}
                      onChange={(e) => setSimNote(e.target.value)}
                      placeholder="e.g. Cleared site debris."
                      className="w-full border border-stone bg-[#FDFDFB] p-2 text-sm rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button type="submit" className="px-4 py-1.5 bg-forest hover:bg-[#1f2822] text-white text-sm font-mono uppercase tracking-widest rounded-full shadow-soft transition-colors">
                    Confirm Updates
                  </button>
                </div>
              </form>
            )}

            {/* Case narrative */}
            <div className="mt-6 border-t border-stone pt-5">
              <h3 className="section-label ml-1">Case Narrative</h3>
              <div className="case-narrative whitespace-pre-wrap">
                <p>{issue.description}</p>
              </div>
            </div>

            <div className="section-divider"></div>

            {/* Author Controls */}
            {userState.isAuthor && (
              <div className="mt-4 flex items-center gap-3 ml-1 border-t border-stone pt-4">
                <button className="px-4 py-1.5 border border-stone bg-paper text-forest hover:bg-neutral-50 text-xs font-mono font-bold uppercase tracking-widest rounded-full transition-colors" onClick={() => triggerToast("Edit mode coming soon!", "warning")}>
                  Edit Report
                </button>
                <button className="px-4 py-1.5 bg-terracotta hover:bg-red-700 text-white text-xs font-mono font-bold uppercase tracking-widest rounded-full shadow-soft transition-colors" onClick={async () => {
                  if (window.confirm("Are you sure you want to delete this report?")) {
                    await deleteIssue(issue.id);
                    navigate('/issues');
                  }
                }}>
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Stepper Timeline (Pill design blocks) */}
          <div className="bg-paper border border-stone rounded-[32px] p-6 shadow-soft relative">
            <h3 className="correspondence-title border-b border-stone pb-3 mb-5">
              Resolution Progress
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 font-mono text-sm uppercase tracking-wider">
              {statusSteps.map((step, idx) => {
                const isCompleted = idx <= currentStepIdx;
                const isActive = idx === currentStepIdx;
 
                return (
                  <div 
                    key={step.key} 
                    className={`p-3 border rounded-2xl flex flex-col justify-between transition-colors shadow-soft ${
                      isCompleted 
                        ? 'bg-forest text-white border-transparent' 
                        : 'bg-[#FDFDFB] text-neutral-400 border-stone'
                    }`}
                  >
                    <div>
                      <p className="step-label">{step.label}</p>
                      <p className={`step-sublabel ${isCompleted ? 'text-neutral-350' : 'text-neutral-400'}`}>
                        {isActive && step.key === 'Verified' && issue.status === 'Reported'
                          ? `Votes: ${issue.verifications || 0}/3`
                          : step.description}
                      </p>
                    </div>
                    {isCompleted && <span className="text-sm text-right font-black mt-2">✓</span>}
                  </div>
                );
              })}
            </div>

            {/* Audit logs history */}
            <div className="border-t border-stone mt-6 pt-5">
              <h4 className="history-label ml-1">Filing History Log</h4>
              <div className="space-y-3 ml-1">
                {issue.history?.map((hist, idx) => (
                  <div key={idx} className="flex gap-2.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-sage mt-2 shrink-0" />
                    <div>
                      <p className="history-entry-title">
                        {hist.status} <span className="history-entry-date">{new Date(hist.timestamp).toLocaleString()}</span>
                      </p>
                      <p className="history-entry-body">{hist.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comments section */}
          <div className="bg-paper border border-stone rounded-[32px] p-6 space-y-5 shadow-soft">
            <h3 className="correspondence-title border-b border-stone pb-3 mb-4">
              Community Correspondence ({issue.commentsCount || 0})
            </h3>

            {/* Comments Thread */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {!issue.comments || issue.comments.length === 0 ? (
                <div className="text-center py-6 border border-stone border-dashed rounded-[20px]">
                  <p className="text-base font-mono text-neutral-450 uppercase tracking-wide">No correspondence filed yet</p>
                </div>
              ) : (
                issue.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2.5 text-base pb-3 border-b border-stone/30 last:border-0">
                    <div className="h-7 w-7 border border-stone text-forest bg-neutral-100 font-mono font-bold flex items-center justify-center text-sm uppercase rounded-full shrink-0">
                      {comment.userName?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1 text-sm font-mono uppercase tracking-widest text-neutral-400">
                        <span className="font-bold text-forest">{comment.userName}</span>
                        <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-neutral-500 leading-relaxed font-body text-justify">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post comment form */}
            <form onSubmit={handlePostComment} className="flex gap-2 pt-3 border-t border-stone">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={user ? "Write comments... (+2 XP)" : "Please sign in to file comments"}
                disabled={!user}
                className="flex-1 border-b border-stone bg-transparent px-3 py-2 text-base font-mono text-forest focus:bg-neutral-50 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!user || !commentText.trim()}
                className="px-5 py-2 bg-forest hover:bg-terracotta text-white rounded-full text-base font-mono font-bold uppercase tracking-widest flex items-center gap-1 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-soft"
              >
                <Send className="h-3 w-3" />
                <span>Submit</span>
              </button>
            </form>
          </div>

        </div>

        {/* Gamification Actions and AI Insights Sidebar */}
        <div className="space-y-6">
          {/* Action Board (Pill outline shapes) */}
          <div className="sidebar-panel bg-paper border border-stone rounded-[32px] text-center space-y-4 relative shadow-soft">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(140,154,132,0.02)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <h3 className="sidebar-panel-title relative z-10">Citizen Ballot Board</h3>
            
            <div className="grid grid-cols-2 gap-3.5 relative z-10">
              {/* Upvotes */}
              <div className="p-3 border border-stone bg-transparent rounded-2xl shadow-soft">
                <p className="ballot-count">{issue.upvotes || 0}</p>
                <p className="ballot-count-label mt-1">Votes</p>
                <button
                  onClick={() => upvoteIssue(issue.id)}
                  disabled={userState.hasVoted || userState.isAuthor}
                  className={`mt-3 w-full border py-1.5 px-3 text-sm font-mono font-bold uppercase tracking-widest rounded-full transition-all ${
                    userState.hasVoted
                      ? 'bg-forest text-white border-transparent'
                      : userState.isAuthor
                      ? 'border-stone text-neutral-450 bg-neutral-100/50 cursor-not-allowed'
                      : 'bg-paper hover:bg-neutral-55 border-stone text-forest shadow-soft'
                  }`}
                >
                  <ThumbsUp className="h-3 w-3 inline mr-1" />
                  <span>{userState.hasVoted ? 'Voted' : userState.isAuthor ? 'Own' : 'Vote'}</span>
                </button>
              </div>
 
              {/* Verifications */}
              <div className="p-3 border border-stone bg-transparent rounded-2xl shadow-soft">
                <p className="ballot-count">{issue.verifications || 0}/3</p>
                <p className="ballot-count-label mt-1">Verifies</p>
                
                <button
                  onClick={() => verifyIssue(issue.id)}
                  disabled={userState.hasVerified || userState.isAuthor || issue.status !== 'Reported'}
                  className={`mt-3 w-full border py-1.5 px-3 text-sm font-mono font-bold uppercase tracking-widest rounded-full transition-all ${
                    userState.hasVerified 
                      ? 'bg-terracotta border-transparent text-white disabled:opacity-100'
                      : userState.isAuthor
                      ? 'border-stone text-neutral-450 bg-neutral-100/50 cursor-not-allowed'
                      : 'bg-paper hover:bg-neutral-55 border-stone text-forest shadow-soft'
                  }`}
                >
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  <span>{userState.hasVerified ? 'Verified' : userState.isAuthor ? 'Own' : 'Verify'}</span>
                </button>
              </div>
            </div>
            
            {issue.status === 'Reported' && (
              <p className="verification-note relative z-10">
                <span>Verifications award </span><strong>+5 XP</strong>. 3 verifications promote cards to <strong>Verified</strong>.
              </p>
            )}
          </div>

          {/* AI Analysis Stats Sidebar (Roman Arch Thumbnail) */}
          <div className="sidebar-panel bg-paper border border-stone rounded-[32px] space-y-4 shadow-soft">
            <h3 className="sidebar-panel-title ml-1">Metadata Indices</h3>
            
            <div className="space-y-3.5 font-mono text-sm">
              <div className="aspect-video w-full border border-stone overflow-hidden relative bg-neutral-100 arch-image shadow-soft">
                <img src={issue.imageUrl} alt="Thumbnail preview" className="w-full h-full object-cover arch-image" />
                <div className="absolute inset-0 halftone-placeholder pointer-events-none opacity-5" />
              </div>

              <div className="meta-row flex justify-between items-center ml-1">
                <span className="meta-label">Severity Class</span>
                <span className="severity-value text-terracotta">
                  SEV {issue.severity}/10 &bull; {issue.urgencyLevel || 'Moderate'}
                </span>
              </div>

              <div className="meta-row flex justify-between items-center ml-1">
                <span className="meta-label">Fix Window</span>
                <span className="fix-window-value">
                  {issue.estimatedResolutionDays || 5} days
                </span>
              </div>

              <div className="meta-row flex flex-col gap-1 ml-1">
                <span className="meta-label">Agency Department</span>
                <span className="agency-name">
                  {issue.recommendedAuthority}
                </span>
              </div>
            </div>
          </div>

          {/* Copyable Letter Card (Highly rounded paper card) */}
          {issue.complaintLetter && (
            <div className="sidebar-panel bg-paper border border-stone rounded-[32px] space-y-3 relative shadow-soft overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(140,154,132,0.02)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              
              <div className="relative z-10 flex justify-between items-center ml-1">
                <h4 className="filing-letter-heading">Filing Letter</h4>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(issue.complaintLetter);
                    triggerToast("Complaint letter copied.");
                  }}
                  className="copy-btn flex items-center gap-0.5 text-terracotta hover:underline"
                >
                  <FileText className="h-3 w-3 inline" /> Copy
                </button>
              </div>
              <div className="filing-letter-body relative z-10 rounded-2xl border border-stone bg-[#FAF9F6] p-3.5 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {issue.complaintLetter}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
