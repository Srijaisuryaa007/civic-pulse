import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle2, ShieldCheck, Map, PlusCircle, Award, Compass } from 'lucide-react';

const TOUR_STEPS = [
  {
    title: "Live Community Issue Stream",
    subtitle: "Real-time municipal telemetry",
    description: "Explore civic hazards reported by fellow citizens in your exact ward. Upvote urgent potholes, water leaks, or lighting failures to push them higher on the municipal dispatch priority list.",
    icon: Compass,
    badge: "Indication 1 • Feed Navigation",
    highlightText: "Tip: Look out for '● LIVE' badges indicating reports filed within the last hour."
  },
  {
    title: "Instant Geotagged Audit Filing",
    subtitle: "File a verified report in 30 seconds",
    description: "Spotted an infrastructure hazard? Tap the '+ Report Issue' button. Snap a quick photo, confirm location, and our AI automatically categorizes and routes the ticket to the right department.",
    icon: PlusCircle,
    badge: "Indication 2 • Filing Stream",
    highlightText: "Tip: Uploading clear photos speeds up verification by 4x."
  },
  {
    title: "Interactive Geospatial Map",
    subtitle: "Ward cluster heatmaps",
    description: "Switch to the Map View to inspect live clustering of hazards across your city. Track which streets have active repair crews and view AI hazard forecasts before bottlenecks happen.",
    icon: Map,
    badge: "Indication 3 • Map View",
    highlightText: "Tip: Click any map pin to inspect real-time resolution timelines."
  },
  {
    title: "Cleanliness Streaks & Leaderboard",
    subtitle: "Earn flame badges for vigilance",
    description: "Consistency builds clean cities. Participate weekly by reporting, upvoting, or verifying resolutions to build your 🔥 Active Streak and unlock milestone Bronze, Silver, and Gold Flame Badges!",
    icon: Award,
    badge: "Indication 4 • Citizen Rewards",
    highlightText: "Tip: Check the Registry Analytics Dashboard to see how your ward ranks!"
  }
];

export default function InteractiveTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const stepInfo = TOUR_STEPS[currentStep];
  const IconComponent = stepInfo.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem('civicpulse_tour_completed', 'true');
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-surface dark:bg-[#111613] border-2 border-[#D4AF37] rounded-3xl p-6 sm:p-8 shadow-[0_10px_50px_rgba(212,175,55,0.25)] flex flex-col justify-between overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-[#D4AF37]" />
              <span className="font-mono text-xs uppercase tracking-widest font-bold text-[#D4AF37]">
                {stepInfo.badge}
              </span>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('civicpulse_tour_completed', 'true');
                onClose();
              }}
              className="p-1 rounded-full text-muted hover:text-inverted hover:bg-base transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-sm">
              <IconComponent className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
                {stepInfo.subtitle}
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-inverted mt-1">
                {stepInfo.title}
              </h3>
            </div>

            <p className="font-sans text-sm text-inverted/90 leading-relaxed pt-1">
              {stepInfo.description}
            </p>

            <div className="p-3.5 rounded-xl bg-base dark:bg-black/40 border border-border flex items-start gap-2.5 font-mono text-xs text-[#D4AF37]">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{stepInfo.highlightText}</span>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="pt-6 mt-6 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-xs text-muted">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-6 bg-[#D4AF37]' : 'w-2 bg-border'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 border border-border rounded-full font-mono text-xs uppercase font-bold text-muted hover:text-inverted transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Prev
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-[#1A1A1A] dark:bg-[#D4AF37] hover:opacity-90 text-white dark:text-[#1A1A1A] rounded-full font-mono text-xs uppercase tracking-widest font-bold transition-all shadow-md flex items-center gap-2"
            >
              <span>{isLastStep ? 'Start Exploring' : 'Next Step'}</span>
              {!isLastStep && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
