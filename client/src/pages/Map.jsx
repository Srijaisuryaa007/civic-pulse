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
import Gta5MapFlightOverlay from '../components/ui/Gta5MapFlightOverlay';

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

  const userLat = Number(user?.locationCoordinates?.lat);
  const userLng = Number(user?.locationCoordinates?.lng);
  const hasUserLocation = !isNaN(userLat) && !isNaN(userLng) && (userLat !== 0 || userLng !== 0);

  const filteredIssues = useMemo(() => {
    let baseIssues = issues.filter(issue => {
      if (!issue.location?.latitude || !issue.location?.longitude) return false;
      if (categoryFilter !== 'all') {
        return issue.category?.toLowerCase() === categoryFilter.toLowerCase();
      }
      return true;
    });

    if (hasUserLocation) {
      const nearbyCount = baseIssues.filter(i => 
        Math.abs(i.location.latitude - userLat) < 0.8 && Math.abs(i.location.longitude - userLng) < 0.8
      ).length;

      // If no issues exist right near the user's city (e.g. Coimbatore or Chennai), generate localized mock issues around their city!
      if (nearbyCount === 0) {
        const cityName = user?.city || 'Local Sector';
        const generatedLocalIssues = [
          {
            id: 'local-gen-1',
            title: `Severe Asphalt Pothole on Main Corridor`,
            description: `Deep 8-inch road crater causing traffic disruption across ${cityName} arterial road. Requires immediate asphalt repair.`,
            category: 'Pothole',
            severity: 9,
            status: 'Pending Verification',
            upvotes: 42,
            location: {
              latitude: Number((userLat + 0.008).toFixed(4)),
              longitude: Number((userLng - 0.006).toFixed(4)),
              address: `Arterial Road, ${cityName}`
            },
            reporter: { displayName: "Municipal automated telemetry", photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }
          },
          {
            id: 'local-gen-2',
            title: `Underground Water Main Leak`,
            description: `Constant high-pressure water loss pooling along residential sector in ${cityName}.`,
            category: 'Water Leak',
            severity: 8,
            status: 'Verified',
            upvotes: 35,
            location: {
              latitude: Number((userLat - 0.005).toFixed(4)),
              longitude: Number((userLng + 0.009).toFixed(4)),
              address: `North Sector, ${cityName}`
            },
            reporter: { displayName: "Karthik R.", photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" }
          },
          {
            id: 'local-gen-3',
            title: `High-Mast Streetlight Outage`,
            description: `Multiple LED streetlamp fixtures inactive along major junction in ${cityName}.`,
            category: 'Streetlight',
            severity: 6,
            status: 'In Progress',
            upvotes: 19,
            location: {
              latitude: Number((userLat + 0.012).toFixed(4)),
              longitude: Number((userLng + 0.011).toFixed(4)),
              address: `Central Junction, ${cityName}`
            },
            reporter: { displayName: "Ananya S.", photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" }
          },
          {
            id: 'local-gen-4',
            title: `Overflowing Municipal Refuse Bin`,
            description: `Solid waste accumulation requiring immediate dispatch truck pickup in ${cityName}.`,
            category: 'Waste',
            severity: 7,
            status: 'Pending Verification',
            upvotes: 28,
            location: {
              latitude: Number((userLat - 0.011).toFixed(4)),
              longitude: Number((userLng - 0.007).toFixed(4)),
              address: `Market District, ${cityName}`
            },
            reporter: { displayName: "Civic Watch Dog", photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" }
          }
        ];

        const filteredGen = generatedLocalIssues.filter(issue => {
          if (categoryFilter !== 'all') {
            return issue.category?.toLowerCase() === categoryFilter.toLowerCase();
          }
          return true;
        });

        return [...baseIssues, ...filteredGen];
      }
    }

    return baseIssues;
  }, [issues, categoryFilter, userLat, userLng, hasUserLocation, user?.city]);

  const defaultCenter = [40.7128, -74.0060];
  const center = hasUserLocation 
    ? [userLat, userLng]
    : (filteredIssues.length > 0 
        ? [filteredIssues[0].location.latitude, filteredIssues[0].location.longitude] 
        : defaultCenter);

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
            noWrap={true}
            bounds={[[-90, -180], [90, 180]]}
          />
          <MapController center={center} />
          <Gta5MapFlightOverlay />
          
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
        <div data-tour="map-filters" className="absolute top-4 left-4 z-[10] flex gap-2 flex-wrap">
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
            data-tour="report-btn"
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
