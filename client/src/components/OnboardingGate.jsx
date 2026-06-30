import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, ShieldAlert, ArrowRight, CheckCircle2, Globe, MapPin, User, AlertTriangle } from 'lucide-react';
import { LOCATION_DATA, resolveExactCoordinates } from '../data/locationData';

export default function OnboardingGate() {
  const { user, completeOnboarding } = useAuth();
  
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState('United States');
  const [region, setRegion] = useState('California');
  const [city, setCity] = useState('San Francisco');
  const [customRegion, setCustomRegion] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [ward, setWard] = useState('Mission District');
  const [age, setAge] = useState('');
  const [username, setUsername] = useState(user?.displayName ? user.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 15) : '');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [satelliteFlightData, setSatelliteFlightData] = useState(null);

  const countries = Object.keys(LOCATION_DATA).sort();
  const regions = country && LOCATION_DATA[country] ? Object.keys(LOCATION_DATA[country]).sort() : [];
  const citiesObj = country && region && LOCATION_DATA[country]?.[region] ? LOCATION_DATA[country][region] : {};
  const cities = Object.keys(citiesObj).sort();

  // Automatically synchronize region when country changes
  useEffect(() => {
    if (country && LOCATION_DATA[country]) {
      const availRegions = Object.keys(LOCATION_DATA[country]);
      if (!availRegions.includes(region) && region !== 'Other') {
        const firstReg = availRegions[0] || '';
        setRegion(firstReg);
        const availCities = firstReg && LOCATION_DATA[country][firstReg] ? Object.keys(LOCATION_DATA[country][firstReg]) : [];
        setCity(availCities[0] || '');
      }
    }
  }, [country]);

  // Automatically synchronize city when region changes
  useEffect(() => {
    if (country && region && LOCATION_DATA[country]?.[region]) {
      const availCities = Object.keys(LOCATION_DATA[country][region]);
      if (!availCities.includes(city) && city !== 'Other') {
        setCity(availCities[0] || '');
      }
    }
  }, [country, region]);

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    const newRegions = LOCATION_DATA[newCountry] ? Object.keys(LOCATION_DATA[newCountry]) : [];
    const firstRegion = newRegions[0] || '';
    setRegion(firstRegion);
    const newCities = firstRegion && LOCATION_DATA[newCountry]?.[firstRegion] ? Object.keys(LOCATION_DATA[newCountry][firstRegion]) : [];
    setCity(newCities[0] || '');
  };

  const handleRegionChange = (e) => {
    const newRegion = e.target.value;
    setRegion(newRegion);
    const newCities = LOCATION_DATA[country]?.[newRegion] ? Object.keys(LOCATION_DATA[country][newRegion]) : [];
    setCity(newCities[0] || '');
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!country) {
      setError('Please select a jurisdiction country.');
      return;
    }
    if (region === 'Other' && !customRegion) {
      setError('Please specify your state or region.');
      return;
    }
    if ((!city || city === 'Other') && !customCity) {
      setError('Please specify your municipal city.');
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

    // Resolve exact coordinates accurately
    const selectedRegionName = region === 'Other' ? customRegion : region;
    const selectedCityName = city === 'Other' ? customCity : city;
    const coords = resolveExactCoordinates(country, selectedRegionName, selectedCityName);

    setLoading(true);
    await completeOnboarding({
      country,
      region: selectedRegionName,
      city: selectedCityName,
      ward,
      age: parseInt(age, 10),
      username: cleanUsername,
      locationCoordinates: coords
    });

    // Trigger GTA5 orbital zoom flight directly into the real Leaflet map!
    sessionStorage.setItem('trigger_gta5_map_zoom', JSON.stringify({
      lat: coords.lat,
      lng: coords.lng,
      city: selectedCityName,
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
                  CivicPulse strictly isolates issue feeds and interactive telemetry to your municipal territory. Select your primary region of residence.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5">
                    Sovereign Country
                  </label>
                  <select
                    value={country}
                    onChange={handleCountryChange}
                    className="w-full px-4 py-3 border border-[#EBE5DE] bg-[#F9F8F6] font-sans text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                  >
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5">
                      State / Region
                    </label>
                    <select
                      value={region}
                      onChange={handleRegionChange}
                      className="w-full px-4 py-3 border border-[#EBE5DE] bg-[#F9F8F6] font-sans text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                    >
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                      <option value="Other">Other / Unlisted State</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5">
                      Municipal City
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 border border-[#EBE5DE] bg-[#F9F8F6] font-sans text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                    >
                      {cities.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                      <option value="Other">Other / Unlisted City</option>
                    </select>
                  </div>
                </div>

                {region === 'Other' && (
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5">
                      Specify State / Region Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Goa, Tasmania, Bavaria"
                      value={customRegion}
                      onChange={(e) => setCustomRegion(e.target.value)}
                      className="w-full px-4 py-3 border border-[#EBE5DE] bg-[#F9F8F6] font-sans text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                    />
                  </div>
                )}

                {city === 'Other' && (
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5">
                      Specify City Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Palo Alto"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      className="w-full px-4 py-3 border border-[#EBE5DE] bg-[#F9F8F6] font-sans text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                    >
                    </input>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5 flex items-center justify-between">
                    <span>Ward / Hyperlocal Locality</span>
                    <span className="text-[#D4AF37] font-semibold text-[10px]">Optional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mission District, Ward 12, Indiranagar"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full px-4 py-3 border border-[#EBE5DE] bg-[#F9F8F6] font-sans text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                  />
                </div>
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
                  className="px-8 py-3.5 bg-[#1A1A1A] text-[#FFFFFF] hover:bg-[#D4AF37] hover:text-[#1A1A1A] font-mono text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 flex items-center gap-2"
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
                  <div>• Jurisdiction: <strong className="text-[#1A1A1A]">{city === 'Other' ? customCity : city}, {region}, {country}</strong></div>
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
