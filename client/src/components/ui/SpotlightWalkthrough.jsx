import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle2, ShieldCheck, Compass, PlusCircle, MapPin, Award, Layers } from 'lucide-react';

const WALKTHROUGH_STEPS = [
  {
    selector: '[data-tour="nav-tabs"]',
    fallbackRect: { top: 14, left: 180, width: 340, height: 38 },
    title: "1. Navigation Bar & Views",
    badge: "Spotlight 1 of 5 • Navigation",
    description: "Use these top tabs to switch between the live Ward Telemetry Map, the chronological community Issue Feed, Registry Analytics Dashboard, and Verified Impact Case Studies.",
    tooltipSide: "bottom"
  },
  {
    selector: '[data-tour="report-btn"]',
    fallbackRect: { top: 80, right: 24, width: 145, height: 42 },
    title: "2. Instant Geotagged Report Button",
    badge: "Spotlight 2 of 5 • Filing Stream",
    description: "Tap this Quick Report button anytime to snap a photo, auto-detect your exact coordinates, and file an official hazard ticket into the municipal dispatch queue in under 30 seconds.",
    tooltipSide: "bottom-left"
  },
  {
    selector: '[data-tour="map-filters"]',
    fallbackRect: { top: 80, left: 24, width: 360, height: 42 },
    title: "3. Category & Hazard Filters",
    badge: "Spotlight 3 of 5 • Map Telemetry",
    description: "Filter real-time hazard markers by Potholes, Water Leaks, Streetlights, or Refuse. Click any glowing map pin to inspect verification history and repair status.",
    tooltipSide: "bottom"
  },
  {
    selector: '[data-tour="user-profile"]',
    fallbackRect: { top: 12, right: 60, width: 110, height: 40 },
    title: "4. Citizen XP & Active Streaks",
    badge: "Spotlight 4 of 5 • Citizen Rewards",
    description: "Track your Citizen XP score and consecutive weekly participation streaks (🔥). Maintain active weekly engagement to unlock Bronze, Silver, and Gold flame milestones!",
    tooltipSide: "bottom-left"
  },
  {
    selector: '[data-tour="satellite-btn"]',
    fallbackRect: { top: 14, right: 190, width: 115, height: 34 },
    title: "5. GTA5 3D Satellite Zoom",
    badge: "Spotlight 5 of 5 • 3D Globe Flight",
    description: "Click this button to trigger the cinematic GTA5-style orbital flight descent from space directly down to your municipal jurisdiction sector!",
    tooltipSide: "bottom-left"
  }
];

export default function SpotlightWalkthrough({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const step = WALKTHROUGH_STEPS[currentStep];
      const el = document.querySelector(step.selector);

      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      } else if (step.fallbackRect) {
        // Compute from window dimensions if using right property
        const winWidth = window.innerWidth;
        const fb = step.fallbackRect;
        const left = fb.left !== undefined ? fb.left : (winWidth - (fb.right || 0) - fb.width);
        setTargetRect({
          top: fb.top,
          left: Math.max(10, left),
          width: fb.width,
          height: fb.height
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, currentStep]);

  if (!isOpen || !targetRect) return null;

  const stepInfo = WALKTHROUGH_STEPS[currentStep];
  const isLastStep = currentStep === WALKTHROUGH_STEPS.length - 1;

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

  // Compute tooltip position relative to targetRect
  let tooltipTop = targetRect.top + targetRect.height + 16;
  let tooltipLeft = targetRect.left;

  if (stepInfo.tooltipSide === 'bottom-left') {
    tooltipLeft = Math.max(16, targetRect.left + targetRect.width - 360);
  } else if (stepInfo.tooltipSide === 'left') {
    tooltipTop = targetRect.top;
    tooltipLeft = Math.max(16, targetRect.left - 370);
  }

  // Ensure tooltip stays within viewport bounds
  if (tooltipTop + 300 > window.innerHeight) {
    tooltipTop = Math.max(16, targetRect.top - 310);
  }
  if (tooltipLeft + 360 > window.innerWidth) {
    tooltipLeft = Math.max(16, window.innerWidth - 376);
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none animate-fadeIn">
      {/* 
        Spotlight Cutout Layer:
        Using a large box-shadow on a fixed div over the target element creates an illuminated glowing ring around the actual button!
      */}
      <div
        className="fixed pointer-events-auto transition-all duration-500 ease-out border-2 border-[#D4AF37] rounded-xl"
        style={{
          top: Math.max(0, targetRect.top - 6),
          left: Math.max(0, targetRect.left - 6),
          width: targetRect.width + 12,
          height: targetRect.height + 12,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.82), 0 0 30px rgba(212, 175, 55, 0.9)',
        }}
      />

      {/* High-Contrast Walkthrough Tooltip Popover Box */}
      <div
        className="fixed z-[10000] w-full max-w-[360px] bg-[#FFFFFF] dark:bg-[#151A17] border-2 border-[#D4AF37] rounded-2xl p-6 shadow-[0_15px_50px_rgba(0,0,0,0.9)] transition-all duration-500 ease-out"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-ping" />
            <span className="font-mono text-[11px] uppercase tracking-widest font-bold text-[#D4AF37]">
              {stepInfo.badge}
            </span>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('civicpulse_tour_completed', 'true');
              onClose();
            }}
            className="p-1 rounded-full text-muted hover:text-inverted hover:bg-base transition-colors"
            title="Skip Walkthrough"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Title & Function Description */}
        <div className="space-y-2">
          <h3 className="font-serif text-xl font-bold text-inverted leading-tight">
            {stepInfo.title}
          </h3>
          <p className="font-sans text-xs sm:text-[13px] text-inverted/90 leading-relaxed">
            {stepInfo.description}
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="pt-5 mt-5 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-xs text-muted">
            {WALKTHROUGH_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-5 bg-[#D4AF37]' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 border border-border rounded-full font-mono text-[11px] uppercase font-bold text-muted hover:text-inverted transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Prev
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2 bg-[#1A1A1A] dark:bg-[#D4AF37] hover:opacity-90 text-white dark:text-[#1A1A1A] rounded-full font-mono text-[11px] uppercase tracking-widest font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <span>{isLastStep ? 'Finish Tour' : 'Next Button'}</span>
              {!isLastStep && <ArrowRight className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
