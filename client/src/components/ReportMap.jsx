import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';

const MAP_STYLES = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
};

const customIcon = L.divIcon({
  html: `<div class="flex h-4 w-4 items-center justify-center border border-border bg-background" style="background-color: #FF3D00;"></div>`,
  className: 'custom-map-pin',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

function LocationClicker({ setLat, setLng, setAddress }) {
  useMapEvents({
    click(e) {
      setLat(e.latlng.lat.toString());
      setLng(e.latlng.lng.toString());
      setAddress(''); // clear address so user knows to click "Auto-Acquire GPS" again or it can be auto-fetched
    }
  });
  return null;
}

export default function ReportMap({ lat, lng, setLat, setLng, setAddress }) {
  const { user } = useAuth();
  const [mapStyle, setMapStyle] = useState('satellite');

  const center = (lat && lng && !isNaN(lat) && !isNaN(lng)) 
    ? [Number(lat), Number(lng)] 
    : (user?.locationCoordinates?.lat && user?.locationCoordinates?.lng
        ? [Number(user.locationCoordinates.lat), Number(user.locationCoordinates.lng)]
        : [37.7749, -122.4194]);

  return (
    <div className="relative w-full h-[350px] overflow-hidden border border-border mb-6 bg-background">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url={MAP_STYLES[mapStyle]} />
        <LocationClicker setLat={setLat} setLng={setLng} setAddress={setAddress} />
        {(lat && lng && !isNaN(lat) && !isNaN(lng)) && (
          <Marker position={[Number(lat), Number(lng)]} icon={customIcon} />
        )}
      </MapContainer>

      {/* Style Toggle Overlay */}
      <div className="absolute top-3 left-3 z-[400] flex gap-0 bg-background/90 backdrop-blur-md p-1 border border-border">
        {Object.keys(MAP_STYLES).map(style => (
          <button
            key={style}
            type="button"
            onClick={(e) => { e.preventDefault(); setMapStyle(style); }}
            className={`px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors rounded-none ${
              mapStyle === style ? 'bg-foreground text-background' : 'text-mutedForeground hover:text-foreground hover:bg-muted'
            }`}
          >
            {style}
          </button>
        ))}
      </div>
      
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[400] bg-foreground px-4 py-2 border border-border text-[10px] font-mono uppercase tracking-widest text-background pointer-events-none whitespace-nowrap">
        Click anywhere on the map to drop a pin
      </div>
    </div>
  );
}
