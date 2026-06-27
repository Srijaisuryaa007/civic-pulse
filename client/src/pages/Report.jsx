import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';
import { useAuth } from '../context/AuthContext';
import { Upload, MapPin, Compass, AlertCircle, Copy, Check, ChevronRight, RefreshCw, Send, Sparkles } from 'lucide-react';

export default function Report() {
  const { reportIssue, triggerToast } = useIssues();
  const { user } = useAuth();
  const navigate = useNavigate();

  // File states
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Location states
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  // AI Pipeline states
  const [step, setStep] = useState(1); // 1: Upload & Location, 2: AI Loading, 3: AI Review & Edit
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Safeguard: Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user]);

  // Handle Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragOver(true);
    } else if (e.type === "dragleave") {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      triggerToast('Please upload an image file', 'error');
      return;
    }
    
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Get GPS Location & Reverse Geocode
  const detectLocation = () => {
    if (!navigator.geolocation) {
      triggerToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude.toString());
        setLng(longitude.toString());

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          if (response.ok) {
            const data = await response.json();
            setAddress(data.display_name || `${latitude}, ${longitude}`);
            triggerToast('Location coordinates mapped.');
          } else {
            setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        } catch (error) {
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        triggerToast('Failed to access geolocation data.', 'error');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Trigger AI Analysis Pipeline
  const startAIAnalysis = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      triggerToast('Please select or upload an image', 'warning');
      return;
    }
    if (!address || !lat || !lng) {
      triggerToast('Location coordinates are required', 'warning');
      return;
    }

    setStep(2);
    setAiAnalyzing(true);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('address', address);
    formData.append('latitude', lat);
    formData.append('longitude', lng);
    formData.append('userId', user.uid);
    formData.append('userName', user.displayName);
    formData.append('userPhoto', user.photoURL);

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to process report');
      }

      const reportData = await response.json();
      setAiData(reportData);
      setStep(3);
    } catch (err) {
      console.error(err);
      triggerToast(err.message || 'Error executing image classification', 'error');
      setStep(1);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Copy Complaint Letter
  const copyLetter = () => {
    if (!aiData?.complaintLetter) return;
    navigator.clipboard.writeText(aiData.complaintLetter);
    setCopied(true);
    triggerToast('Complaint letter copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit/Confirm Report edits
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/issues/${aiData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Reported',
          note: 'Report finalized and confirmed by citizen.',
          title: aiData.title,
          description: aiData.description,
          severity: Number(aiData.severity),
          category: aiData.category,
          recommendedAuthority: aiData.recommendedAuthority
        })
      });

      if (response.ok) {
        triggerToast('Report published.');
        navigate('/issues');
      } else {
        throw new Error('Patch update failure');
      }
    } catch (error) {
      console.error(error);
      navigate('/issues');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 bg-paper">
      
      {/* 1. Step Stepper Header (Soft Pill icons) */}
      <div className="flex items-center justify-center gap-2 mb-8 text-xs font-mono tracking-widest uppercase text-forest">
        <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-stone bg-paper shadow-soft ${step >= 1 ? 'border-sage font-bold text-sage' : ''}`}>
          <span>01.</span>
          <span>Upload</span>
        </div>
        <div className="h-[1px] w-8 bg-stone" />
        <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-stone bg-paper shadow-soft ${step >= 2 ? 'border-sage font-bold text-sage' : ''}`}>
          <span>02.</span>
          <span>AI Classify</span>
        </div>
        <div className="h-[1px] w-8 bg-stone" />
        <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-stone bg-paper shadow-soft ${step >= 3 ? 'border-sage font-bold text-sage' : ''}`}>
          <span>03.</span>
          <span>Confirm</span>
        </div>
      </div>

      {/* STEP 1: UPLOAD AND LOCATION */}
      {step === 1 && (
        <form onSubmit={startAIAnalysis} className="space-y-6 bg-paper p-6 sm:p-8 rounded-[32px] border border-stone shadow-soft-md">
          <div className="text-center md:text-left border-b border-stone pb-4">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest">Report a Civic *Incident*</h1>
            <p className="font-body text-sm text-neutral-500 mt-1">Provide visual proof of a community issue. Our AI engine will inspect files, categorize, and draft documents.</p>
          </div>

          {/* Image Drag & Drop Area (Arch style thumbnail preview) */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center border border-dashed border-stone p-8 rounded-[24px] transition-colors ${
              isDragOver 
                ? 'bg-neutral-50' 
                : 'bg-transparent hover:bg-neutral-50/20'
            }`}
          >
            {imagePreview ? (
              <div className="relative w-full max-h-80 overflow-hidden flex justify-center bg-neutral-100 arch-image border border-stone shadow-soft">
                <img src={imagePreview} alt="Issue preview" className="max-h-80 object-contain arch-image" />
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                  className="absolute top-4 right-4 bg-forest hover:bg-terracotta text-white px-4 py-1.5 text-xs font-mono uppercase tracking-widest rounded-full transition-colors shadow-soft"
                >
                  ✕ Discard
                </button>
              </div>
            ) : (
              <div className="text-center py-8 relative w-full overflow-hidden rounded-[20px]">
                {/* Halftone simulation */}
                <div className="absolute inset-0 halftone-placeholder pointer-events-none opacity-5" />
                <div className="relative z-10">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage/10 text-sage mb-3 border border-sage/25">
                    <Upload className="h-5 w-5 stroke-[1.5]" />
                  </div>
                  <p className="text-xs font-mono uppercase tracking-widest text-forest">
                    Drag and drop file or{' '}
                    <label className="text-terracotta hover:underline cursor-pointer">
                      browse
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </p>
                  <p className="text-[10px] text-neutral-400 font-mono mt-1.5 uppercase tracking-wider">PNG, JPG, WEBP formats only</p>
                </div>
              </div>
            )}
          </div>

          {/* Location Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-1.5 ml-2">GPS Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g. 37.7749"
                className="w-full border-b border-stone bg-transparent p-2.5 text-xs font-mono text-forest focus:bg-neutral-50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-1.5 ml-2">GPS Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="e.g. -122.4194"
                className="w-full border-b border-stone bg-transparent p-2.5 text-xs font-mono text-forest focus:bg-neutral-50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 ml-2">Reverse Geocoded address</label>
              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingLocation}
                className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-terracotta hover:underline disabled:opacity-50"
              >
                {detectingLocation ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Detecting GPS...
                  </>
                ) : (
                  <>
                    <Compass className="h-3.5 w-3.5" />
                    Auto-Acquire GPS
                  </>
                )}
              </button>
            </div>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 102 Market St, San Francisco, CA"
              className="w-full border-b border-stone bg-transparent p-2.5 text-xs font-body text-forest focus:bg-neutral-50 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-stone">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2 text-xs font-mono font-bold uppercase tracking-widest border border-stone bg-transparent hover:bg-neutral-50 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-forest hover:bg-terracotta text-white rounded-full text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all shadow-soft"
            >
              <span>Analyze with AI</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: AI PIPELINE LOADING SKELETON */}
      {step === 2 && (
        <div className="space-y-6 bg-paper p-8 rounded-[32px] border border-stone shadow-soft-md text-center">
          <div className="py-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage/10 text-sage mb-4 relative border border-sage/20 animate-pulse">
              <Sparkles className="h-7 w-7" />
              {/* Halftone simulation */}
              <div className="absolute inset-0 halftone-placeholder pointer-events-none opacity-5 rounded-full" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-forest">
              Executing AI Analytics...
            </h3>
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-450 mt-2 max-w-sm mx-auto leading-relaxed">
              Google Vision extraction & Gemini 1.5 parsing active.
            </p>
          </div>

          {/* Skeletons layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-stone">
            <div className="space-y-3">
              <div className="h-4 w-1/3 bg-neutral-250/20 animate-pulse rounded-full" />
              <div className="h-10 w-full bg-neutral-250/20 animate-pulse rounded-2xl" />
              <div className="h-20 w-full bg-neutral-250/20 animate-pulse rounded-2xl" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-1/4 bg-neutral-250/20 animate-pulse rounded-full" />
              <div className="h-6 w-full bg-neutral-250/20 animate-pulse rounded-2xl" />
              <div className="h-12 w-full bg-neutral-250/20 animate-pulse rounded-2xl" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-1/2 bg-neutral-250/20 animate-pulse rounded-full" />
              <div className="h-24 w-full bg-neutral-250/20 animate-pulse rounded-2xl" />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW AND CONFIRM */}
      {step === 3 && aiData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Image & Main Form details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-paper p-6 rounded-[32px] border border-stone shadow-soft-md relative">
              
              <div className="flex items-center justify-between gap-4 border-b border-stone pb-3 mb-5 flex-wrap">
                <h2 className="font-serif text-xl font-bold text-forest flex items-center gap-1.5">
                  <span>🤖 AI Classification Review</span>
                </h2>
                {aiData.isDuplicate && (
                  <span className="leaf-badge bg-terracotta text-white flex items-center gap-1 animate-pulse">
                    <AlertCircle className="h-3.5 w-3.5" /> Duplicate Identified
                  </span>
                )}
              </div>

              <form onSubmit={handleFinalSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-1 ml-2">Headline Title</label>
                  <input
                    type="text"
                    required
                    value={aiData.title}
                    onChange={(e) => setAiData({ ...aiData, title: e.target.value })}
                    className="w-full border-b border-stone bg-transparent p-2 text-sm font-serif font-bold text-forest focus:bg-neutral-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-1 ml-2">Description Narrative</label>
                  <textarea
                    rows={4}
                    required
                    value={aiData.description}
                    onChange={(e) => setAiData({ ...aiData, description: e.target.value })}
                    className="w-full border-b border-stone bg-transparent p-2 text-sm font-body text-forest focus:bg-neutral-50 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-1 ml-2">Category Class</label>
                    <select
                      value={aiData.category}
                      onChange={(e) => setAiData({ ...aiData, category: e.target.value })}
                      className="w-full border-b border-stone bg-transparent p-2 text-sm font-mono text-forest focus:bg-neutral-50 focus:outline-none"
                    >
                      <option value="pothole">Pothole</option>
                      <option value="water leak">Water Leak</option>
                      <option value="streetlight">Streetlight</option>
                      <option value="waste">Waste Management</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-1 ml-2">Assigned Agency Department</label>
                    <input
                      type="text"
                      required
                      value={aiData.recommendedAuthority}
                      onChange={(e) => setAiData({ ...aiData, recommendedAuthority: e.target.value })}
                      className="w-full border-b border-stone bg-transparent p-2 text-sm font-mono text-forest focus:bg-neutral-50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 ml-2">Severity Index</label>
                      <span className="text-xs font-mono font-black text-terracotta">{aiData.severity}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={aiData.severity}
                      onChange={(e) => setAiData({ ...aiData, severity: Number(e.target.value) })}
                      className="w-full accent-sage h-1 bg-stone appearance-none cursor-pointer rounded-full"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-1 ml-2">Est. Resolution Days</label>
                    <input
                      type="number"
                      value={aiData.estimatedResolutionDays}
                      onChange={(e) => setAiData({ ...aiData, estimatedResolutionDays: Number(e.target.value) })}
                      className="w-full border-b border-stone bg-transparent p-2 text-sm font-mono text-forest focus:bg-neutral-50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* vision labels */}
                {aiData.visionTags && (
                  <div className="pt-2">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-2">Detected Object Labels (Google Vision API)</label>
                    <div className="flex flex-wrap gap-1.5 ml-2">
                      {aiData.visionTags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 border border-stone rounded-full text-[9px] font-mono uppercase bg-[#FDFDFB] text-forest">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duplicate Notification alert */}
                {aiData.isDuplicate && (
                  <div className="p-4 border border-terracotta bg-terracotta/5 rounded-[20px] text-xs text-terracotta leading-relaxed flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-terracotta mt-0.5" />
                    <div>
                      <strong>Duplicate Alert:</strong> An identical report coordinates within 2km radius already exists. We recommend locating and upvoting that entry to accelerate action.
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-stone">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2 text-xs font-mono font-bold uppercase tracking-widest border border-stone bg-transparent hover:bg-neutral-50 rounded-full transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-forest hover:bg-[#1f2822] text-white rounded-full text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all shadow-soft"
                  >
                    <Send className="h-4 w-4" />
                    <span>Publish File</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Letter & Image Preview */}
          <div className="space-y-6">
            
            {/* Image Preview Box */}
            <div className="bg-paper p-4 rounded-[32px] border border-stone shadow-soft-md relative">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-2">Evidence Graphic</label>
              <div className="aspect-video w-full overflow-hidden arch-image border border-stone relative bg-neutral-100 shadow-soft">
                <img src={aiData.imageUrl} alt="Uploaded report" className="w-full h-full object-cover arch-image" />
                <div className="absolute inset-0 halftone-placeholder pointer-events-none opacity-5" />
              </div>
              <div className="flex items-center gap-2 mt-3 text-[10px] font-mono uppercase tracking-wide text-neutral-500 ml-2">
                <MapPin className="h-3.5 w-3.5 text-terracotta shrink-0" />
                <span className="truncate">{aiData.location?.address}</span>
              </div>
            </div>

            {/* Generated Letter Box */}
            {aiData.complaintLetter && (
              <div className="bg-paper p-5 rounded-[32px] border border-stone shadow-soft-md relative overflow-hidden">
                {/* Graph paper pattern inside letter */}
                <div className="absolute inset-0 newsprint-texture opacity-30 pointer-events-none" />
                
                <div className="relative z-10 flex justify-between items-center mb-3">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 ml-2">Complaint Document</label>
                  <button
                    onClick={copyLetter}
                    className="flex items-center gap-1 px-3.5 py-1.5 border border-stone bg-paper hover:bg-forest hover:text-white text-[10px] font-mono uppercase tracking-widest rounded-full transition-colors shadow-soft"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="relative z-10 rounded-2xl border border-stone bg-[#FAF9F6] p-4 max-h-72 overflow-y-auto text-[10px] font-mono text-forest leading-relaxed whitespace-pre-wrap">
                  {aiData.complaintLetter}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
