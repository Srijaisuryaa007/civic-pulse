import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';
import { MapMarker } from '../components/ui/MapMarker';
import { IssueCard } from '../components/ui/IssueCard';
import { useAuth } from '../context/AuthContext';
import { IconMapPin, IconX } from '@tabler/icons-react';

// Custom component to handle centering
function MapController({ center }) {
  const map = useMap();
  if (center) {
    map.setView(center, map.getZoom());
  }
  return null;
}

export default function MapView() {
  const { issues, upvoteIssue } = useIssues();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeIssue, setActiveIssue] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (!issue.location?.latitude || !issue.location?.longitude) return false;
      if (categoryFilter !== 'all') {
        return issue.category?.toLowerCase() === categoryFilter.toLowerCase();
      }
      return true;
    });
  }, [issues, categoryFilter]);

  const defaultCenter = [40.7128, -74.0060]; // NY default if no issues
  const center = filteredIssues.length > 0 
    ? [filteredIssues[0].location.latitude, filteredIssues[0].location.longitude] 
    : defaultCenter;

  const createIcon = (issue) => {
    const isHighSev = (Number(issue.severity) || 1) >= 7 && issue.status !== 'Resolved';
    const html = renderToString(
      <MapMarker category={issue.category} severity={issue.severity} isPulsing={isHighSev} />
    );
    return L.divIcon({
      html,
      className: 'custom-leaflet-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });
  };

  const categories = ['all', 'pothole', 'water leak', 'streetlight', 'waste'];

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-base flex">
      {/* Map Container */}
      <div className="flex-1 relative h-full">
        <MapContainer 
          center={center} 
          zoom={13} 
          className="w-full h-full z-0"
          zoomControl={false} // Move to top-right manually via CSS if needed or just use default
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapController center={center} />
          
          {filteredIssues.map(issue => (
            <Marker 
              key={issue.id}
              position={[issue.location.latitude, issue.location.longitude]}
              icon={createIcon(issue)}
              eventHandlers={{
                click: () => setActiveIssue(issue)
              }}
            />
          ))}
        </MapContainer>

        {/* Floating UI: Top Left Filters */}
        <div className="absolute top-4 left-4 z-[10] flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium tracking-wide capitalize shadow-md transition-all ${
                categoryFilter === cat 
                  ? 'bg-inverted text-white border border-inverted' 
                  : 'bg-white text-inverted border border-border hover:bg-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Floating UI: Top Right Actions */}
        <div className="absolute top-4 right-4 z-[10] flex flex-col gap-2">
          <button
            onClick={() => navigate('/report')}
            className="px-5 py-2.5 bg-inverted text-white rounded-full text-[13px] font-medium shadow-lg lift-hover flex items-center gap-2"
          >
            <IconMapPin size={16} />
            Report here
          </button>
        </div>
      </div>

      {/* Right Slide Panel */}
      <div 
        className={`absolute top-0 right-0 h-full bg-base border-l border-border shadow-2xl transition-transform duration-300 ease-in-out z-[20] flex flex-col`}
        style={{ width: '360px', transform: activeIssue ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {activeIssue && (
          <div className="h-full overflow-y-auto p-5 pb-20 custom-scrollbar">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-medium text-inverted uppercase tracking-widest">Issue Preview</h3>
              <button 
                onClick={() => setActiveIssue(null)}
                className="p-1.5 rounded-full hover:bg-border text-muted transition-colors"
              >
                <IconX size={20} />
              </button>
            </div>
            
            <IssueCard 
              issue={activeIssue} 
              userUid={user?.uid} 
              onUpvote={upvoteIssue}
            />
            
            <button 
              onClick={() => navigate(`/issue/${activeIssue.id}`)}
              className="w-full mt-2 py-3 border border-inverted rounded-full text-[13px] font-medium text-inverted hover:bg-inverted hover:text-white transition-colors"
            >
              View Full Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
