import React from 'react';
import { useMap } from 'react-leaflet';
import Gta5FlightManager from './Gta5FlightManager';

export default function Gta5MapFlightOverlay({ onFlightComplete }) {
  const map = useMap();
  return <Gta5FlightManager leafletMap={map} onFlightComplete={onFlightComplete} />;
}
