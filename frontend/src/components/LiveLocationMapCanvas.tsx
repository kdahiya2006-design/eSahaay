import React, { useState, useEffect } from 'react';
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
}

interface MapUnitState {
  serviceType: DispatchServiceType;
  unitCode: string;
  name: string;
  vehicleType: string;
  stationName: string;
  officers: string;
  contactNumber: string;
  radioFrequency: string;
  baseX: number;
  baseY: number;
  currentX: number;
  currentY: number;
  speedKmH: number;
  distanceKm: number;
  etaSeconds: number;
  baseDistanceKm: number;
}

const INITIAL_UNITS: MapUnitState[] = [
  {
    serviceType: 'police',
    unitCode: 'PCR-DL-1C-4921',
    name: 'Eagle-04 PCR Patrol',
    vehicleType: 'Innova Emergency Patrol',
    stationName: 'Vasant Vihar Police Post',
    officers: 'SI Rajesh Kumar • Ct. S. Meena',
    contactNumber: '+91 98711 00112',
    radioFrequency: 'VHF Ch. 4 (156.800 MHz)',
    baseX: 82,
    baseY: 22,
    currentX: 82,
    currentY: 22,
    speedKmH: 0,
    distanceKm: 0.8,
    etaSeconds: 165,
    baseDistanceKm: 0.8,
  },
  {
    serviceType: 'ambulance',
    unitCode: 'AMB-108-DL-31',
    name: 'CATS ALS Life Support',
    vehicleType: 'Force Traveller ALS (Paramedic)',
    stationName: 'CATS Central Hub (Munirka)',
    officers: 'Dr. A. Verma • EMT Manoj Rawat',
    contactNumber: '+91 98114 10831',
    radioFrequency: 'VHF Ch. 7 (158.250 MHz)',
    baseX: 20,
    baseY: 76,
    currentX: 20,
    currentY: 76,
    speedKmH: 0,
    distanceKm: 1.1,
    etaSeconds: 210,
    baseDistanceKm: 1.1,
  },
  {
    serviceType: 'medical',
    unitCode: 'HOSP-TRAUMA-01',
    name: 'Apex Emergency Casualty Ward',
    vehicleType: 'Level-1 Emergency Trauma Ward',
    stationName: 'Apex Medical Casualty (South Delhi)',
    officers: 'Dr. P. Swaminathan (CMO)',
    contactNumber: '011-26165060 (Ext 102)',
    radioFrequency: 'Hospital Hotline 102',
    baseX: 25,
    baseY: 18,
    currentX: 25,
    currentY: 18,
    speedKmH: 0,
    distanceKm: 1.9,
    etaSeconds: 360,
    baseDistanceKm: 1.9,
  },
  {
    serviceType: 'fire',
    unitCode: 'DFS-WT-04',
    name: 'Delhi Fire Tender #04',
    vehicleType: 'Heavy Water Tender & Foam Monitor',
    stationName: 'Bhikaji Cama Fire Post',
    officers: 'Lead Officer R. Dahiya',
    contactNumber: '011-23412222',
    radioFrequency: 'DFS VHF Band-2',
    baseX: 86,
    baseY: 38,
    currentX: 86,
    currentY: 38,
    speedKmH: 0,
    distanceKm: 1.7,
    etaSeconds: 380,
    baseDistanceKm: 1.7,
  },
  {
    serviceType: 'ngo',
    unitCode: 'NGO-SAKHI-01',
    name: 'Sakhi Crisis Cell Van',
    vehicleType: 'Women Crisis Support Escort',
    stationName: 'Sakhi One-Stop Crisis Post',
    officers: 'Counselor Priya Sen • Off. Sunita',
    contactNumber: 'Helpline: 181 / +91 98110 54321',
    radioFrequency: 'WCD Direct Network',
    baseX: 72,
    baseY: 80,
    currentX: 72,
    currentY: 80,
    speedKmH: 0,
    distanceKm: 2.2,
    etaSeconds: 430,
    baseDistanceKm: 2.2,
  },
  {
    serviceType: 'shelter',
    unitCode: 'SHELTER-SWD-03',
    name: 'Swadhar Sanctuary Safe Shelter',
    vehicleType: 'Verified Protected Sanctuary Facility',
    stationName: 'Vasant Kunj Sanctuary Center',
    officers: 'Warden Kavita Rao • Care Staff',
    contactNumber: '011-26891100',
    radioFrequency: 'Dedicated Secure Dispatch',
    baseX: 18,
    baseY: 42,
    currentX: 18,
    currentY: 42,
    speedKmH: 0,
    distanceKm: 2.5,
    etaSeconds: 520,
    baseDistanceKm: 2.5,
  },
];

