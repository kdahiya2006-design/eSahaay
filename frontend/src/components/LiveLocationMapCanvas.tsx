import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  ShieldAlert,
  Ambulance,
  Activity,
  Flame,
  HeartHandshake,
  Home,
  Radio,
  Send,
  ChevronDown,
  ChevronUp,
  Maximize2
} from 'lucide-react';
import type { DispatchServiceType, DispatchDecision } from '../types';
import { ringtoneService } from '../services/ringtoneService';

export interface LiveLocationMapCanvasProps {
  locationName: string;
  decisions: DispatchDecision[];
  onToggleDispatch?: (service: DispatchServiceType) => void;
  onOpenFullScreenMap?: () => void;
  className?: string;
  height?: number | string;
}

interface GeoPoint {
  lat: number;
  lng: number;
}

interface FleetVehicle {
  id: string;
  serviceType: DispatchServiceType;
  unitCode: string;
  name: string;
  vehicleType: string;
  stationName: string;
  officers: string;
  contactNumber: string;
  radioFrequency: string;
  color: string;
  baseLat: number;
  baseLng: number;
  currentLat: number;
  currentLng: number;
  speedKmH: number;
  distanceKm: number;
  etaSeconds: number;
}

// Known Delhi Geographic Anchors for Auto-Geocoding
const DELHI_GEO_ANCHORS: Record<string, GeoPoint> = {
  'munirka': { lat: 28.5583, lng: 77.1728 },
  'vasant vihar': { lat: 28.5606, lng: 77.1610 },
  'hauz khas': { lat: 28.5494, lng: 77.2001 },
  'saket': { lat: 28.5244, lng: 77.2066 },
  'connaught place': { lat: 28.6315, lng: 77.2167 },
  'kashmere gate': { lat: 28.6667, lng: 77.2300 },
  'north delhi': { lat: 28.6920, lng: 77.1950 },
  'rohini': { lat: 28.7166, lng: 77.1167 },
  'noida': { lat: 28.5708, lng: 77.3261 },
  'delhi cantonment': { lat: 28.5961, lng: 77.1350 },
  'dwarka': { lat: 28.5523, lng: 77.0583 },
  'safdarjung': { lat: 28.5695, lng: 77.2069 },
  'aiims': { lat: 28.5672, lng: 77.1985 },
  'bhikaji': { lat: 28.5682, lng: 77.1856 },
  'south delhi': { lat: 28.5450, lng: 77.1920 },
};

function resolveCoordinates(locationName: string): GeoPoint {
  const norm = (locationName || '').toLowerCase();
  for (const [key, coords] of Object.entries(DELHI_GEO_ANCHORS)) {
    if (norm.includes(key)) {
      return coords;
    }
  }
  // Default: Munirka Metro Station, New Delhi
  return { lat: 28.5583, lng: 77.1728 };
}

// Haversine distance in kilometers
function getHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
}

