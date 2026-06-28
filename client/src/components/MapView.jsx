import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, AlertTriangle, Clock, MapPin } from 'lucide-react';

const MAP_STYLES = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
};

const MAP_ATTRIBUTIONS = {
  dark: '© CartoDB',
  satellite: '© Esri',
  light: '© CartoDB',
  terrain: '© OpenTopoMap'
};

export default function MapView({ issues, loading, showHeatmap, activeCategory }) {
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const [mapEngine, setMapEngine] = useState('none'); // 'google', 'leaflet', or 'none'
  const [googleMap, setGoogleMap] = useState(null);
  const [leafletMap, setLeafletMap] = useState(null);
  const googleMarkersRef = useRef([]);
  const leafletMarkersRef = useRef([]);
  const googleHeatmapRef = useRef(null);
  const leafletHeatmapCirclesRef = useRef([]);
  const [mapStyle, setMapStyle] = useState(() => localStorage.getItem('mapStyle') || 'dark');
  const tileLayerRef = useRef(null);

  const switchMapStyle = (styleName) => {
    setMapStyle(styleName);
    localStorage.setItem('mapStyle', styleName);
  };

  // Category styling helper
  const getCategoryStyles = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat === 'pothole') return { color: '#EF4444', label: 'Pothole', bg: 'bg-terracotta' }; // Red
    if (cat === 'water leak') return { color: '#3B82F6', label: 'Water Leak', bg: 'bg-sage' }; // Blue
    if (cat === 'streetlight') return { color: '#F59E0B', label: 'Streetlight', bg: 'bg-clay' }; // Amber
    if (cat === 'waste') return { color: '#10B981', label: 'Waste', bg: 'bg-forest' }; // Green
    return { color: '#3B82F6', label: 'Other', bg: 'bg-sage' };
  };

  // 1. Script loading and engine selection
  useEffect(() => {
    const initializeMaps = async () => {
      // Check if google maps is available globally
      if (window.google && window.google.maps) {
        setMapEngine('google');
        return;
      }

      // If not, load Leaflet dynamically
      try {
        console.log("ℹ️ Google Maps script not loaded. Falling back to OpenStreetMap (Leaflet)...");
        await loadLeafletScripts();
        setMapEngine('leaflet');
      } catch (err) {
        console.error("Failed to load map engine:", err);
      }
    };

    initializeMaps();
  }, []);

  const loadLeafletScripts = () => {
    return new Promise((resolve, reject) => {
      if (window.L) {
        resolve(window.L);
        return;
      }
      // Inject CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.id = 'leaflet-css';
      document.head.appendChild(link);

      // Inject JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.id = 'leaflet-js';
      script.onload = () => resolve(window.L);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // 2. Initialize Google Map
  useEffect(() => {
    if (mapEngine !== 'google' || !mapRef.current || googleMap) return;

    // Default center (San Francisco or user current location)
    const defaultCenter = { lat: 37.7749, lng: -122.4194 };
    
    // Check local storage for last reported center, or use default
    let center = defaultCenter;
    if (issues && issues.length > 0) {
      center = {
        lat: Number(issues[0].location?.latitude) || defaultCenter.lat,
        lng: Number(issues[0].location?.longitude) || defaultCenter.lng
      };
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      styles: document.documentElement.classList.contains('dark') ? getDarkMapStyles() : [],
      disableDefaultUI: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.LEFT_BOTTOM
      },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    setGoogleMap(map);
  }, [mapEngine]);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !mapRef.current || leafletMap) return;

    const L = window.L;
    const defaultCenter = [37.7749, -122.4194];
    let center = defaultCenter;

    if (issues && issues.length > 0) {
      center = [
        Number(issues[0].location?.latitude) || defaultCenter[0],
        Number(issues[0].location?.longitude) || defaultCenter[1]
      ];
    }

    const map = L.map(mapRef.current, {
      center,
      zoom: 13,
      zoomControl: false, // Turn off default top-left control to prevent overlap
      attributionControl: false
    });

    // Add zoom control to bottom-left corner (clear of top-left filters)
    L.control.zoom({
      position: 'bottomleft'
    }).addTo(map);

    // Initial tile layer setup based on active style preference
    const initialUrl = MAP_STYLES[mapStyle] || MAP_STYLES.dark;
    const initialLayer = L.tileLayer(initialUrl, {
      maxZoom: mapStyle === 'terrain' ? 18 : 19,
      attribution: MAP_ATTRIBUTIONS[mapStyle] || '© CartoDB'
    }).addTo(map);
    tileLayerRef.current = initialLayer;

    setLeafletMap(map);
  }, [mapEngine]);

  // Handle Leaflet Map Style switching dynamically
  useEffect(() => {
    if (!leafletMap) return;
    const L = window.L;
    if (tileLayerRef.current) {
      leafletMap.removeLayer(tileLayerRef.current);
    }
    const nextUrl = MAP_STYLES[mapStyle] || MAP_STYLES.dark;
    const nextLayer = L.tileLayer(nextUrl, {
      maxZoom: mapStyle === 'terrain' ? 18 : 19,
      attribution: MAP_ATTRIBUTIONS[mapStyle] || '© CartoDB'
    }).addTo(leafletMap);
    tileLayerRef.current = nextLayer;
  }, [mapStyle, leafletMap]);

  // 4. Update Google Map Markers & Heatmap
  useEffect(() => {
    if (mapEngine !== 'google' || !googleMap) return;

    // Clear existing markers
    googleMarkersRef.current.forEach(m => m.setMap(null));
    if (googleHeatmapRef.current) googleHeatmapRef.current.setMap(null);

    const filteredIssues = issues.filter(issue => {
      const isCatMatch = activeCategory === 'all' || issue.category?.toLowerCase() === activeCategory.toLowerCase();
      return isCatMatch && issue.location?.latitude && issue.location?.longitude;
    });

    // Create markers
    const markers = filteredIssues.map(issue => {
      const lat = Number(issue.location.latitude);
      const lng = Number(issue.location.longitude);
      const styles = getCategoryStyles(issue.category);

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: showHeatmap ? null : googleMap,
        title: issue.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: styles.color,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Create InfoWindow
      const infoWindow = new window.google.maps.InfoWindow({
        content: createPopupHTML(issue, styles)
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMap, marker);
        // Setup listener to route to issue details inside the maps popup
        setTimeout(() => {
          const btn = document.getElementById(`map-popup-btn-${issue.id}`);
          if (btn) {
            btn.addEventListener('click', () => navigate(`/issue/${issue.id}`));
          }
        }, 100);
      });

      return marker;
    });

    googleMarkersRef.current = markers;

    // Create Heatmap
    if (showHeatmap) {
      const heatmapData = filteredIssues.map(issue => {
        return {
          location: new window.google.maps.LatLng(Number(issue.location.latitude), Number(issue.location.longitude)),
          weight: Number(issue.severity) || 5
        };
      });

      const heatmap = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: googleMap,
        radius: 30
      });

      googleHeatmapRef.current = heatmap;
    } else {
      googleHeatmapRef.current = null;
    }
  }, [issues, showHeatmap, activeCategory, googleMap]);

  // 5. Update Leaflet Map Markers & Heatmap
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !leafletMap) return;

    const L = window.L;

    // Clear existing markers & circles
    leafletMarkersRef.current.forEach(m => m.remove());
    leafletHeatmapCirclesRef.current.forEach(c => c.remove());

    const filteredIssues = issues.filter(issue => {
      const isCatMatch = activeCategory === 'all' || issue.category?.toLowerCase() === activeCategory.toLowerCase();
      return isCatMatch && issue.location?.latitude && issue.location?.longitude;
    });

    const newMarkers = [];
    const newCircles = [];

    filteredIssues.forEach(issue => {
      const lat = Number(issue.location.latitude);
      const lng = Number(issue.location.longitude);
      const styles = getCategoryStyles(issue.category);

      // Create custom DivIcon for beautiful colored circular marker pins (always visible)
      const customIcon = L.divIcon({
        html: `<div class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform" style="background-color: ${styles.color}; box-shadow: 0 0 10px ${styles.color};"></div>`,
        className: 'custom-map-pin',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(leafletMap);
      
      // Popup binding
      marker.bindPopup(createPopupHTML(issue, styles), {
        className: 'leaflet-custom-popup'
      });

      marker.on('click', () => {
        setTimeout(() => {
          const btn = document.getElementById(`map-popup-btn-${issue.id}`);
          if (btn) {
            btn.addEventListener('click', () => navigate(`/issue/${issue.id}`));
          }
        }, 100);
      });

      newMarkers.push(marker);

      // Add gorgeous thermographic radar glow circles when Heatmap Overlay is toggled on
      if (showHeatmap) {
        const severityVal = Number(issue.severity) || 5;

        // Outer heat dissipation ring
        const outerCircle = L.circle([lat, lng], {
          color: '#C27B66',
          fillColor: '#C27B66',
          fillOpacity: 0.12,
          radius: 350 + (severityVal * 70), // Scale with severity
          weight: 0
        }).addTo(leafletMap);

        // Hot inner core
        const innerCircle = L.circle([lat, lng], {
          color: '#fb7185',
          fillColor: '#fb7185',
          fillOpacity: 0.35,
          radius: 120 + (severityVal * 25),
          weight: 0
        }).addTo(leafletMap);

        newCircles.push(outerCircle, innerCircle);
      }
    });

    leafletMarkersRef.current = newMarkers;
    leafletHeatmapCirclesRef.current = newCircles;
  }, [issues, showHeatmap, activeCategory, leafletMap]);

  // Popup content generator
  const createPopupHTML = (issue, styles) => {
    return `
      <div class="p-2 font-sans text-slate-800 dark:text-slate-200 max-w-sm">
        <div class="flex items-center gap-1.5 mb-2">
          <span class="px-2.5 py-1 text-[11px] font-mono font-bold uppercase text-white ${styles.bg}">
            ${styles.label}
          </span>
          <span class="flex items-center gap-0.5 text-xs text-rose-600 font-bold">
            Severity ${issue.severity}/10
          </span>
        </div>
        <h4 class="font-serif font-bold text-base leading-tight text-slate-900 dark:text-white mb-1.5 truncate">${issue.title}</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400 mb-2.5 truncate">${issue.location?.address || ''}</p>
        <div class="flex items-center justify-between text-xs text-slate-500 mb-3 border-t border-slate-100 dark:border-slate-850 pt-2">
          <span class="flex items-center gap-0.5 font-mono">${issue.status}</span>
          <span class="font-mono">Votes: ${issue.upvotes || 0}</span>
        </div>
        <button id="map-popup-btn-${issue.id}" class="w-full text-center bg-forest hover:bg-terracotta text-white rounded-none py-2 px-3 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors cursor-pointer focus:outline-none">
          View Detailed Report
        </button>
      </div>
    `;
  };

  // Google Maps Dark Theme Settings
  const getDarkMapStyles = () => [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f282d' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#17263c' }]
    }
  ];

  return (
    <div className="relative h-full w-full rounded-[32px] overflow-hidden border border-stone bg-[#FDFDFB] shadow-inner">
      {/* Map Element */}
      <div ref={mapRef} className="h-full w-full z-10" />

      {/* Style Selector Toggle UI */}
      {mapEngine === 'leaflet' && (
        <div className="map-style-toggle absolute top-4 right-52 z-20">
          {Object.keys(MAP_STYLES).map((styleName) => (
            <button
              key={styleName}
              className={`map-style-btn ${mapStyle === styleName ? 'active' : ''}`}
              onClick={() => switchMapStyle(styleName)}
            >
              {styleName}
            </button>
          ))}
        </div>
      )}

      {/* Map Control Badge showing status (Botanical style) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-forest/90 text-white backdrop-blur border border-stone/30 px-4 py-2 text-xs font-mono uppercase tracking-widest shadow-soft">
        <div className="h-2 w-2 rounded-full bg-sage animate-pulse" />
        <span>Map: {mapEngine === 'google' ? 'Google' : 'OpenStreetMap'}</span>
      </div>

      {(loading || mapEngine === 'none') && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-paper/60 backdrop-blur-sm">
          <MapPin className="h-10 w-10 text-terracotta animate-bounce mb-2" />
          <p className="text-xs font-mono uppercase tracking-widest text-forest font-bold">Loading Map...</p>
        </div>
      )}
    </div>
  );
}
