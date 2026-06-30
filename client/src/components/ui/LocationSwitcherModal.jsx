import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Globe, X, CheckCircle2, MapPin } from 'lucide-react';

export default function LocationSwitcherModal({ isOpen, onClose }) {
  const { user, completeOnboarding } = useAuth();
  
  const [country, setCountry] = useState('United States');
  const [region, setRegion] = useState('California');
  const [city, setCity] = useState('San Francisco');
  const [ward, setWard] = useState('Mission District');
  const [coordinates, setCoordinates] = useState({ lat: 37.7749, lng: -122.4194 });
  const [loading, setLoading] = useState(false);

  // Search states for global autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  // Populate from existing user profile if available
  useEffect(() => {
    if (user && isOpen) {
      if (user.country) setCountry(user.country);
      if (user.region) setRegion(user.region);
      if (user.city) setCity(user.city);
      if (user.ward) setWard(user.ward);
      if (user.locationCoordinates) setCoordinates(user.locationCoordinates);
      
      const parts = [];
      if (user.city) parts.push(user.city);
      if (user.region) parts.push(user.region);
      if (user.country) parts.push(user.country);
      setSearchQuery(parts.join(', '));
      setSuggestions([]);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

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
    setCoordinates({ lat, lng });
  };

  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            
            const countryVal = addr.country || 'Unknown Country';
            const stateVal = addr.state || addr.region || 'Unknown Region';
            const cityVal = addr.city || addr.town || addr.village || addr.municipality || addr.county || 'Unknown City';
            const districtVal = addr.district || addr.suburb || addr.neighbourhood || addr.county || '';
            const displayVal = data.display_name || `${cityVal}, ${stateVal}, ${countryVal}`;

            setCountry(countryVal);
            setRegion(stateVal);
            setCity(cityVal);
            setWard(districtVal);
            setSearchQuery(displayVal);
            setSuggestions([]);
            setCoordinates({ lat: latitude, lng: longitude });
          }
        } catch (e) {
          console.warn("Reverse geocoding error:", e);
          alert("Failed to resolve location details. Please search manually.");
        } finally {
          setSearching(false);
        }
      },
      (error) => {
        console.warn("Geolocation permission error:", error);
        alert("Geolocation permission denied or failed. Please search manually.");
        setSearching(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!country || !city) {
      alert("Please select a location from the search suggestions dropdown.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        country,
        region,
        city,
        ward,
        locationCoordinates: coordinates,
        onboardingCompleted: true
      };

      // 1. Update user context & DB profile
      await completeOnboarding(payload);

      // 2. Dispatch custom event for Gta5FlightManager animation to execute in-place
      const flightData = {
        lat: coordinates.lat,
        lng: coordinates.lng,
        city: city,
        country: country
      };

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('gta5_flight_trigger', { detail: flightData }));
      }, 150);

      // 3. Close modal
      onClose();
    } catch (err) {
      console.error('Failed to change location:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
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
            Shift CivicPulse's active telemetry mapping filters to another district, town, or state globally. Changing location will trigger the orbital zoom fly-in.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-[#6C6863] mb-1.5 flex items-center justify-between">
                <span>Search City, Region, or District</span>
                {searching && <span className="text-[#D4AF37] font-mono text-[9px] animate-pulse">Searching global registry...</span>}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Search globally: e.g. Chennai, Brooklyn, London..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-[#EBE5DE] bg-[#F9F8F6] font-sans text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleAutoLocate}
                  className="px-4 py-2.5 bg-[#1A1A1A] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#1A1A1A] rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider transition-all border border-[#D4AF37]/20 flex items-center gap-1.5 shrink-0"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Auto-Locate</span>
                </button>
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
