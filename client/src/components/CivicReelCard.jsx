import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, CheckCircle2, MessageCircle, AlertTriangle, ArrowUpRight, X, Send, MapPin, User, Shield, ThumbsUp } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../firebase';

export default function CivicReelCard({ issue, user, upvoteIssue, verifyIssue, addComment, triggerToast }) {
  const navigate = useNavigate();
  const [upvotes, setUpvotes] = useState(issue.upvotes || 0);
  const [hasVoted, setHasVoted] = useState(issue.upvotedBy?.includes(user?.uid) || issue.votedBy?.includes(user?.uid));
  
  const [verifications, setVerifications] = useState(issue.verifications || 0);
  const [hasVerified, setHasVerified] = useState(issue.verifiedBy?.includes(user?.uid));

  // Drawer overlay states
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  const [showContact, setShowContact] = useState(false);
  const [contact, setContact] = useState(null);
  const [loadingContact, setLoadingContact] = useState(false);

  const videoRef = useRef(null);
  const isVideo = issue.imageUrl?.includes('/video/upload') || issue.imageUrl?.endsWith('.mp4') || issue.imageUrl?.endsWith('.mov') || issue.imageUrl?.endsWith('.webm');

  // Autoplay/pause videos when visible
  useEffect(() => {
    if (!videoRef.current || !isVideo) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [isVideo]);

  // Real-time comments loader
  useEffect(() => {
    if (!showComments) return;

    const q = query(collection(db, 'comments'), where('issueId', '==', issue.id));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data());
      });
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setComments(list);
    });

    return () => unsub();
  }, [showComments, issue.id]);

  // Fetch verified contacts when contact drawer is opened
  useEffect(() => {
    if (!showContact) return;

    setLoadingContact(true);
    const city = issue.location?.city || '';
    const ward = issue.location?.ward || '';
    const category = issue.category || '';

    fetch(`/api/contacts?city=${encodeURIComponent(city)}&ward=${encodeURIComponent(ward)}&category=${encodeURIComponent(category)}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setContact(data);
        } else {
          setContact(null);
        }
        setLoadingContact(false);
      })
      .catch(err => {
        console.warn("Failed to load contact:", err);
        setContact(null);
        setLoadingContact(false);
      });
  }, [showContact, issue]);

  const handleUpvote = async () => {
    if (!user) {
      triggerToast("Please sign in to vote!", "warning");
      return;
    }
    if (hasVoted) return;

    setHasVoted(true);
    setUpvotes(prev => prev + 1);
    await upvoteIssue(issue.id);
  };

  const handleVerify = async () => {
    if (!user) {
      triggerToast("Please sign in to verify!", "warning");
      return;
    }
    if (hasVerified || issue.status !== 'Reported') return;

    setHasVerified(true);
    setVerifications(prev => prev + 1);
    await verifyIssue(issue.id);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      triggerToast("Please sign in to comment!", "warning");
      return;
    }

    await addComment(issue.id, commentText);
    setCommentText('');
  };

  const handleLikeComment = async (comment) => {
    if (!user) {
      triggerToast("Please sign in to like comments!", "warning");
      return;
    }
    if (!comment.id) return;
    const commentRef = doc(db, 'comments', comment.id);
    const hasLiked = comment.likedBy?.includes(user.uid);
    try {
      await updateDoc(commentRef, {
        likedBy: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likesCount: increment(hasLiked ? -1 : 1)
      });
    } catch (err) {
      console.warn("Failed to like comment:", err);
    }
  };

  const handleReplyTo = (username) => {
    setCommentText(`@${username} `);
  };

  const formatRelativeTime = (dateInput) => {
    if (!dateInput) return '';
    const now = new Date();
    const date = new Date(dateInput);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative w-full h-[calc(100vh-16rem)] min-h-[500px] bg-black rounded-[32px] overflow-hidden snap-start border border-stone shadow-soft-xl flex flex-col justify-end group">
      
      {/* 1. Reels Media Background */}
      <div className="absolute inset-0 w-full h-full bg-neutral-900 pointer-events-none">
        {isVideo ? (
          <video
            ref={videoRef}
            src={issue.imageUrl}
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Media Overlay Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 pointer-events-none" />

      {/* 2. Reels Details & Metadata Overlays (Left) */}
      <div className="absolute bottom-5 left-5 right-16 z-10 text-white space-y-2.5 text-left pointer-events-auto">
        
        {/* Reporter info */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-forest border border-stone text-xs font-mono font-bold flex items-center justify-center uppercase shrink-0">
            {issue.reporter?.displayName?.substring(0, 2).toUpperCase() || 'CR'}
          </div>
          <div>
            <span className="text-[13px] font-bold tracking-tight">
              {issue.reporter?.displayName || 'Citizen Hero'}
            </span>
            <span className="text-[9px] text-white/60 font-mono block">
              {new Date(issue.createdAt).toLocaleDateString()}
            </span>
          </div>
          <span className={`ml-2 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest rounded-full font-bold ${
            issue.status === 'Resolved' ? 'bg-emerald-600 text-white' : 'bg-[#D4AF37] text-black'
          }`}>
            {issue.status}
          </span>
        </div>

        {/* Issue Category & Title */}
        <div>
          <span className="inline-block px-2.5 py-0.5 bg-white/15 backdrop-blur-md rounded-full text-[9px] font-mono uppercase tracking-wider font-bold mb-1 border border-white/10">
            {issue.category}
          </span>
          <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight line-clamp-1 drop-shadow">
            {issue.title}
          </h3>
        </div>

        {/* Narrative Description */}
        <p className="text-[12px] text-white/80 line-clamp-2 leading-relaxed drop-shadow">
          {issue.description}
        </p>

        {/* Location pin */}
        <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] font-semibold drop-shadow">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{issue.location?.address}</span>
        </div>

      </div>

      {/* 3. Instagram-style Reels Sidebar Actions (Right) */}
      <div className="absolute right-4 bottom-5 z-20 flex flex-col items-center gap-4 text-white">
        
        {/* Heart Action (Upvote) */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleUpvote}
            className={`h-11 w-11 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-md border border-white/10 shadow-soft transition-all active:scale-90 ${
              hasVoted ? 'text-red-500 scale-105 bg-white/15' : 'hover:text-red-400'
            }`}
          >
            <Heart className={`h-5 w-5 ${hasVoted ? 'fill-current' : ''}`} />
          </button>
          <span className="text-[10px] font-mono mt-1 font-bold">{upvotes}</span>
        </div>

        {/* Shield Action (Verify) */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleVerify}
            disabled={hasVerified || issue.status !== 'Reported'}
            className={`h-11 w-11 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-md border border-white/10 shadow-soft transition-all active:scale-90 ${
              hasVerified ? 'text-amber-500 scale-105 bg-white/15' : 'hover:text-amber-400'
            }`}
          >
            <CheckCircle2 className={`h-5 w-5 ${hasVerified ? 'fill-current' : ''}`} />
          </button>
          <span className="text-[10px] font-mono mt-1 font-bold">{verifications}</span>
        </div>

        {/* Bubble Action (Comments) */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setShowComments(true)}
            className="h-11 w-11 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-md border border-white/10 shadow-soft hover:bg-white/15 transition-colors active:scale-90"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <span className="text-[10px] font-mono mt-1 font-bold">{issue.commentsCount || comments.length || 0}</span>
        </div>

        {/* Contact Action (Municipal agency) */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setShowContact(true)}
            className="h-11 w-11 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-md border border-white/10 shadow-soft hover:bg-white/15 transition-colors active:scale-90"
          >
            <AlertTriangle className="h-5 w-5" />
          </button>
          <span className="text-[9px] font-sans font-bold mt-1 tracking-tighter">Agency</span>
        </div>

        {/* Details Link */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => navigate(`/issue/${issue.id}`)}
            className="h-11 w-11 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-md border border-white/10 shadow-soft hover:bg-white/15 transition-colors active:scale-90"
          >
            <ArrowUpRight className="h-5 w-5" />
          </button>
          <span className="text-[9px] font-sans font-bold mt-1 tracking-tighter">Details</span>
        </div>

      </div>

      {/* 4. Inline Drawer: Comments Bottom Sheet */}
      {showComments && (
        <div className="absolute inset-x-0 bottom-0 top-1/4 bg-paper/95 backdrop-blur border-t border-stone rounded-t-[32px] z-30 flex flex-col p-5 animate-slideUp font-mono">
          <div className="flex items-center justify-between border-b border-stone pb-3 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-450">
              Comments ({comments.length})
            </span>
            <button
              onClick={() => setShowComments(false)}
              className="text-neutral-450 hover:text-forest focus:outline-none cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-left text-xs">
            {comments.length === 0 ? (
              <p className="text-center text-neutral-400 py-10">No correspondence filed yet.</p>
            ) : (
              comments.map((comment) => {
                const hasLikedComment = comment.likedBy?.includes(user?.uid);
                return (
                  <div key={comment.id} className="flex items-start justify-between gap-2.5 pb-3 border-b border-stone/20 last:border-0">
                    <div className="flex gap-2.5 items-start">
                      {comment.userPhoto ? (
                        <img 
                          src={comment.userPhoto} 
                          alt={comment.userName} 
                          className="h-7 w-7 rounded-full object-cover border border-stone shrink-0"
                        />
                      ) : (
                        <div className="h-7 w-7 border border-stone text-forest bg-neutral-100 font-bold flex items-center justify-center uppercase rounded-full shrink-0 text-[10px]">
                          {comment.userName?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-bold text-forest">{comment.userName}</span>
                          <span className="text-[9px] text-neutral-450">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-neutral-500 font-sans leading-relaxed text-xs">{comment.text}</p>
                        <div className="flex items-center gap-3.5 mt-1 text-[9px] font-bold text-neutral-400 uppercase">
                          <button 
                            type="button"
                            onClick={() => handleReplyTo(comment.userName)}
                            className="hover:text-forest transition-colors cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Like button on comment (Instagram-style) */}
                    <button
                      type="button"
                      onClick={() => handleLikeComment(comment)}
                      className={`flex flex-col items-center justify-center p-1.5 hover:scale-105 active:scale-95 transition-all text-neutral-400 ${
                        hasLikedComment ? 'text-red-500' : 'hover:text-neutral-600'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${hasLikedComment ? 'fill-current' : ''}`} />
                      {comment.likesCount > 0 && (
                        <span className="text-[8px] font-mono mt-0.5 font-bold">{comment.likesCount}</span>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Form */}
          <form onSubmit={handlePostComment} className="flex gap-2 pt-3 border-t border-stone mt-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={user ? "Write comment... (+2 XP)" : "Sign in to comment"}
              disabled={!user}
              className="flex-1 border-b border-stone bg-transparent px-3 py-1.5 text-xs text-forest focus:bg-neutral-50 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!user || !commentText.trim()}
              className="px-4 py-1.5 bg-forest hover:bg-terracotta text-white rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1 disabled:opacity-40 cursor-pointer shadow-soft"
            >
              <Send className="h-3 w-3" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* 5. Inline Drawer: Municipal Contact Sheet */}
      {showContact && (
        <div className="absolute inset-x-0 bottom-0 top-1/3 bg-paper/95 backdrop-blur border-t border-stone rounded-t-[32px] z-30 flex flex-col p-6 animate-slideUp font-mono">
          <div className="flex items-center justify-between border-b border-stone pb-3 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-450">
              Responsible Department
            </span>
            <button
              onClick={() => setShowContact(false)}
              className="text-neutral-450 hover:text-forest focus:outline-none cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
            {loadingContact ? (
              <p className="text-center py-10 uppercase tracking-widest animate-pulse">Searching registry...</p>
            ) : contact ? (
              <div className="space-y-4">
                <div className="p-3 border border-stone/50 bg-[#FAF9F6] rounded-2xl text-left">
                  <div className="font-bold text-forest text-sm">{contact.officialName}</div>
                  <div className="text-neutral-400 text-[10px] uppercase tracking-wider mt-0.5">{contact.designation}</div>
                  <div className="text-neutral-500 font-sans text-xs mt-1.5 font-semibold">{contact.department}</div>
                </div>

                <div className="space-y-2 text-left pl-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-450 uppercase tracking-widest min-w-[70px]">Phone:</span>
                    <a href={`tel:${contact.officialPhone}`} className="text-forest hover:underline hover:text-terracotta transition-colors font-bold">
                      {contact.officialPhone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-450 uppercase tracking-widest min-w-[70px]">Email:</span>
                    <a href={`mailto:${contact.officialEmail}`} className="text-forest hover:underline hover:text-terracotta transition-colors font-bold truncate max-w-[200px]" title={contact.officialEmail}>
                      {contact.officialEmail}
                    </a>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-neutral-450 uppercase tracking-widest min-w-[70px] shrink-0 mt-0.5">Office:</span>
                    <span className="text-neutral-500 font-sans leading-relaxed">{contact.officeAddress}</span>
                  </div>
                </div>

                <div className="border-t border-stone/50 pt-3 flex items-center justify-between text-[9px] text-neutral-450">
                  <span>Last verified: {new Date(contact.lastVerified).toLocaleDateString()}</span>
                  {contact.sourceUrl && (
                    <a href={contact.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">
                      Public Portal ↗
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <p className="text-neutral-450 italic text-center leading-relaxed">
                  No verified municipal contact info registry for this category/city combination yet.
                </p>
                <button
                  onClick={() => {
                    setShowContact(false);
                    navigate(`/issue/${issue.id}`);
                  }}
                  className="w-full py-2 bg-forest hover:bg-terracotta text-white font-bold uppercase tracking-widest rounded-full transition-all shadow-soft cursor-pointer text-xs"
                >
                  File Complaint Letter Details
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