const SERVICE_COLORS: Record<DispatchServiceType, { bg: string; stroke: string; ping: string; text: string }> = {
  police: {
    bg: 'bg-indigo-600',
    stroke: '#6366f1',
    ping: 'bg-indigo-400',
    text: 'text-indigo-400',
  },
  ambulance: {
    bg: 'bg-emerald-600',
    stroke: '#10b981',
    ping: 'bg-emerald-400',
    text: 'text-emerald-400',
  },
  medical: {
    bg: 'bg-sky-600',
    stroke: '#0284c7',
    ping: 'bg-sky-400',
    text: 'text-sky-400',
  },
  fire: {
    bg: 'bg-rose-600',
    stroke: '#f43f5e',
    ping: 'bg-rose-400',
    text: 'text-rose-400',
  },
  ngo: {
    bg: 'bg-teal-600',
    stroke: '#14b8a6',
    ping: 'bg-teal-400',
    text: 'text-teal-400',
  },
  shelter: {
    bg: 'bg-amber-600',
    stroke: '#f59e0b',
    ping: 'bg-amber-400',
    text: 'text-amber-400',
  },
};

const CALLER_MAP_CENTER = { x: 50, y: 48 };

export const LiveLocationMapCanvas: React.FC<LiveLocationMapCanvasProps> = ({
  locationName,
  decisions,
  onToggleDispatch,
  onOpenFullScreenMap,
  className = '',
}) => {
  const [units, setUnits] = useState<MapUnitState[]>(INITIAL_UNITS);
  const [selectedService, setSelectedService] = useState<DispatchServiceType>('police');
  const [filterType, setFilterType] = useState<'all' | DispatchServiceType>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [radioFeedback, setRadioFeedback] = useState<string | null>(null);

  // Sync dispatched status from decisions prop
  const isServiceDispatched = (type: DispatchServiceType) => {
    return !!decisions.find((d) => d.service === type)?.dispatched;
  };

  // Active simulation loop: move dispatched vehicles towards center (50, 48)
  useEffect(() => {
    const interval = setInterval(() => {
      setUnits((prevUnits) =>
        prevUnits.map((u) => {
          const dispatched = isServiceDispatched(u.serviceType);

          if (!dispatched) {
            // Not dispatched: slowly return to base or stay parked at base
            const dx = u.baseX - u.currentX;
            const dy = u.baseY - u.currentY;
            const distToBase = Math.hypot(dx, dy);

            if (distToBase < 0.5) {
              return {
                ...u,
                currentX: u.baseX,
                currentY: u.baseY,
                speedKmH: 0,
                distanceKm: u.baseDistanceKm,
                etaSeconds: Math.round((u.baseDistanceKm / 40) * 3600),
              };
            }

            return {
              ...u,
              currentX: u.currentX + dx * 0.1,
              currentY: u.currentY + dy * 0.1,
              speedKmH: 25,
            };
          }

          // Dispatched: travel towards (50, 48)
          const dx = CALLER_MAP_CENTER.x - u.currentX;
          const dy = CALLER_MAP_CENTER.y - u.currentY;
          const distanceToCaller = Math.hypot(dx, dy);

          if (distanceToCaller < 1.5) {
            // Arrived on scene
            return {
              ...u,
              currentX: CALLER_MAP_CENTER.x + (Math.random() - 0.5) * 1.5,
              currentY: CALLER_MAP_CENTER.y + (Math.random() - 0.5) * 1.5,
              speedKmH: 0,
              distanceKm: 0.05,
              etaSeconds: 0,
            };
          }

          // Step along the trajectory vector
          const stepRate = 0.018 * simSpeed;
          const nextX = u.currentX + dx * stepRate;
          const nextY = u.currentY + dy * stepRate;

          // Convert remaining visual distance to kilometers
          const nextDistKm = Math.max(0.08, +(u.distanceKm - 0.015 * simSpeed).toFixed(2));
          const nextEta = Math.max(10, u.etaSeconds - Math.round(1 * simSpeed));
          const currentSpeed = 42 + Math.floor(Math.random() * 8);

          return {
            ...u,
            currentX: nextX,
            currentY: nextY,
            distanceKm: nextDistKm,
            etaSeconds: nextEta,
            speedKmH: currentSpeed,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [decisions, simSpeed]);

  const handleVhfChime = (u: MapUnitState) => {
    ringtoneService.playDispatchSound();
    setRadioFeedback(`VHF Channel Active: Radio ping dispatched to ${u.unitCode} (${u.radioFrequency})`);
    setTimeout(() => setRadioFeedback(null), 4000);
  };

  const selectedUnit = units.find((u) => u.serviceType === selectedService) || units[0];
  const isSelectedDispatched = isServiceDispatched(selectedService);

  const filteredUnits = units.filter((u) => {
    if (filterType === 'all') return true;
    return u.serviceType === filterType;
  });

  const dispatchedCount = units.filter((u) => isServiceDispatched(u.serviceType)).length;

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-lg transition-all ${className}`}
    >
      {/* 1. Integrated Header & Geotagged Live Location Anchor */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <span className="w-3 h-3 rounded-full bg-emerald-500 block animate-pulse"></span>
            <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-ping"></span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 font-bold">
                LIVE LOCATION RADAR
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                28.5583° N, 77.1728° E
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{locationName || 'Munirka Metro Station, New Delhi'}</span>
            </div>
          </div>
        </div>

        {/* Status Pills and Expand/FullScreen controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-mono">
            <span className="text-slate-400">Dispatched:</span>
            <span className="font-bold text-teal-400">{dispatchedCount}/6 Units</span>
          </div>

          {onOpenFullScreenMap && (
            <button
              type="button"
              onClick={onOpenFullScreenMap}
              className="px-2.5 py-1 rounded-lg bg-teal-600/80 hover:bg-teal-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Open full tactical map page"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Fleet Console</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse map' : 'Expand map'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Radio feedback toast */}
      {radioFeedback && (
        <div className="px-4 py-1.5 bg-teal-950 border-b border-teal-800/80 text-teal-300 text-[11px] flex items-center gap-2 font-mono animate-fadeIn">
          <Radio className="w-3.5 h-3.5 animate-pulse text-teal-400" />
          <span className="truncate">{radioFeedback}</span>
        </div>
      )}

      {/* 3. Interactive Map Canvas (Collapsible) */}
      {isExpanded && (
        <div className="space-y-0">
          {/* Filter & Telemetry Quick Bar */}
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Layer:</span>
              {(['all', 'police', 'ambulance', 'fire'] as const).map((svc) => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => setFilterType(svc)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    filterType === svc
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {svc}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Range: 2.5 km</span>
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={() => setSimSpeed(simSpeed === 1 ? 2 : simSpeed === 2 ? 5 : 1)}
                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-teal-300 transition-colors"
                title="Change live GPS advance speed"
              >
                Speed: {simSpeed}x
              </button>
            </div>
          </div>

          {/* Map Surface */}
          <div className="relative w-full h-[300px] sm:h-[350px] bg-slate-950 overflow-hidden select-none">
            {/* SVG Background Grid, Range Rings, Roads, and Active Trajectories */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern id="live-map-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.3" />
                </pattern>
                <filter id="live-map-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Background */}
              <rect width="100" height="100" fill="url(#live-map-grid)" />

              {/* Radial Distance Rings from Caller */}
              <circle cx="50" cy="48" r="14" fill="none" stroke="#0ea5e9" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.4" />
              <circle cx="50" cy="48" r="28" fill="none" stroke="#0ea5e9" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.3" />
              <circle cx="50" cy="48" r="42" fill="none" stroke="#0ea5e9" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.2" />

              {/* Road Network Lines (Outer Ring Road, Africa Avenue, Nelson Mandela Marg) */}
              <g stroke="#334155" strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
                <line x1="5" y1="40" x2="95" y2="55" />
                <line x1="78" y1="5" x2="70" y2="95" />
                <line x1="40" y1="5" x2="65" y2="95" />
                <line x1="10" y1="20" x2="85" y2="25" />
                <line x1="25" y1="75" x2="75" y2="75" />
              </g>

              {/* Arterial Highlights */}
              <g stroke="#0f766e" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.5">
                <line x1="5" y1="40" x2="95" y2="55" />
                <line x1="78" y1="5" x2="70" y2="95" />
              </g>

              {/* Live Animated Routes for Dispatched Vehicles */}
              {units.map((unit) => {
                const dispatched = isServiceDispatched(unit.serviceType);
                if (!dispatched) return null;
                const colors = SERVICE_COLORS[unit.serviceType];

                return (
                  <g key={`live-route-${unit.serviceType}`}>
                    {/* Base to current position line */}
                    <line
                      x1={unit.baseX}
                      y1={unit.baseY}
                      x2={unit.currentX}
                      y2={unit.currentY}
                      stroke={colors.stroke}
                      strokeWidth="0.6"
                      opacity="0.3"
                    />
                    {/* Forward trajectory with animated dashes */}
                    <line
                      x1={unit.currentX}
                      y1={unit.currentY}
                      x2={CALLER_MAP_CENTER.x}
                      y2={CALLER_MAP_CENTER.y}
                      stroke={colors.stroke}
                      strokeWidth="0.9"
                      strokeDasharray="2,1.5"
                      className="animate-[dash_1s_linear_infinite]"
                      filter="url(#live-map-glow)"
                      opacity="0.85"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Road / Location Labels */}
            <div className="absolute top-[8%] left-[76%] text-[9px] font-mono text-slate-500 pointer-events-none select-none">
              Bhikaji Cama / Fire Post
            </div>
            <div className="absolute top-[34%] left-[6%] text-[9px] font-mono text-slate-500 pointer-events-none select-none">
              Outer Ring Road (West)
            </div>
            <div className="absolute top-[82%] left-[45%] text-[9px] font-mono text-slate-500 pointer-events-none select-none">
              Vasant Kunj / South Delhi
            </div>

            {/* CALLER LOCATION PIN (Central Beacon) */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group"
              style={{ left: `${CALLER_MAP_CENTER.x}%`, top: `${CALLER_MAP_CENTER.y}%` }}
              title={`Caller Location: ${locationName || 'Munirka Metro Station'}`}
            >
              <div className="absolute -inset-3 rounded-full bg-red-500/25 animate-ping"></div>
              <div className="absolute -inset-6 rounded-full border border-red-500/40 animate-pulse"></div>
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-950 border-2 border-white">
                <MapPin className="w-4 h-4 fill-white" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-9 whitespace-nowrap px-2 py-0.5 rounded bg-slate-900/95 text-white font-mono text-[9px] font-bold border border-red-500/60 shadow-md">
                CALLER: {locationName ? locationName.split(',')[0] : 'Munirka Metro'}
              </div>
            </div>

            {/* FIXED STATION ANCHORS */}
            {units.map((unit) => (
              <div
                key={`stn-${unit.serviceType}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                style={{ left: `${unit.baseX}%`, top: `${unit.baseY}%` }}
              >
                <div className="w-2 h-2 rounded-full bg-slate-500 border border-slate-300"></div>
              </div>
            ))}

            {/* LIVE VEHICLE MARKERS */}
            {filteredUnits.map((unit) => {
              const isSelected = unit.serviceType === selectedService;
              const dispatched = isServiceDispatched(unit.serviceType);
              const colors = SERVICE_COLORS[unit.serviceType];

              return (
                <div
                  key={`vehicle-${unit.serviceType}`}
                  onClick={() => setSelectedService(unit.serviceType)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-700 z-20 group ${
                    isSelected ? 'scale-125 z-40' : 'hover:scale-110'
                  }`}
                  style={{ left: `${unit.currentX}%`, top: `${unit.currentY}%` }}
                  title={`${unit.name} - ${dispatched ? 'En Route' : 'Station Standby'}`}
                >
                  {/* Siren Ping when en route */}
                  {dispatched && (
                    <div
                      className={`absolute -inset-3 rounded-full opacity-70 animate-ping ${colors.ping}`}
                    ></div>
                  )}

                  {/* Marker Icon Box */}
                  <div
                    className={`relative p-1.5 rounded-xl text-white shadow-xl border-2 flex items-center justify-center ${colors.bg} ${
                      isSelected ? 'border-white ring-4 ring-teal-400/50' : 'border-slate-900'
                    }`}
                  >
                    {unit.serviceType === 'police' && <ShieldAlert className="w-3.5 h-3.5" />}
                    {unit.serviceType === 'ambulance' && <Ambulance className="w-3.5 h-3.5" />}
                    {unit.serviceType === 'medical' && <Activity className="w-3.5 h-3.5" />}
                    {unit.serviceType === 'fire' && <Flame className="w-3.5 h-3.5" />}
                    {unit.serviceType === 'ngo' && <HeartHandshake className="w-3.5 h-3.5" />}
                    {unit.serviceType === 'shelter' && <Home className="w-3.5 h-3.5" />}
                  </div>

                  {/* Live Mini Tag Badge */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 -top-5 whitespace-nowrap px-1 py-0.2 rounded text-[8px] font-mono font-bold border shadow-xs transition-opacity ${
                      isSelected
                        ? 'opacity-100 bg-slate-900 text-white border-white'
                        : 'opacity-75 bg-slate-900/90 text-slate-300 border-slate-700'
                    }`}
                  >
                    {unit.unitCode.split('-')[0]}-{unit.unitCode.split('-')[1] || ''}{' '}
                    {dispatched ? `(~${Math.ceil(unit.etaSeconds / 60)}m)` : ''}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. Bottom Interactive Telemetry & Fast Action Pill Bar */}
          <div className="px-4 py-2.5 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Selected unit quick telemetry */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`p-1.5 rounded-lg text-white shrink-0 ${
                  SERVICE_COLORS[selectedUnit.serviceType].bg
                }`}
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
                  <span className="font-bold text-white truncate">{selectedUnit.name}</span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                      isSelectedDispatched
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isSelectedDispatched ? 'En Route' : 'Station Base'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 truncate">
                  <span>{selectedUnit.stationName}</span>
                  <span>•</span>
                  <span className="text-teal-400 font-semibold">{selectedUnit.distanceKm} km</span>
                  <span>•</span>
                  <span>ETA ~{Math.ceil(selectedUnit.etaSeconds / 60)}m</span>
                  {isSelectedDispatched && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 font-semibold">{selectedUnit.speedKmH} km/h</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Unit action buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => handleVhfChime(selectedUnit)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-mono font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer active:scale-95"
                title={`Transmit VHF chime to ${selectedUnit.unitCode}`}
              >
                <Radio className="w-3.5 h-3.5 text-teal-400" />
                <span>VHF Intercom</span>
              </button>

              {onToggleDispatch && (
                <button
                  type="button"
                  onClick={() => onToggleDispatch(selectedUnit.serviceType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
                    isSelectedDispatched
                      ? 'bg-slate-800 hover:bg-red-950 text-red-400 border border-red-800'
                      : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-900/50'
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
