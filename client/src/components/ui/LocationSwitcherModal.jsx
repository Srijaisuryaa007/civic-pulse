import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LOCATION_DATA, resolveExactCoordinates } from '../../data/locationData';
import { Globe, MapPin, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function LocationSwitcherModal({ isOpen, onClose }) {
  const { user, completeOnboarding } = useAuth();
  
  const [country, setCountry] = useState('United States');
  const [region, setRegion] = useState('California');
  const [city, setCity] = useState('San Francisco');
  const [ward, setWard] = useState('Mission District');
  const [loading, setLoading] = useState(false);

  const countries = Object.keys(LOCATION_DATA).sort();
  const regions = country && LOCATION_DATA[country] ? Object.keys(LOCATION_DATA[country]).sort() : [];
  const citiesObj = country && region && LOCATION_DATA[country]?.[region] ? LOCATION_DATA[country][region] : {};
  const cities = Object.keys(citiesObj).sort();

  // Populate from existing user profile if available
  useEffect(() => {
    if (user) {
      if (user.country && LOCATION_DATA[user.country]) setCountry(user.country);
      if (user.region) setRegion(user.region);
      if (user.city) setCity(user.city);
      if (user.ward) setWard(user.ward);
    }
  }, [user, isOpen]);

  // Sync region when country changes
  useEffect(() => {
    if (country && LOCATION_DATA[country]) {
      const availRegions = Object.keys(LOCATION_DATA[country]);
      if (!availRegions.includes(region)) {
        const firstReg = availRegions[0] || '';
        setRegion(firstReg);
        const availCities = firstReg && LOCATION_DATA[country][firstReg] ? Object.keys(LOCATION_DATA[country][firstReg]) : [];
        setCity(availCities[0] || '');
      }
    }
  }, [country]);

  // Sync city when region changes
  useEffect(() => {
    if (country && region && LOCATION_DATA[country]?.[region]) {
      const availCities = Object.keys(LOCATION_DATA[country][region]);
      if (!availCities.includes(city)) {
        setCity(availCities[0] || '');
      }
    }
  }, [country, region]);

  if (!isOpen) return null;

  const handleCountryChange = (e) => {
    const nextCountry = e.target.value;
    setCountry(nextCountry);
  };

  const handleRegionChange = (e) => {
    const nextRegion = e.target.value;
    setRegion(nextRegion);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const coords = resolveExactCoordinates(country, region, city);
      const payload = {
        country,
        region,
        city,
        ward,
        locationCoordinates: coords,
        onboardingCompleted: true
      };

      // 1. Update user context & DB profile
      await completeOnboarding(payload);

      // 2. Dispatch custom event for Gta5FlightManager animation to execute
      const flightData = {
        lat: coords.lat,
        lng: coords.lng,
        city: city,
        country: country
      };
      window.dispatchEvent(new CustomEvent('gta5_flight_trigger', { detail: flightData }));

      // Close modal
      onClose();
    } catch (err) {
      console.error('Failed to change location:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg border border-[#EBE5DE] bg-[#FFFFFF] p-8 shadow-soft-xl rounded-3xl flex flex-col justify-between">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>

        <div>
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-[#EBE5DE] pb-4 mb-6">
            <Globe className="h-4.5 w-4.5 text-[#D4AF37]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-[#6C6863]">
              Location Control Panel
            </span>
          </div>

          <h3 className="font-serif text-2xl font-bold tracking-tight text-[#1A1A1A]">
            Reposition Jurisdiction
          </h3>
          <p className="font-sans text-sm text-[#6C6863] mt-2 mb-6 leading-relaxed">
            Shift CivicPulse's active telemetry mapping filters to another sovereign state or city. Changing location will re-run the orbital zoom fly-in descent.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5">
                Sovereign Country
              </label>
              <select
                value={country}
                onChange={handleCountryChange}
                className="w-full px-4 py-2.5 border border-[#EBE5DE] bg-[#F9F8F6] font-sans text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors rounded-xl"
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
                  className="w-full px-4 py-2.5 border border-[#EBE5DE] bg-[#F9F8F6] font-sans text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors rounded-xl"
                >
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5">
                  Municipal City
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#EBE5DE] bg-[#F9F8F6] font-sans text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors rounded-xl"
                >
                  {cities.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5 flex items-center justify-between">
                <span>Ward / Locality</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mission District, Ward 12, Indiranagar"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#EBE5DE] bg-[#F9F8F6] font-sans text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors rounded-xl"
              />
            </div>

            <div className="pt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-[#EBE5DE] text-[#6C6863] hover:text-[#1A1A1A] hover:bg-neutral-50 font-mono text-[11px] uppercase tracking-[0.15em] font-bold transition-all rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#1A1A1A] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#1A1A1A] font-mono text-[11px] uppercase tracking-[0.15em] font-bold transition-all duration-300 flex items-center gap-2 rounded-xl shadow-soft"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{loading ? 'Relocating...' : 'Update & Zoom'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
