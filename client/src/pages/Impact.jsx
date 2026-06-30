import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconCheck, IconClock, IconMapPin, IconArrowRight, IconQuote, IconBuildingBank, IconAward } from '@tabler/icons-react';

export default function Impact() {
  const [activeStory, setActiveStory] = useState(0);

  const stories = [
    {
      id: 'sf-market-st',
      title: 'Market Street Transit Corridor Pothole Remediation',
      city: 'San Francisco, CA',
      ward: 'Ward 6 / Market St & 4th St Intersection',
      category: 'Road Infrastructure & Asphalt Trench',
      severity: '8.5 / 10 (CRITICAL HAZARD)',
      timeline: 'Resolved in 48 Hours',
      beforeImg: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700',
      afterImg: 'https://images.unsplash.com/photo-1584463623578-38600d832966?w=700',
      agency: 'SFMTA & Bureau of Street Maintenance',
      citizenHero: '@sf_transit_rider (Elena Vance)',
      quote: "Within minutes of taking a photo on CivicPulse, the AI generated a formal legal dispatch citing municipal code section §412. Two days later, a public works crew arrived and laid fresh asphalt. It's the first time I've felt my tax dollars actually respond to citizen feedback.",
      stats: {
        impactScore: '+14,200 Daily Commuters Protected',
        latencyReduced: '82% Faster than standard 311 calls',
        costSaved: '$42,000 in estimated vehicle axle claims averted'
      }
    },
    {
      id: 'blr-indiranagar',
      title: 'Indiranagar Ward 12 Main Line Water Leak Restoration',
      city: 'Bengaluru, KA',
      ward: 'Ward 12 / 100 Feet Road Corridor',
      category: 'Municipal Water Grid & High Pressure Leak',
      severity: '9.2 / 10 (EMERGENCY CRISIS)',
      timeline: 'Resolved in 18 Hours',
      beforeImg: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=700',
      afterImg: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=700',
      agency: 'BWSSB Rapid Intervention Squad',
      citizenHero: '@civic_maya (Maya Krishnan)',
      quote: "Over 1,200 liters of clean potable water were flooding the curb every hour. CivicPulse heatmap clustering flagged our intersection as a critical municipal priority. BWSSB dispatched their emergency repair unit before dawn.",
      stats: {
        impactScore: '28,800 Liters of Clean Water Conserved Daily',
        latencyReduced: '88% Faster response time',
        costSaved: 'Prevented sub-grade soil erosion under primary arterial road'
      }
    },
    {
      id: 'sf-mission-light',
      title: 'Mission District Solar LED Streetlight Modernization',
      city: 'San Francisco, CA',
      ward: 'Ward 9 / Valencia & 24th Street Pedestrian Zone',
      category: 'Public Safety & Illumination Grid',
      severity: '6.8 / 10 (MODERATE VULNERABILITY)',
      timeline: 'Resolved in 5 Business Days',
      beforeImg: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=700',
      afterImg: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=700',
      agency: 'SFPUC Street Lighting Division',
      citizenHero: '@valencia_watch (Marcus Thorne)',
      quote: "Unlit blocks created a dangerous corridor for evening restaurant workers. Our neighborhood association pooled 45 verified CivicPulse reports into a single AI portfolio package that got immediate attention at city hall.",
      stats: {
        impactScore: '14 Blighted Blocks Illuminated with High-Efficiency LEDs',
        latencyReduced: '60% Faster departmental routing',
        costSaved: '42% energy reduction via modern smart photomorph fixtures'
      }
    }
  ];

  const current = stories[activeStory];

  return (
    <div className="bg-base dark:bg-[#0A0D0B] min-h-screen pb-24 font-sans text-inverted transition-colors">
      
      {/* Editorial Header Banner */}
      <div className="bg-[#1A1A1A] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-[#D4AF37]/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.15),transparent_60%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs font-bold uppercase tracking-widest mb-4">
            <IconAward size={14} /> Proven Municipal ROI
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight text-white max-w-3xl leading-tight">
            Transforming Citizen Signals into <em className="italic text-[#D4AF37]">Verified Action.</em>
          </h1>
          <p className="text-white/70 max-w-2xl mt-4 text-base sm:text-lg font-sans font-light leading-relaxed">
            Discover detailed case studies documenting how CivicPulse AI telemetry accelerates departmental dispatch, reduces legal liabilities, and rebuilds public infrastructure trust.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Story Selector Tabs */}
        <div className="flex flex-wrap gap-3 mb-10 border-b border-border pb-6">
          {stories.map((story, idx) => (
            <button
              key={story.id}
              onClick={() => setActiveStory(idx)}
              className={`px-5 py-3 rounded-xl font-sans text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 ${
                activeStory === idx
                  ? 'bg-[#1A1A1A] dark:bg-[#D4AF37] text-white dark:text-[#1A1A1A] shadow-soft-md'
                  : 'bg-surface dark:bg-[#111613] text-muted hover:text-inverted border border-border'
              }`}
            >
              <span>{story.city}</span>
              <span className="opacity-40">•</span>
              <span className="truncate max-w-[180px]">{story.title.split(' ')[0]} {story.title.split(' ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Active Case Study Detail */}
        <div className="bg-surface dark:bg-[#111613] rounded-3xl border border-border overflow-hidden shadow-soft-xl grid grid-cols-1 lg:grid-cols-12 gap-0 animate-fadeIn">
          
          {/* Left / Top: Before & After Visual Comparison (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between bg-base/40 dark:bg-black/20">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-accent-pothole uppercase tracking-widest flex items-center gap-1.5">
                  <IconMapPin size={14} /> {current.ward}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold flex items-center gap-1">
                  <IconCheck size={14} /> Verified Complete
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-inverted mb-6 leading-snug">
                {current.title}
              </h2>
            </div>

            {/* Before / After Photo Split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-sm group">
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur text-white font-mono text-[10px] uppercase font-bold tracking-widest rounded-full z-10">
                  Before · Hazard Filed
                </div>
                <img 
                  src={current.beforeImg} 
                  alt="Before audit" 
                  className="w-full h-56 sm:h-64 object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37] shadow-sm group">
                <div className="absolute top-3 left-3 px-3 py-1 bg-[#D4AF37] text-[#1A1A1A] font-mono text-[10px] uppercase font-bold tracking-widest rounded-full z-10">
                  After · Agency Resolved
                </div>
                <img 
                  src={current.afterImg} 
                  alt="After repair" 
                  className="w-full h-56 sm:h-64 object-cover group-hover:scale-105 transition-all duration-500"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center justify-between text-xs text-muted gap-2">
              <div className="flex items-center gap-1.5 font-mono">
                <IconBuildingBank size={16} className="text-[#D4AF37]" /> Assigned Agency: <strong className="text-inverted">{current.agency}</strong>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <IconClock size={16} className="text-emerald-500" /> Turnaround: <strong className="text-inverted">{current.timeline}</strong>
              </div>
            </div>
          </div>

          {/* Right: Metrics & Citizen Quote (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-base dark:bg-black/30 border border-border space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-widest text-[#D4AF37] font-bold">Auditable Telemetry & Impact</h4>
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between text-xs py-1 border-b border-border/40">
                    <span className="text-muted">Direct Citizen Benefit</span>
                    <span className="font-bold text-inverted text-right">{current.stats.impactScore}</span>
                  </div>
                  <div className="flex items-start justify-between text-xs py-1 border-b border-border/40">
                    <span className="text-muted">Dispatch Acceleration</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-right">{current.stats.latencyReduced}</span>
                  </div>
                  <div className="flex items-start justify-between text-xs py-1">
                    <span className="text-muted">Economic Preservation</span>
                    <span className="font-bold text-inverted text-right">{current.stats.costSaved}</span>
                  </div>
                </div>
              </div>

              {/* Citizen Quote Box */}
              <div className="relative p-6 rounded-2xl border-l-4 border-[#D4AF37] bg-base/50 dark:bg-black/20 italic text-sm text-inverted leading-relaxed">
                <IconQuote size={24} className="text-[#D4AF37]/30 absolute top-3 right-4" />
                <p>"{current.quote}"</p>
                <div className="mt-4 not-italic font-mono text-xs font-bold text-[#D4AF37] flex items-center gap-2">
                  <span>— {current.citizenHero}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
              <Link
                to="/report"
                className="w-full py-3.5 px-6 rounded-xl bg-[#1A1A1A] dark:bg-[#D4AF37] text-white dark:text-[#1A1A1A] font-mono text-xs uppercase tracking-widest font-bold text-center hover:opacity-90 transition-opacity shadow-soft"
              >
                File Next Infrastructure Audit →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