// Initial Fleet across Delhi matching the user's Google Maps / OSM screenshot layout
const INITIAL_FLEET: FleetVehicle[] = [
  {
    id: 'unit-pcr-1',
    serviceType: 'police',
    unitCode: 'PCR-DL-1C-4921',
    name: 'Eagle-04 PCR Patrol',
    vehicleType: 'Innova Emergency Patrol',
    stationName: 'Vasant Vihar Police Station',
    officers: 'SI Rajesh Kumar • Ct. S. Meena',
    contactNumber: '+91 98711 00112',
    radioFrequency: 'VHF Ch. 4 (156.800 MHz)',
    color: '#0284c7', // Sky Blue / Cyan
    baseLat: 28.5606,
    baseLng: 77.1610,
    currentLat: 28.5606,
    currentLng: 77.1610,
    speedKmH: 0,
    distanceKm: 1.2,
    etaSeconds: 150,
  },
  {
    id: 'unit-amb-1',
    serviceType: 'ambulance',
    unitCode: 'AMB-108-DL-31',
    name: 'CATS ALS Life Support',
    vehicleType: 'Force Traveller ALS (Paramedic)',
    stationName: 'CATS Central Standby (Safdarjung Hub)',
    officers: 'Dr. A. Verma • EMT Manoj Rawat',
    contactNumber: '+91 98114 10831',
    radioFrequency: 'VHF Ch. 7 (158.250 MHz)',
    color: '#ef4444', // Red
    baseLat: 28.5695,
    baseLng: 77.2069,
    currentLat: 28.5695,
    currentLng: 77.2069,
    speedKmH: 0,
    distanceKm: 3.4,
    etaSeconds: 240,
  },
  {
    id: 'unit-med-1',
    serviceType: 'medical',
    unitCode: 'HOSP-TRAUMA-01',
    name: 'Apex Emergency Trauma Ward',
    vehicleType: 'Level-1 Emergency Trauma Ward',
    stationName: 'Apex Medical Casualty (AIIMS Campus)',
    officers: 'Dr. P. Swaminathan (CMO)',
    contactNumber: '011-26165060',
    radioFrequency: 'Hospital Hotline 102',
    color: '#dc2626', // Deep Red
    baseLat: 28.5672,
    baseLng: 77.1985,
    currentLat: 28.5672,
    currentLng: 77.1985,
    speedKmH: 0,
    distanceKm: 2.8,
    etaSeconds: 210,
  },
  {
    id: 'unit-fire-1',
    serviceType: 'fire',
    unitCode: 'DFS-WT-04',
    name: 'Delhi Fire Tender #04',
    vehicleType: 'Heavy Water Tender & Foam Monitor',
    stationName: 'Bhikaji Cama Fire Post',
    officers: 'Lead Officer R. Dahiya',
    contactNumber: '011-23412222',
    radioFrequency: 'DFS VHF Band-2',
    color: '#f97316', // Orange
    baseLat: 28.5682,
    baseLng: 77.1856,
    currentLat: 28.5682,
    currentLng: 77.1856,
    speedKmH: 0,
    distanceKm: 1.6,
    etaSeconds: 180,
  },
  {
    id: 'unit-ngo-1',
    serviceType: 'ngo',
    unitCode: 'NGO-SAKHI-01',
    name: 'Sakhi Crisis Cell Van',
    vehicleType: 'Women Crisis Support Escort',
    stationName: 'WCD Sakhi One-Stop Crisis Centre',
    officers: 'Counselor Priya Sen • Off. Sunita',
    contactNumber: 'Helpline: 181 / +91 98110 54321',
    radioFrequency: 'WCD Direct Network',
    color: '#a855f7', // Purple
    baseLat: 28.5450,
    baseLng: 77.1920,
    currentLat: 28.5450,
    currentLng: 77.1920,
    speedKmH: 0,
    distanceKm: 2.1,
    etaSeconds: 260,
  },
  {
    id: 'unit-shelter-1',
    serviceType: 'shelter',
    unitCode: 'SHELTER-SWD-03',
    name: 'Swadhar Sanctuary Safe Shelter',
    vehicleType: 'Protected Women Shelter Facility',
    stationName: 'Vasant Kunj Sanctuary Center',
    officers: 'Warden Kavita Rao • Care Staff',
    contactNumber: '011-26891100',
    radioFrequency: 'Dedicated Secure Dispatch',
    color: '#334155', // Dark Slate Blue
    baseLat: 28.5280,
    baseLng: 77.1550,
    currentLat: 28.5280,
    currentLng: 77.1550,
    speedKmH: 0,
    distanceKm: 3.6,
    etaSeconds: 320,
  },
  // Additional regional standby units across Delhi matching the user's screenshot map distribution
  {
    id: 'unit-north-pcr',
    serviceType: 'police',
    unitCode: 'PCR-NORTH-09',
    name: 'Civil Lines / North Delhi Patrol',
    vehicleType: 'North District PCR Interceptor',
    stationName: 'Kashmere Gate / North Police HQ',
    officers: 'Insp. R. Kaushik • Staff',
    contactNumber: '+91 98111 00112',
    radioFrequency: 'North VHF 157.100',
    color: '#0284c7',
    baseLat: 28.6920,
    baseLng: 77.1950,
    currentLat: 28.6920,
    currentLng: 77.1950,
    speedKmH: 0,
    distanceKm: 14.2,
    etaSeconds: 900,
  },
  {
    id: 'unit-cantt-amb',
    serviceType: 'ambulance',
    unitCode: 'AMB-CANTT-07',
    name: 'Delhi Cantonment Trauma Unit',
    vehicleType: 'Base Hospital Emergency Van',
    stationName: 'Delhi Cantt Military Hospital',
    officers: 'Capt. S. Rawat (MO)',
    contactNumber: '+91 98115 10833',
    radioFrequency: 'Cantt Emergency Net',
    color: '#ef4444',
    baseLat: 28.5961,
    baseLng: 77.1350,
    currentLat: 28.5961,
    currentLng: 77.1350,
    speedKmH: 0,
    distanceKm: 5.8,
    etaSeconds: 420,
  },
  {
    id: 'unit-badarpur-fire',
    serviceType: 'fire',
    unitCode: 'DFS-SOUTH-02',
    name: 'South East Fire Post',
    vehicleType: 'Rapid Fire Response Tender',
    stationName: 'South East Delhi Fire Station',
    officers: 'Asst. Div Officer Singh',
    contactNumber: '011-26941111',
    radioFrequency: 'South Fire Ch. 3',
    color: '#f97316',
    baseLat: 28.5080,
    baseLng: 77.2950,
    currentLat: 28.5080,
    currentLng: 77.2950,
    speedKmH: 0,
    distanceKm: 12.5,
    etaSeconds: 840,
  },
];

