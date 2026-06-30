import React, { useState, useEffect } from 'react';

/**
 * 1. RouteScanSplashLoader (Upgraded Website Startup Splash Screen)
 * Patrol car scanning route with JS-synchronized water splash burst when car passes x=220 pothole.
 */
export function RouteScanSplashLoader({ progress: externalProgress, text = "Scanning route..." }) {
  const [internalProgress, setInternalProgress] = useState(0);
  const [carX, setCarX] = useState(-30);
  const [splashActive, setSplashActive] = useState(false);
  const [anomalyDetected, setAnomalyDetected] = useState(false);

  useEffect(() => {
    if (externalProgress !== undefined) {
      setInternalProgress(externalProgress);
      return;
    }
    const timer = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev >= 100) return 100;
        const increment = Math.floor(Math.random() * 14) + 6;
        return Math.min(prev + increment, 100);
      });
    }, 180);
    return () => clearInterval(timer);
  }, [externalProgress]);

  // Synchronize patrol car drive + trigger splash exactly when carX crosses pothole (x=220)
  useEffect(() => {
    let animationFrameId;
    let startTime = performance.now();
    const duration = 3800; // 3.8s loop

    const renderLoop = (now) => {
      const elapsed = (now - startTime) % duration;
      const progressRatio = elapsed / duration;
      const currentX = -30 + progressRatio * 500;
      setCarX(currentX);

      // Pothole center is at x=220. Trigger splash when car passes 200 -> 255
      if (currentX >= 200 && currentX <= 255) {
        setSplashActive(true);
        setAnomalyDetected(true);
      } else {
        setSplashActive(false);
        if (currentX > 320 || currentX < 100) {
          setAnomalyDetected(false);
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const beamWidth = Math.max(0, Math.min(440, carX + 30));

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#161614]/95 rounded-[32px] border border-[#D4AF37]/50 shadow-[0_0_60px_rgba(212,175,55,0.25)] backdrop-blur-xl max-w-md w-full mx-auto text-center select-none overflow-hidden relative">
      {/* Top Status Bar */}
      <div className="w-full flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${anomalyDetected ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold">
            {anomalyDetected ? 'ANOMALY DETECTED @ SEC-220' : 'SCANNING ROUTE SECTORS'}
          </span>
        </div>
        <span className="font-mono text-xs font-black text-white bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
          {internalProgress}%
        </span>
      </div>

      {/* Main Vehicle Scan SVG */}
      <div className="w-full relative py-4 flex items-center justify-center">
        <svg viewBox="0 0 440 120" className="w-full max-w-[440px] overflow-visible">
          <defs>
            <linearGradient id="roadG2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#242422" />
              <stop offset="100%" stopColor="#161614" />
            </linearGradient>
            <linearGradient id="beamG2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#BA7517" stopOpacity="0" />
              <stop offset="70%" stopColor="#E0A93F" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#F4C669" stopOpacity="0.95" />
            </linearGradient>
            <radialGradient id="waterFill" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#5BA3E8" />
              <stop offset="100%" stopColor="#1C4F85" />
            </radialGradient>
            <filter id="softGlow2" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Road Base */}
          <rect x="0" y="72" width="440" height="6" fill="url(#roadG2)" rx="3" />
          
          {/* Dynamic Scanner Beam projection */}
          <rect x="0" y="73.5" width={beamWidth} height="3" fill="url(#beamG2)" rx="1.5" />

          {/* Pothole with water reflection */}
          <g className="cp-pothole-water">
            <ellipse cx="220" cy="77" rx="14" ry="3.8" fill="#000" opacity="0.6" />
            <ellipse cx="220" cy="75" rx="12" ry="3.2" fill="url(#waterFill)" />
            <ellipse cx="220" cy="75" rx="12" ry="3.2" fill="none" stroke="#7fb8ef" strokeWidth="0.8" opacity="0.8" />
            {anomalyDetected && (
              <ellipse cx="220" cy="75" rx="20" ry="6" fill="none" stroke="#E0A93F" strokeWidth="1" className="animate-ping opacity-75" />
            )}
          </g>

          {/* JS-synchronized Water Splash Burst when car passes pothole (x=220) */}
          {splashActive && (
            <g className="cp-splash-burst">
              <circle cx="212" cy="62" r="2.5" fill="#7fb8ef" className="animate-bounce" />
              <circle cx="220" cy="56" r="3.2" fill="#5BA3E8" />
              <circle cx="228" cy="63" r="2.2" fill="#7fb8ef" className="animate-bounce" />
              <path d="M210 74 Q220 54 230 74" fill="none" stroke="#5BA3E8" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            </g>
          )}

          {/* Vehicle Vector translated smoothly in JS */}
          <g transform={`translate(${carX}, 75)`} filter="url(#softGlow2)">
            <path d="M-22 -2 L-15 -11 L-2 -13 L13 -13 L20 -7 L22 -2 L22 4 L-22 4 Z" fill="#161614" stroke="#D4AF37" strokeWidth="0.8" />
            <path d="M-13 -10 L-1 -12 L11 -12 L16 -7 L-13 -7 Z" fill="#1f1f1d" />
            {/* Gold cabin scanner glow */}
            <rect x="-2" y="-11.5" width="11" height="4.5" fill="#E0A93F" opacity="0.75" rx="0.5" />
            {/* Wheels */}
            <circle cx="-12" cy="4" r="5.5" fill="#0a0a09" stroke="#D4AF37" strokeWidth="1" />
            <circle cx="12" cy="4" r="5.5" fill="#0a0a09" stroke="#D4AF37" strokeWidth="1" />
            <circle cx="-12" cy="4" r="2" fill="#D4AF37" />
            <circle cx="12" cy="4" r="2" fill="#D4AF37" />
          </g>
        </svg>
      </div>

      <h3 className="font-serif text-xl font-bold text-white tracking-wide mt-4 mb-1">{text}</h3>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#D4AF37]/80">
        AI PATROL UNIT AUTOMATED ROAD INSPECTION
      </p>

      {/* Progress Bar Bottom */}
      <div className="w-full bg-stone-800 h-1.5 rounded-full mt-5 overflow-hidden border border-white/5">
        <div 
          className="bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] h-full transition-all duration-300 ease-out"
          style={{ width: `${internalProgress}%` }}
        />
      </div>
    </div>
  );
}

export function PotholeSplashLoader(props) {
  return <RouteScanSplashLoader {...props} />;
}

/**
 * 2. MapPinTransitionLoader
 * Map pin animates dropping from off-screen top with an ease-out bounce,
 * landing on a baseline, with shadow growing/fading to simulate depth.
 */
export function MapPinTransitionLoader({ text = "Loading Area..." }) {
  return (
    <div className="fixed inset-0 z-[4000] flex flex-col items-center justify-center bg-[#1A1A1A]/90 backdrop-blur-md animate-fadeIn select-none pointer-events-auto">
      <div className="relative flex flex-col items-center justify-center h-48 w-48">
        {/* Bouncing Map Pin */}
        <div className="animate-pinDrop relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-[#D4AF37] border-4 border-[#1A1A1A] flex items-center justify-center shadow-2xl relative">
            <div className="w-5 h-5 rounded-full bg-[#1A1A1A]" />
            <div className="absolute -bottom-2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-[#D4AF37]" />
          </div>
        </div>

        {/* Dynamic Landing Shadow */}
        <div className="mt-4 w-16 h-3 bg-black/70 rounded-full blur-[3px] animate-pinShadow" />
      </div>

      <div className="mt-2 text-center space-y-1">
        <h3 className="font-serif text-2xl font-bold text-white tracking-tight">{text}</h3>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
          SYNCHRONIZING SECTOR DATA
        </p>
      </div>
    </div>
  );
}

/**
 * 3. RoadActionLoader
 * Road path draws left-to-right with a small dot/car following progress.
 */
export function RoadActionLoader({ text = "Filing report..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[#1A1A1A] border border-[#D4AF37]/50 rounded-2xl shadow-xl max-w-xs w-full text-center">
      <div className="relative w-full h-16 flex items-center justify-center overflow-hidden mb-4 bg-black/60 rounded-xl border border-white/10 px-4">
        {/* Road Asphalt Background */}
        <div className="absolute inset-x-0 h-8 bg-stone-900 border-y border-stone-700 flex items-center overflow-hidden">
          {/* Animated Center Road Stripe */}
          <div className="w-full border-t-2 border-dashed border-[#D4AF37] animate-roadStripe" />
        </div>

        {/* Animated Cruiser Car / Dot travelling along the road */}
        <div className="absolute left-4 animate-carTravel flex items-center z-10">
          <div className="w-8 h-4 bg-[#D4AF37] rounded-sm border border-black shadow-[0_0_12px_rgba(212,175,55,0.8)] relative flex items-center justify-end pr-0.5">
            {/* Headlight beam */}
            <div className="absolute -right-6 w-6 h-3 bg-gradient-to-r from-white/90 to-transparent rounded-full blur-[1px]" />
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        </div>
      </div>

      <h4 className="font-serif text-base font-bold text-white tracking-wide">{text}</h4>
      <p className="font-mono text-[11px] uppercase tracking-wider text-[#D4AF37] mt-1 animate-pulse">
        CIVIC AI VERIFICATION IN PROGRESS
      </p>
    </div>
  );
}

/**
 * 4. CompassMappingLoader / GlobalTabSwitchLoader
 * User-provided rotating compass/gauge loader with exact HSL rings, ticks, and arrows.
 */
/**
 * 4. CompassMappingLoader / GlobalTabSwitchLoader
 * User-provided rotating compass/gauge loader with exact HSL rings, ticks, and arrows.
 * Includes slow-network thresholds (4.5s & 11s) and clear network error fallbacks.
 */
export function CompassMappingLoader({ 
  text = "Loading Sector...", 
  error = null, 
  onRetry, 
  loading = true,
  isOverlay = true 
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!loading || error) {
      setElapsed(0);
      return;
    }
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [loading, error]);

  if (error) {
    const errorBox = (
      <div className="flex flex-col items-center justify-center p-8 bg-[#1A1A1A] border border-terracotta/50 rounded-3xl shadow-2xl max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-terracotta/10 border border-terracotta/30 flex items-center justify-center text-terracotta mb-4 animate-pulse">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="font-serif text-2xl font-bold text-white tracking-tight mb-2">Network Connection Interrupted</h3>
        <p className="font-sans text-sm text-neutral-300 mb-6 leading-relaxed">
          {typeof error === 'string' ? error : 'We encountered a problem synchronizing data with CivicPulse servers. Please check your connection or retry.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#C5A028] text-[#1A1A1A] font-sans text-xs font-bold uppercase tracking-widest shadow-soft transition-all duration-300"
          >
            Retry Request
          </button>
        )}
      </div>
    );

    if (isOverlay) {
      return (
        <div className="fixed inset-0 z-[5000] flex flex-col items-center justify-center bg-[#1A1A1A]/95 backdrop-blur-md pointer-events-auto p-6">
          {errorBox}
        </div>
      );
    }
    return errorBox;
  }

  if (!loading) return null;

  let currentSubtext = "CIVICPULSE SECTOR SYNCHRONIZATION";
  if (elapsed >= 4.5 && elapsed < 11) {
    currentSubtext = "Still working — your connection seems slow.";
  } else if (elapsed >= 11) {
    currentSubtext = "Taking longer than usual.";
  }

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-6 flex items-center justify-center drop-shadow-[0_0_35px_rgba(91,163,232,0.35)]">
        <svg className="pl" viewBox="0 0 160 160" width="160px" height="160px" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000"></stop>
              <stop offset="100%" stopColor="#fff"></stop>
            </linearGradient>
            <mask id="mask1">
              <rect x="0" y="0" width="160" height="160" fill="url(#grad)"></rect>
            </mask>
            <mask id="mask2">
              <rect x="28" y="28" width="104" height="104" fill="url(#grad)"></rect>
            </mask>
          </defs>
          
          <g>
            <g className="pl__ring-rotate">
              <circle className="pl__ring-stroke" cx="80" cy="80" r="72" fill="none" stroke="hsl(223,90%,55%)" strokeWidth="16" strokeDasharray="452.39 452.39" strokeDashoffset="452" strokeLinecap="round" transform="rotate(-45,80,80)"></circle>
            </g>
          </g>
          <g mask="url(#mask1)">
            <g className="pl__ring-rotate">
              <circle className="pl__ring-stroke" cx="80" cy="80" r="72" fill="none" stroke="hsl(193,90%,55%)" strokeWidth="16" strokeDasharray="452.39 452.39" strokeDashoffset="452" strokeLinecap="round" transform="rotate(-45,80,80)"></circle>
            </g>
          </g>
          
          <g>
            <g strokeWidth="4" strokeDasharray="12 12" strokeDashoffset="12" strokeLinecap="round" transform="translate(80,80)">
              <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(-135,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(-90,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(-45,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(0,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(45,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(90,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(135,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(180,0,0) translate(0,40)"></polyline>
            </g>
          </g>
          <g mask="url(#mask1)">
            <g strokeWidth="4" strokeDasharray="12 12" strokeDashoffset="12" strokeLinecap="round" transform="translate(80,80)">
              <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(-135,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(-90,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(-45,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(0,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(45,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(90,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(135,0,0) translate(0,40)"></polyline>
              <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(180,0,0) translate(0,40)"></polyline>
            </g>
          </g>
          
          <g>
            <g transform="translate(64,28)">
              <g className="pl__arrows" transform="rotate(45,16,52)">
                <path fill="hsl(3,90%,55%)" d="M17.998,1.506l13.892,43.594c.455,1.426-.56,2.899-1.998,2.899H2.108c-1.437,0-2.452-1.473-1.998-2.899L14.002,1.506c.64-2.008,3.356-2.008,3.996,0Z"></path>
                <path fill="hsl(223,10%,90%)" d="M14.009,102.499L.109,58.889c-.453-1.421,.559-2.889,1.991-2.889H29.899c1.433,0,2.444,1.468,1.991,2.889l-13.899,43.61c-.638,2.001-3.345,2.001-3.983,0Z"></path>
              </g>
            </g>
          </g>
          <g mask="url(#mask2)">
            <g transform="translate(64,28)">
              <g className="pl__arrows" transform="rotate(45,16,52)">
                <path fill="hsl(333,90%,55%)" d="M17.998,1.506l13.892,43.594c.455,1.426-.56,2.899-1.998,2.899H2.108c-1.437,0-2.452-1.473-1.998-2.899L14.002,1.506c.64-2.008,3.356-2.008,3.996,0Z"></path>
                <path fill="hsl(223,90%,80%)" d="M14.009,102.499L.109,58.889c-.453-1.421,.559-2.889,1.991-2.889H29.899c1.433,0,2.444,1.468,1.991,2.889l-13.899,43.61c-.638,2.001-3.345,2.001-3.983,0Z"></path>
              </g>
            </g>
          </g>
        </svg>
      </div>

      <div className="text-center space-y-1.5">
        <h3 className="font-serif text-2xl font-bold text-white tracking-tight">{text}</h3>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#D4AF37] animate-pulse">
          {currentSubtext}
        </p>
        {elapsed >= 11 && onRetry && (
          <div className="pt-4">
            <button
              onClick={onRetry}
              className="px-6 py-2 rounded-full border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/15 font-sans text-xs uppercase tracking-wider font-bold transition-all duration-300 shadow-soft"
            >
              Retry Now
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-[5000] flex flex-col items-center justify-center bg-[#1A1A1A]/95 backdrop-blur-md select-none pointer-events-auto p-6">
        {content}
      </div>
    );
  }

  return content;
}

export function GlobalTabSwitchLoader(props) {
  return <CompassMappingLoader {...props} />;
}
