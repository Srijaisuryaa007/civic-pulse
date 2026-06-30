import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe, ShieldAlert, Zap, X, MapPin } from 'lucide-react';

// Web Audio API Synthesizer for Cinematic GTA5 Whoosh Sound Cue
function playCinematicWhoosh() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Low Rumble Oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 2.0);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2.2);

    // High Atmospheric Wind / Filtered Noise Whoosh
    const bufferSize = ctx.sampleRate * 2.5;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 1.2);
    filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 2.4);
    filter.Q.setValueAtTime(3.0, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, ctx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.4);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start();
    whiteNoise.stop(ctx.currentTime + 2.4);
  } catch (e) {
    console.warn('Audio unlock required or silenced:', e);
  }
}

// Convert Lat/Lng to 3D Vector on sphere of radius R
function latLngToVector3(lat, lng, radius = 100) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

// Generate procedural earth texture canvas
function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Dark ocean background
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#060B11');
  grad.addColorStop(0.5, '#0A1520');
  grad.addColorStop(1, '#060B11');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Lat/Lng Grid lines
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
  ctx.lineWidth = 1;
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * 1024;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(2048, y);
    ctx.stroke();
  }
  for (let lng = -180; lng <= 180; lng += 20) {
    const x = ((lng + 180) / 360) * 2048;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }

  // Draw procedural stylized landmass blobs
  ctx.fillStyle = 'rgba(30, 60, 45, 0.85)';
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.5;

  const continents = [
    // North America approx
    { cx: 500, cy: 320, rx: 220, ry: 150 },
    // South America approx
    { cx: 650, cy: 680, rx: 140, ry: 200 },
    // Europe / Africa approx
    { cx: 1050, cy: 450, rx: 190, ry: 280 },
    // Asia approx
    { cx: 1450, cy: 340, rx: 300, ry: 180 },
    // Australia approx
    { cx: 1650, cy: 750, rx: 130, ry: 100 }
  ];

  continents.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.cx, c.cy, c.rx, c.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  return new THREE.CanvasTexture(canvas);
}

// Generate procedural cloud texture
function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 512);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = 30 + Math.random() * 80;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

