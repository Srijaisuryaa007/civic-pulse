import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, ShieldAlert, ArrowRight, CheckCircle2, Globe, MapPin, User, AlertTriangle } from 'lucide-react';
import { LOCATION_DATA, resolveExactCoordinates } from '../data/locationData';

export default function OnboardingGate() {
  const { user, completeOnboarding } = useAuth();
  
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [ward, setWard] = useState('');
  const [age, setAge] = useState('');
  const [username, setUsername] = useState(user?.displayName ? user.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 15) : '');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [satelliteFlightData, setSatelliteFlightData] = useState(null);

  // Search states for global autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearchChange = async (val) => {
    setSearchQuery(val);
    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (e) {
      console.warn("Location search error:", e);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSuggestion = (place) => {
    const addr = place.address || {};
    const cityVal = addr.city || addr.town || addr.village || addr.municipality || addr.county || place.name || 'Unknown City';
    const stateVal = addr.state || addr.region || 'Unknown Region';
    const countryVal = addr.country || 'Unknown Country';
    const districtVal = addr.district || addr.county || addr.suburb || addr.neighbourhood || '';

    setCountry(countryVal);
    setRegion(stateVal);
    setCity(cityVal);
    setWard(districtVal);
    setSearchQuery(place.display_name);
    setSuggestions([]);

    const lat = Number(place.lat);
    const lng = Number(place.lon);
    setSatelliteFlightData({ lat, lng, city: cityVal, country: countryVal });
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!country || !city || !satelliteFlightData) {
      setError('Please search and select your location from the suggestions dropdown.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      setError('Please enter a valid age in years.');
      return;
    }
    if (ageNum < 13) {
      setError('Access restricted: CivicPulse municipal audit submission requires citizens to be at least 13 years of age.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      setError('Citizen tag must be at least 3 characters.');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError('Tag may only contain lowercase letters, numbers, and underscores.');
      return;
    }

    setLoading(true);
    setError('');

    const coords = {
      lat: satelliteFlightData.lat,
      lng: satelliteFlightData.lng
    };

    setLoading(true);
    await completeOnboarding({
      country,
      region,
      city,
      ward,
      age: parseInt(age, 10),
      username: cleanUsername,
      locationCoordinates: coords
    });

    // Trigger GTA5 orbital zoom flight directly into the real Leaflet map!
    sessionStorage.setItem('trigger_gta5_map_zoom', JSON.stringify({
      lat: coords.lat,
      lng: coords.lng,
      city,
      country
    }));

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F9F8F6] text-[#1A1A1A] p-4 sm:p-6 overflow-y-auto">
      {/* Subtle Paper Noise & Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(212,175,55,0.03)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl border border-[#EBE5DE] bg-[#FFFFFF] p-8 sm:p-12 shadow-soft-xl rounded-none flex flex-col justify-between min-h-[520px]">
        {/* Top Editorial Progress Header */}
        <div>
          <div className="flex items-center justify-between border-b border-[#EBE5DE] pb-4 mb-8">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 bg-[#D4AF37]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-[#6C6863]">
                Hyperlocal Registry Access
              </span>
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#1A1A1A] font-semibold">
              Step {step} of 3
            </span>
          </div>

          {/* STEP 1: REGIONAL IDENTIFICATION */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">
                  Establish Your Jurisdiction
                </h1>
                <p className="font-sans text-sm text-[#6C6863] mt-2 leading-relaxed">
                  CivicPulse strictly isolates issue feeds and interactive telemetry to your municipal territory. Search for your city, town, village, or district anywhere on Earth.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="relative">
                  <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5 flex items-center justify-between">
                    <span>Search City, Region, or District</span>
                    {searching && <span className="text-[#D4AF37] font-mono text-[9px] animate-pulse">Searching global registry...</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chennai, Brooklyn, London, Shibuya..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full px-4 py-3 border border-[#EBE5DE] bg-[#F9F8F6] font-sans text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors rounded-xl"
                    />
                  </div>

                  {/* Suggestions List */}
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 z-50 border border-[#EBE5DE] bg-[#FFFFFF] shadow-lg rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      {suggestions.map((place) => (
                        <button
                          key={place.place_id}
                          type="button"
                          onClick={() => handleSelectSuggestion(place)}
                          className="w-full text-left px-4 py-3 hover:bg-[#F9F8F6] border-b border-[#EBE5DE]/30 text-xs font-sans text-[#1A1A1A] flex flex-col gap-0.5 transition-colors"
                        >
                          <span className="font-bold text-[13px]">{place.display_name.split(',')[0]}</span>
                          <span className="text-[10px] text-[#6C6863] truncate">{place.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {country && (
                  <div className="p-4 bg-[#F9F8F6] border border-[#EBE5DE] text-xs font-sans text-[#6C6863] space-y-1.5 rounded-xl animate-fadeIn">
                    <div className="font-mono font-bold uppercase text-[10px] text-[#1A1A1A]">Detected Jurisdiction Parameters:</div>
                    <div>• Sovereign Country: <strong className="text-[#1A1A1A]">{country}</strong></div>
                    <div>• State / Region: <strong className="text-[#1A1A1A]">{region}</strong></div>
                    <div>• Municipal City / Area: <strong className="text-[#1A1A1A]">{city}</strong></div>
                    {ward && <div>• Local District / Ward: <strong className="text-[#1A1A1A]">{ward}</strong></div>}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-[#1A1A1A] text-[#FFFFFF] hover:bg-[#D4AF37] hover:text-[#1A1A1A] font-mono text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 flex items-center gap-2 rounded-xl"
                >
                  <span>Confirm Jurisdiction</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: AGE & COMPLIANCE GATE */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">
                  Demographic Verification
                </h1>
                <p className="font-sans text-sm text-[#6C6863] mt-2 leading-relaxed">
                  To maintain the legal integrity of public works filings and AI vision evidence reports, all active reporting citizens must verify their demographic age eligibility.
                </p>
              </div>

              <div className="space-y-4 pt-2 max-w-sm">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5">
                    Age in Years
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    placeholder="Enter your age (e.g. 28)"
                    value={age}
                    onChange={(e) => { setAge(e.target.value); setError(''); }}
                    className="w-full px-4 py-3 border border-[#EBE5DE] bg-[#F9F8F6] font-mono text-lg font-bold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-mono flex items-start gap-2.5">
                  <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-semibold">{error}</span>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-[#EBE5DE] text-[#6C6863] hover:text-[#1A1A1A] font-mono text-xs uppercase tracking-[0.15em] font-bold transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-[#1A1A1A] text-[#FFFFFF] hover:bg-[#D4AF37] hover:text-[#1A1A1A] font-mono text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 flex items-center gap-2"
                >
                  <span>Verify Eligibility</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CITIZEN TAG SETUP */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">
                  Citizen Signature Tag
                </h1>
                <p className="font-sans text-sm text-[#6C6863] mt-2 leading-relaxed">
                  Assign your unique ledger signature tag. This moniker will verify your uploaded road hazard audits and track your civic reputation XP across your region.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5">
                    Ledger Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 font-mono text-sm font-bold text-[#6C6863]">@</span>
                    <input
                      type="text"
                      required
                      placeholder="citizen_hero"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 border border-[#EBE5DE] bg-[#F9F8F6] font-mono text-sm font-bold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                    />
                  </div>
                </div>

                <div className="p-4 bg-[#F9F8F6] border border-[#EBE5DE] text-xs font-sans text-[#6C6863] space-y-1.5">
                  <div className="font-mono font-bold uppercase text-[10px] text-[#1A1A1A]">Configured Parameters:</div>
                  <div>• Jurisdiction: <strong className="text-[#1A1A1A]">{city}, {region}, {country}</strong></div>
                  <div>• Demographic Age: <strong className="text-[#1A1A1A]">{age} years</strong></div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-[#EBE5DE] text-[#6C6863] hover:text-[#1A1A1A] font-mono text-xs uppercase tracking-[0.15em] font-bold transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3.5 bg-[#D4AF37] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FFFFFF] font-mono text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{loading ? 'Activating Profile...' : 'Launch CivicPulse'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-8 border-t border-[#EBE5DE] flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#6C6863]">
          <span>CivicPulse V3.1 Audit Engine</span>
          <span>Encrypted Telemetry</span>
        </div>
      </div>
    </div>
  );
}