// Helper to create exact Google Maps / OSM teardrop pin icons matching user screenshot
function createTeardropPin(
  color: string,
  iconType: DispatchServiceType | 'caller',
  label?: string,
  isDispatched?: boolean
): L.DivIcon {
  const isCaller = iconType === 'caller';

  // SVG inner glyph
  let iconSvg = '';
  if (isCaller) {
    iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="#ffffff"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  } else if (iconType === 'police') {
    iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="${color}"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`;
  } else if (iconType === 'ambulance' || iconType === 'medical') {
    iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="${color}"><path d="M19 14h-3V7c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h1c0 1.66 1.34 3 3 3s3-1.34 3-3h4c0 1.66 1.34 3 3 3s3-1.34 3-3h1v-4l-3-4zm-11 5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7-7H9V8h6v4zm3 7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`;
  } else if (iconType === 'fire') {
    iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="${color}"><path d="M12 2c-.67 0-1.31.2-1.85.57C8.11 3.99 6 6.8 6 10.5c0 4.14 3.36 7.5 7.5 7.5s7.5-3.36 7.5-7.5c0-4.42-3.58-8-8-8zm0 13c-1.66 0-3-1.34-3-3 0-1.3.84-2.4 2-2.82V12h2v-2.82c1.16.42 2 1.52 2 2.82 0 1.66-1.34 3-3 3z"/></svg>`;
  } else if (iconType === 'ngo') {
    iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="${color}"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
  } else {
    // shelter / legal
    iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="${color}"><path d="M12 2L1 9l1.5 1.15L4 9.17V20h16V9.17l1.5.98L23 9 12 2zm6 16H6v-7.85l6-3.92 6 3.92V18z"/></svg>`;
  }

  const pinHtml = `
    <div style="position: relative; width: 34px; height: 44px; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.35)); transition: transform 0.2s;">
      ${
        isDispatched
          ? `<div style="position: absolute; top: 0; left: 0; width: 34px; height: 34px; border-radius: 50%; background: ${color}; opacity: 0.5; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
          : ''
      }
      <svg width="34" height="44" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.05887 0 0 8.05887 0 18C0 29.5 18 48 18 48C18 48 36 29.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="${color}" stroke="#ffffff" stroke-width="2.2"/>
        <circle cx="18" cy="18" r="11" fill="${isCaller ? color : '#ffffff'}" />
      </svg>
      <div style="position: absolute; top: 9px; left: 10px; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center;">
        ${iconSvg}
      </div>
      ${
        label
          ? `<div style="position: absolute; top: 44px; white-space: nowrap; background: rgba(15, 23, 42, 0.92); color: #ffffff; font-size: 9px; font-weight: 700; font-family: monospace; padding: 1.5px 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 2px 4px rgba(0,0,0,0.3); pointer-events: none;">${label}</div>`
          : ''
      }
    </div>
  `;

  return L.divIcon({
    className: 'custom-teardrop-marker',
    html: pinHtml,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -44],
  });
}

export const LiveLocationMapCanvas: React.FC<LiveLocationMapCanvasProps> = ({
  locationName,
  decisions,
  onToggleDispatch,
  onOpenFullScreenMap,
  className = '',
  height = 420,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const polylinesRef = useRef<Record<string, L.Polyline>>({});
  const callerMarkerRef = useRef<L.Marker | null>(null);

  const [fleet, setFleet] = useState<FleetVehicle[]>(INITIAL_FLEET);
  const [selectedService, setSelectedService] = useState<DispatchServiceType>('police');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [radioFeedback, setRadioFeedback] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite' | 'dark'>('streets');

  // Resolved GPS anchor for caller
  const callerCoords = resolveCoordinates(locationName);

  // Check if a service is dispatched
  const isServiceDispatched = (type: DispatchServiceType) => {
    return !!decisions.find((d) => d.service === type)?.dispatched;
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [callerCoords.lat, callerCoords.lng],
        zoom: 12,
        zoomControl: true,
      });

      // Add scale control at bottom-left (like user screenshot "5 km")
      L.control.scale({ imperial: false, position: 'bottomleft', maxWidth: 120 }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Apply selected Tile Layer
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}.png';
    let attribution = '&copy; OpenStreetMap contributors';

    if (mapLayer === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri';
    } else if (mapLayer === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; CARTO';
    }

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution,
    }).addTo(map);

    // Reposition / Pan to caller coords smoothly
    map.setView([callerCoords.lat, callerCoords.lng], map.getZoom() || 12, { animate: true });

    // Invalidate size to ensure proper tile rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      // Cleanup on unmount handled gracefully
    };
  }, [mapLayer, callerCoords.lat, callerCoords.lng]);

  // 2. Render & Update Caller Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const callerIcon = createTeardropPin(
      '#ef4444',
      'caller',
      `CALLER: ${locationName ? locationName.split(',')[0] : 'Munirka'}`,
      true
    );

    if (callerMarkerRef.current) {
      callerMarkerRef.current.setLatLng([callerCoords.lat, callerCoords.lng]);
      callerMarkerRef.current.setIcon(callerIcon);
    } else {
      const marker = L.marker([callerCoords.lat, callerCoords.lng], { icon: callerIcon, zIndexOffset: 1000 }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 2px;">
          <strong style="color: #ef4444;">🚨 Incident Live Location Anchor</strong><br/>
          <span>${locationName || 'Munirka Metro Station, New Delhi'}</span><br/>
          <span style="font-family: monospace; font-size: 11px; color: #64748b;">${callerCoords.lat.toFixed(4)}° N, ${callerCoords.lng.toFixed(4)}° E</span>
        </div>
      `);
      callerMarkerRef.current = marker;
    }
  }, [callerCoords.lat, callerCoords.lng, locationName]);

  // 3. Render / Update Vehicle Markers and Dashed Trajectory Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    fleet.forEach((unit) => {
      const dispatched = isServiceDispatched(unit.serviceType);
      const icon = createTeardropPin(unit.color, unit.serviceType, unit.unitCode, dispatched);

      // Marker
      if (markersRef.current[unit.id]) {
        markersRef.current[unit.id].setLatLng([unit.currentLat, unit.currentLng]);
        markersRef.current[unit.id].setIcon(icon);
      } else {
        const marker = L.marker([unit.currentLat, unit.currentLng], { icon }).addTo(map);

        marker.on('click', () => {
          setSelectedService(unit.serviceType);
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 170px;">
            <div style="font-weight: bold; font-size: 13px; color: ${unit.color};">${unit.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">${unit.stationName}</div>
            <div style="font-size: 11px;">Status: <strong>${dispatched ? 'En Route to Caller' : 'Station Standby'}</strong></div>
            <div style="font-size: 11px;">Distance: <strong>${unit.distanceKm} km</strong> • ETA: ~${Math.ceil(unit.etaSeconds / 60)}m</div>
            <div style="font-size: 11px; font-family: monospace; color: #0f766e; margin-top: 2px;">${unit.radioFrequency}</div>
          </div>
        `);

        markersRef.current[unit.id] = marker;
      }

      // Dashed Trajectory Polyline (like red dashed line in user screenshot)
      if (dispatched) {
        const polyCoords: [number, number][] = [
          [unit.currentLat, unit.currentLng],
          [callerCoords.lat, callerCoords.lng],
        ];

        if (polylinesRef.current[unit.id]) {
          polylinesRef.current[unit.id].setLatLngs(polyCoords);
        } else {
          const polyline = L.polyline(polyCoords, {
            color: '#ef4444',
            weight: 3.5,
            dashArray: '6, 6',
            opacity: 0.85,
          }).addTo(map);

          polylinesRef.current[unit.id] = polyline;
        }
      } else {
        // Remove polyline if vehicle is recalled/available
        if (polylinesRef.current[unit.id]) {
          map.removeLayer(polylinesRef.current[unit.id]);
          delete polylinesRef.current[unit.id];
        }
      }
    });
  }, [fleet, callerCoords.lat, callerCoords.lng, decisions]);

  // 4. Real-time GPS movement simulation loop towards caller coordinates
  useEffect(() => {
    const timer = setInterval(() => {
      setFleet((prevFleet) =>
        prevFleet.map((u) => {
          const dispatched = isServiceDispatched(u.serviceType);

          if (!dispatched) {
            // Not dispatched: stay at base or return to base
            const dLat = u.baseLat - u.currentLat;
            const dLng = u.baseLng - u.currentLng;
            if (Math.hypot(dLat, dLng) < 0.001) {
              const dist = getHaversineKm(u.baseLat, u.baseLng, callerCoords.lat, callerCoords.lng);
              return {
                ...u,
                currentLat: u.baseLat,
                currentLng: u.baseLng,
                speedKmH: 0,
                distanceKm: dist,
                etaSeconds: Math.round((dist / 35) * 3600),
              };
            }
            return {
              ...u,
              currentLat: u.currentLat + dLat * 0.1,
              currentLng: u.currentLng + dLng * 0.1,
              speedKmH: 22,
            };
          }

          // Dispatched: travel towards callerCoords
          const dLat = callerCoords.lat - u.currentLat;
          const dLng = callerCoords.lng - u.currentLng;
          const distKm = getHaversineKm(u.currentLat, u.currentLng, callerCoords.lat, callerCoords.lng);

          if (distKm < 0.08) {
            // Arrived at distress scene
            return {
              ...u,
              distanceKm: 0.05,
              etaSeconds: 0,
              speedKmH: 0,
            };
          }

          // Advance vehicle along geographic vector
          const stepRate = 0.015 * simSpeed;
          const nextLat = u.currentLat + dLat * stepRate;
          const nextLng = u.currentLng + dLng * stepRate;
          const nextDistKm = getHaversineKm(nextLat, nextLng, callerCoords.lat, callerCoords.lng);
          const nextEta = Math.max(15, u.etaSeconds - Math.round(1.5 * simSpeed));
          const currentSpeed = 44 + Math.floor(Math.random() * 8);

          return {
            ...u,
            currentLat: nextLat,
            currentLng: nextLng,
            distanceKm: nextDistKm,
            etaSeconds: nextEta,
            speedKmH: currentSpeed,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [decisions, callerCoords.lat, callerCoords.lng, simSpeed]);

  const handleVhfChime = (u: FleetVehicle) => {
    ringtoneService.playDispatchSound();
    setRadioFeedback(`VHF Transmit: Audio ping broadcast to ${u.unitCode} (${u.radioFrequency})`);
    setTimeout(() => setRadioFeedback(null), 4000);
  };

  const selectedUnit = fleet.find((u) => u.serviceType === selectedService) || fleet[0];
  const isSelectedDispatched = isServiceDispatched(selectedService);
  const dispatchedCount = fleet.filter((u) => isServiceDispatched(u.serviceType)).length;

  return (
    <div
      className={`rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden shadow-lg transition-all ${className}`}
    >
      {/* 1. Header Bar: Geotagged Live Location Anchor */}
      <div className="px-4 py-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <span className="w-3 h-3 rounded-full bg-emerald-500 block animate-pulse"></span>
            <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-ping"></span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-teal-700 dark:text-teal-400 font-bold">
                LIVE LOCATION • GOOGLE MAPS / OSM
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                {callerCoords.lat.toFixed(4)}° N, {callerCoords.lng.toFixed(4)}° E
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white truncate">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{locationName || 'Munirka Metro Station, New Delhi'}</span>
            </div>
          </div>
        </div>

        {/* Controls: Dispatched count, Layer Switcher, Expand/Collapse */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400">En Route:</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">{dispatchedCount} Units</span>
          </div>

          {/* Map Layer Selector */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setMapLayer('streets')}
              className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                mapLayer === 'streets'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600'
              }`}
              title="Standard Road Map"
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('satellite')}
              className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                mapLayer === 'satellite'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600'
              }`}
              title="Satellite Imagery"
            >
              Satellite
            </button>
          </div>

          {onOpenFullScreenMap && (
            <button
              type="button"
              onClick={onOpenFullScreenMap}
              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Open full tactical map console"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Fleet Console</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse map' : 'Expand map'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Radio Broadcast Feedback Notification */}
      {radioFeedback && (
        <div className="px-4 py-1.5 bg-teal-50 dark:bg-teal-950 border-b border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-[11px] flex items-center gap-2 font-mono animate-fadeIn">
          <Radio className="w-3.5 h-3.5 animate-pulse text-teal-600 dark:text-teal-400" />
          <span className="truncate">{radioFeedback}</span>
        </div>
      )}

      {/* 2. Interactive Map Container (Leaflet OpenStreetMap Format) */}
      {isExpanded && (
        <div className="space-y-0">
          {/* Quick Filter Bar */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Emergency Pins:</span>
              <span className="inline-flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span> Police
              </span>
              <span className="inline-flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Ambulance
              </span>
              <span className="inline-flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Fire
              </span>
              <span className="inline-flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Sakhi
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setSimSpeed(simSpeed === 1 ? 2 : simSpeed === 2 ? 5 : 1)}
                className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-teal-600 transition-colors cursor-pointer"
                title="Simulation advancement speed"
              >
                Speed: {simSpeed}x
              </button>
            </div>
          </div>

          {/* Leaflet Map Surface */}
          <div
            ref={mapContainerRef}
            style={{ height: typeof height === 'number' ? `${height}px` : height }}
            className="w-full relative z-0 bg-slate-100 dark:bg-slate-900"
          />

          {/* 3. Bottom Interactive Telemetry & Action Bar */}
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Selected Vehicle Telemetry */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="p-2 rounded-xl text-white shrink-0 shadow-xs"
                style={{ backgroundColor: selectedUnit.color }}
              >
                {selectedUnit.serviceType === 'police' && <ShieldAlert className="w-4 h-4" />}
                {selectedUnit.serviceType === 'ambulance' && <Ambulance className="w-4 h-4" />}
                {selectedUnit.serviceType === 'medical' && <Activity className="w-4 h-4" />}
                {selectedUnit.serviceType === 'fire' && <Flame className="w-4 h-4" />}
                {selectedUnit.serviceType === 'ngo' && <HeartHandshake className="w-4 h-4" />}
                {selectedUnit.serviceType === 'shelter' && <Home className="w-4 h-4" />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {selectedUnit.name}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                      isSelectedDispatched
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isSelectedDispatched ? 'En Route (Live)' : 'Station Standby'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate">
                  <span>{selectedUnit.stationName}</span>
                  <span>•</span>
                  <span className="text-teal-700 dark:text-teal-400 font-semibold">
                    {selectedUnit.distanceKm} km
                  </span>
                  <span>•</span>
                  <span>ETA ~{Math.ceil(selectedUnit.etaSeconds / 60)}m</span>
                  {isSelectedDispatched && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {selectedUnit.speedKmH} km/h
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => handleVhfChime(selectedUnit)}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 text-[11px] font-mono font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                title={`Transmit VHF radio ping to ${selectedUnit.unitCode}`}
              >
                <Radio className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>VHF Intercom</span>
              </button>

              {onToggleDispatch && (
                <button
                  type="button"
                  onClick={() => onToggleDispatch(selectedUnit.serviceType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
                    isSelectedDispatched
                      ? 'bg-red-50 dark:bg-red-950/70 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-900/30'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSelectedDispatched ? 'Recall Unit' : 'Dispatch Unit'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
