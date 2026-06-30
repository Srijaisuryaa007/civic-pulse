import React, { useState, useEffect, useRef } from 'react';
import { Globe, MapPin, X, ShieldCheck } from 'lucide-react';

// Web Audio API Synthesizer for Gentle, Relaxing Melodic Flight Chimes
function playGentleMelody() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Gentle ascending Major 9th / Pentatonic chime arpeggio (C5, G5, B5, D6, E6)
    const notes = [523.25, 783.99, 987.77, 1174.66, 1318.51];
    notes.forEach((freq, i) => {
      const startTime = ctx.currentTime + i * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine'; // Soft, pure sine tone
      osc.frequency.setValueAtTime(freq, startTime);

      // Super soft volume (0.05 max) so it never hurts ears
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.045, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 1.25);
    });

    // Gentle resolution chord when landing (~2.2s)
    const arrivalNotes = [261.63, 392.00, 523.25, 659.25]; // C4 Major
    arrivalNotes.forEach((freq) => {
      const startTime = ctx.currentTime + 2.2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.035, startTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 2.05);
    });
  } catch (e) {
    console.warn('Audio synthesis restricted:', e);
  }
}

export default function Gta5FlightManager({ leafletMap, googleMap, onFlightStart, onFlightComplete }) {
  const [flightState, setFlightState] = useState(null); // { phase: 'descending'|'arrived', city, country, lat, lng }
  const [radialFlash, setRadialFlash] = useState(false);
  const [showDestinationMarker, setShowDestinationMarker] = useState(false);
  const timersRef = useRef([]);

  // Use refs to track latest map instances to avoid stale closures in timeouts
  const leafletMapRef = useRef(leafletMap);
  const googleMapRef = useRef(googleMap);

  useEffect(() => {
    leafletMapRef.current = leafletMap;
    googleMapRef.current = googleMap;
  }, [leafletMap, googleMap]);

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  const executeFlight = (data) => {
    const activeLeafletMap = leafletMapRef.current;
    const activeGoogleMap = googleMapRef.current;
    const map = activeLeafletMap || activeGoogleMap;
    if (!map || !data) return;

    clearTimers();
    const lat = Number(data.lat) || 37.7749;
    const lng = Number(data.lng) || -122.4194;
    const city = data.city || 'Municipal Jurisdiction';
    const country = data.country || 'Global Registry';

    setFlightState({ phase: 'descending', city, country, lat, lng });
    setRadialFlash(false);
    setShowDestinationMarker(false);

    if (onFlightStart) onFlightStart();
    playGentleMelody();

    if (activeLeafletMap) {
      // Step 1: Instantly jump high to continental satellite orbit (Zoom 3)
      activeLeafletMap.stop();
      activeLeafletMap.setView([lat, lng], 3, { animate: false });

      // Step 2: Trigger Leaflet native flyTo down to target zoom 15 with easing
      timersRef.current.push(setTimeout(() => {
        activeLeafletMap.flyTo([lat, lng], 15, {
          duration: 2.3,
          easeLinearity: 0.15
        });
      }, 100));
    } else if (activeGoogleMap) {
      activeGoogleMap.setZoom(3);
      activeGoogleMap.panTo({ lat, lng });
      timersRef.current.push(setTimeout(() => {
        activeGoogleMap.setZoom(15);
      }, 1200));
    }

    // Step 3: Camera plunges into tropospheric cloud layer (~850ms)
    timersRef.current.push(setTimeout(() => {
      setRadialFlash(true);
    }, 850));

    // Step 4: Camera breaks through below clouds into clear sky (~1800ms)
    timersRef.current.push(setTimeout(() => {
      setRadialFlash(false);
    }, 1800));

    // Step 5: Camera settles at zoom 15 (~2400ms) - pop destination marker & show card
    timersRef.current.push(setTimeout(() => {
      setFlightState(prev => prev ? { ...prev, phase: 'arrived' } : null);
      setShowDestinationMarker(true);
    }, 2400));

    // Step 6: Complete flight automatically after holding destination view
    timersRef.current.push(setTimeout(() => {
      finishFlight(lat, lng);
    }, 4500));
  };

  const finishFlight = (lat, lng) => {
    clearTimers();
    const activeLeafletMap = leafletMapRef.current;
    const activeGoogleMap = googleMapRef.current;
    if (activeLeafletMap && lat !== undefined && lng !== undefined) {
      activeLeafletMap.stop();
      activeLeafletMap.setView([lat, lng], 15, { animate: false });
    } else if (activeGoogleMap && lat !== undefined && lng !== undefined) {
      activeGoogleMap.setZoom(15);
      activeGoogleMap.panTo({ lat, lng });
    }

    setFlightState(null);
    setRadialFlash(false);
    setShowDestinationMarker(false);
    sessionStorage.removeItem('trigger_gta5_map_zoom');
    if (onFlightComplete) onFlightComplete();
  };

  const handleSkip = () => {
    if (flightState && flightState.phase === 'descending') {
      finishFlight(flightState.lat, flightState.lng);
    }
  };

  useEffect(() => {
    const checkAndStart = () => {
      const activeLeafletMap = leafletMapRef.current;
      const activeGoogleMap = googleMapRef.current;
      if (!activeLeafletMap && !activeGoogleMap) return;
      const stored = sessionStorage.getItem('trigger_gta5_map_zoom');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          sessionStorage.removeItem('trigger_gta5_map_zoom');
          setTimeout(() => executeFlight(data), 750); // Give map 750ms to fully settle
        } catch (e) {
          console.warn(e);
        }
      }
    };

    checkAndStart();

    const handleTrigger = (e) => {
      const activeLeafletMap = leafletMapRef.current;
      const activeGoogleMap = googleMapRef.current;
      if (e.detail && (activeLeafletMap || activeGoogleMap)) {
        executeFlight(e.detail);
      }
    };

    window.addEventListener('gta5_flight_trigger', handleTrigger);
    return () => {
      window.removeEventListener('gta5_flight_trigger', handleTrigger);
      clearTimers();
    };
  }, [leafletMap, googleMap]);

  if (!flightState) return null;

  return (
    <div 
      onClick={handleSkip}
      className="fixed inset-0 z-[3000] overflow-hidden select-none cursor-pointer"
      title="Click anywhere to skip flight"
    >
      {/* 
        Atmospheric Cloud Pass-Through Overlay:
        Simulates camera plunging through thick, voluminous white tropospheric clouds (NO yellow)
      */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out flex items-center justify-center ${
          radialFlash ? 'opacity-100 scale-125 backdrop-blur-md' : 'opacity-0 scale-75 backdrop-blur-none'
        }`}
        style={{
          background: radialFlash
            ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.98) 0%, rgba(248,252,255,0.92) 38%, rgba(235,245,255,0.75) 65%, rgba(220,238,255,0.3) 88%, transparent 100%)'
            : 'transparent'
        }}
      >
        {/* Secondary Wispy Cloud Texture Layers drifting past the lens */}
        <div 
          className={`absolute inset-0 transition-transform duration-1000 ease-out ${
            radialFlash ? 'scale-150 rotate-3' : 'scale-50 rotate-0'
          }`}
          style={{
            backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.85) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.85) 0%, transparent 55%)`
          }}
        />
      </div>

      {/* Top Telemetry Header (Fades out when arrived) */}
      <div className={`absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-auto transition-opacity duration-500 ${
        flightState.phase === 'arrived' ? 'opacity-0' : 'opacity-100'
      }`}>
        <div className="flex items-center gap-3 bg-[#1A1A1A]/90 border border-[#D4AF37] px-4 py-2 rounded-full backdrop-blur-md shadow-2xl">
          <Globe className="h-4 w-4 text-[#D4AF37] animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
            GTA5 ORBITAL DESCENT • LOCKING ON {flightState.city.toUpperCase()}
          </span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); finishFlight(flightState.lat, flightState.lng); }}
          className="bg-[#1A1A1A]/90 hover:bg-[#D4AF37] text-white hover:text-[#1A1A1A] border border-[#D4AF37]/50 px-4 py-2 rounded-full font-mono text-xs uppercase font-bold transition-all flex items-center gap-2 shadow-lg"
        >
          <span>SKIP FLIGHT</span>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Destination Marker Reveal (Bounce & Scale-Up Pop-In at center screen) */}
      {showDestinationMarker && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-bounceScale">
          <div className="relative flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-[#1A1A1A] border-4 border-[#D4AF37] flex items-center justify-center shadow-[0_0_35px_rgba(212,175,55,0.9)] animate-pulse">
              <MapPin className="h-7 w-7 text-[#D4AF37]" />
            </div>
            <div className="h-4 w-4 bg-[#D4AF37] rotate-45 -mt-2 border-r-2 border-b-2 border-[#1A1A1A]" />
            <span className="mt-2 px-3 py-1 bg-[#1A1A1A] border border-[#D4AF37] text-[#D4AF37] font-mono text-xs uppercase font-bold tracking-widest rounded-full shadow-lg">
              {flightState.city}
            </span>
          </div>
        </div>
      )}

      {/* GTA5 Name-Card Slam Reveal */}
      <div className={`absolute inset-0 flex items-end sm:items-center justify-center p-6 pb-20 sm:pb-6 pointer-events-none transition-all duration-700 transform ${
        flightState.phase === 'arrived' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <div className="bg-[#1A1A1A]/95 border-2 border-[#D4AF37] p-8 sm:p-10 rounded-2xl text-center max-w-lg shadow-[0_0_70px_rgba(212,175,55,0.5)] backdrop-blur-xl space-y-3 pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] font-mono text-xs uppercase tracking-widest font-bold">
            <ShieldCheck className="h-4 w-4" /> Destination Locked
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
            {flightState.city}
          </h2>
          <p className="font-mono text-sm text-[#D4AF37] uppercase tracking-widest">
            {flightState.country} • MUNICIPAL AUDIT ZONE
          </p>
          <div className="pt-4 border-t border-white/15 font-sans text-xs text-white/85 leading-relaxed">
            Slippy map tiles locked at Zoom 15. All hyperlocal hazard markers and community upvotes for your municipal jurisdiction are live.
          </div>
        </div>
      </div>
    </div>
  );
}