export default function GlobeTransitionModal({ 
  targetLat = 37.7749, 
  targetLng = -122.4194, 
  cityName = "San Francisco", 
  countryName = "United States", 
  onComplete 
}) {
  const mountRef = useRef(null);
  const animFrameId = useRef(null);

  // Transition state flags
  const [phase, setPhase] = useState('flight'); // 'flight' | 'atmosphere' | 'arrived'
  const [radialFlash, setRadialFlash] = useState(false);
  const [atmosphereGlow, setAtmosphereGlow] = useState(false);
  const [showDestinationCard, setShowDestinationCard] = useState(false);

  useEffect(() => {
    playCinematicWhoosh();

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030508');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(300, 200, 300);
    scene.add(dirLight);

    // Earth Sphere
    const earthGeometry = new THREE.SphereGeometry(100, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: createEarthTexture(),
      specular: new THREE.Color(0x222222),
      shininess: 15
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // Atmosphere Cloud Layer
    const cloudGeometry = new THREE.SphereGeometry(102, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: createCloudTexture(),
      transparent: true,
      opacity: 0.4
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(cloudMesh);

    // Target Location Marker (Gold Beacon Pin)
    const targetVec = latLngToVector3(targetLat, targetLng, 100.5);
    const pinGeo = new THREE.SphereGeometry(1.8, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37 });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.copy(targetVec);
    scene.add(pinMesh);

    // Beacon ring around pin
    const ringGeo = new THREE.RingGeometry(2.5, 4.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(latLngToVector3(targetLat, targetLng, 100.7));
    ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(ringMesh);

    // Flight Path Animation Setup
    // Start far out in space on opposite or orbital side
    const startPos = new THREE.Vector3(targetVec.x * 3.5 + 150, targetVec.y * 3.5 + 100, targetVec.z * 3.5 + 200);
    // End close-up right above target pin
    const closeDistance = 118; // Close to surface radius 100
    const endPos = targetVec.clone().normalize().multiplyScalar(closeDistance);

    const startTime = performance.now();
    const duration = 2300; // ~2.3s cinematic zoom

    // Ease-out cubic / expo curve
    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }
    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    const animate = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(rawProgress);

      // Interpolate camera position
      camera.position.lerpVectors(startPos, endPos, easedProgress);

      // Smooth camera lookAt lock onto target vector
      const currentLookAt = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), targetVec, easedProgress);
      camera.lookAt(currentLookAt);

      // Slowly spin cloud layer
      cloudMesh.rotation.y += 0.002;
      ringMesh.scale.setScalar(1 + 0.3 * Math.sin(now * 0.008));

      // Trigger Atmosphere pass-through effect
      if (rawProgress >= 0.52 && rawProgress <= 0.78) {
        setPhase('atmosphere');
        setAtmosphereGlow(true);
        cloudMaterial.opacity = 0.85; // Clouds thicken as we dive through
      } else if (rawProgress > 0.78 && rawProgress < 0.95) {
        setAtmosphereGlow(false);
        setRadialFlash(true); // GTA5 Radial motion blur / chromatic flash
      } else if (rawProgress >= 0.95) {
        setRadialFlash(false);
        setPhase('arrived');
        setShowDestinationCard(true);
      }

      renderer.render(scene, camera);

      if (rawProgress < 1.0) {
        animFrameId.current = requestAnimationFrame(animate);
      } else {
        // Hold for 1.2s showing GTA5 character card, then complete
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1400);
      }
    };

    animFrameId.current = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [targetLat, targetLng]);

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden select-none cursor-pointer" onClick={() => { if (onComplete) onComplete(); }}>
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* GTA5 Radial Motion Blur / Chromatic Flash Overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          radialFlash ? 'opacity-100 backdrop-blur-md bg-white/25' : 'opacity-0'
        }`}
        style={{
          background: radialFlash ? 'radial-gradient(circle at center, transparent 20%, rgba(212,175,55,0.4) 60%, rgba(255,255,255,0.8) 100%)' : 'none'
        }}
      />

      {/* Atmosphere Pass-through White/Blue Cloud Glow */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          atmosphereGlow ? 'opacity-80' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle at center, rgba(140,220,255,0.4) 0%, rgba(255,255,255,0.6) 70%, transparent 100%)'
        }}
      />

      {/* TOP TELEMETRY PILL UI (Fades out during final zoom) */}
      <div className={`absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none transition-opacity duration-500 ${
        phase === 'arrived' ? 'opacity-0' : 'opacity-100'
      }`}>
        <div className="flex items-center gap-3 bg-black/80 border border-[#D4AF37]/50 px-4 py-2 rounded-full backdrop-blur-md shadow-2xl">
          <Globe className="h-4 w-4 text-[#D4AF37] animate-spin" style={{ animationDuration: '8s' }} />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
            SATELLITE TELEMETRY • TARGETING {cityName.toUpperCase()}
          </span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); if (onComplete) onComplete(); }}
          className="pointer-events-auto bg-black/80 hover:bg-[#D4AF37] text-white hover:text-black border border-white/20 px-4 py-2 rounded-full font-mono text-xs uppercase font-bold transition-all flex items-center gap-2 shadow-lg"
        >
          <span>SKIP FLIGHT</span>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* BOTTOM RADAR TELEMETRY INFO */}
      <div className={`absolute bottom-6 left-6 pointer-events-none transition-opacity duration-500 font-mono text-[11px] text-[#D4AF37] bg-black/80 border border-[#D4AF37]/40 p-3 rounded-xl backdrop-blur-md ${
        phase === 'arrived' ? 'opacity-0' : 'opacity-100'
      }`}>
        <p>COORDINATES: {targetLat.toFixed(4)}°N, {targetLng.toFixed(4)}°W</p>
        <p className="mt-0.5 text-white/80">ORBITAL DESCEND SPEED: 14,200 KM/H</p>
        <p className="mt-0.5 text-emerald-400">ATMOSPHERIC ENTRY: STABLE</p>
      </div>

      {/* GTA5 CHARACTER / LOCATION DESTINATION CARD FADE-IN */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700 transform ${
        showDestinationCard ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <div className="bg-black/90 border-2 border-[#D4AF37] p-8 sm:p-10 rounded-2xl text-center max-w-lg shadow-[0_0_50px_rgba(212,175,55,0.4)] backdrop-blur-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] font-mono text-xs uppercase tracking-widest font-bold">
            <MapPin className="h-3.5 w-3.5" /> Sector Secured
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
            {cityName}
          </h2>
          <p className="font-mono text-sm text-[#D4AF37] uppercase tracking-widest">
            {countryName} • MUNICIPAL AUDIT ZONE
          </p>
          <div className="pt-4 border-t border-white/15 font-sans text-xs text-white/80 leading-relaxed">
            Welcome to the active citizen telemetry grid. Your report stream and verified audits will direct immediate municipal priorities here.
          </div>
        </div>
      </div>
    </div>
  );
}
