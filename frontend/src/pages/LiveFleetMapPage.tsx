import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  ShieldAlert,
  Ambulance,
  Activity,
  Flame,
  HeartHandshake,
  Home,
  Radio,
  Send,
  RotateCcw,
  Clock,
  Compass,
  Play,
  Pause,
  ArrowRight
} from 'lucide-react';
import type { DispatchServiceType } from '../types';
import { ringtoneService } from '../services/ringtoneService';

interface LiveFleetMapPageProps {
  onNavigateToNew?: () => void;
  selectedCaseLocation?: string;
}

interface MapVehicleUnit {
  id: string;
  serviceType: DispatchServiceType;
  unitCode: string;
  name: string;
  vehicleType: string;
  stationName: string;
  officers: string;
  contactNumber: string;
  radioFrequency: string;
  status: 'dispatched' | 'available' | 'on_scene';
  // Map coordinates in percentage relative to container [0 - 100]
  baseX: number;
  baseY: number;
  currentX: number;
  currentY: number;
  speedKmH: number;
  distanceKm: number;
  etaSeconds: number;
  headingDeg: number;
}

const CALLER_LOCATION = {
  name: 'Munirka Metro Station (Gate 2)',
  area: 'South Delhi, New Delhi',
  coordinates: '28.5583° N, 77.1728° E',
  // Center of our SVG map
  x: 50,
  y: 48,
};

const INITIAL_UNITS: MapVehicleUnit[] = [
  {
    id: 'unit-pcr-1',
    serviceType: 'police',
    unitCode: 'PCR-DL-1C-4921',
    name: 'Eagle-04 PCR Patrol',
    vehicleType: 'Innova Emergency Patrol',
    stationName: 'Bhikaji Cama / Vasant Vihar Police Post',
    officers: 'SI Rajesh Kumar • Ct. S. Meena',
    contactNumber: '+91 98711 00112',
    radioFrequency: 'VHF Ch. 4 (156.800 MHz)',
    status: 'dispatched',
    baseX: 82,
    baseY: 22,
    currentX: 68,
    currentY: 33,
    speedKmH: 44,
    distanceKm: 0.8,
    etaSeconds: 165,
    headingDeg: 235,
  },
  {
    id: 'unit-amb-1',
    serviceType: 'ambulance',
    unitCode: 'AMB-108-DL-31',
    name: 'CATS ALS Life Support',
    vehicleType: 'Force Traveller ALS (Paramedic)',
    stationName: 'CATS Central Emergency Standby (Munirka)',
    officers: 'Dr. A. Verma • EMT Manoj Rawat',
    contactNumber: '+91 98114 10831',
    radioFrequency: 'VHF Ch. 7 (158.250 MHz)',
    status: 'dispatched',
    baseX: 20,
    baseY: 76,
    currentX: 34,
    currentY: 62,
    speedKmH: 48,
    distanceKm: 1.1,
    etaSeconds: 210,
    headingDeg: 45,
  },
  {
    id: 'unit-med-1',
    serviceType: 'medical',
    unitCode: 'HOSP-TRAUMA-01',
    name: 'Apex Emergency Casualty Ward',
    vehicleType: 'Level-1 Emergency Trauma Ward',
    stationName: 'Apex Medical Casualty (Munirka / South Delhi)',
    officers: 'Dr. P. Swaminathan (Casualty CMO)',
    contactNumber: '011-26165060 (Ext 102)',
    radioFrequency: 'Hospital Hotline 102',
    status: 'available',
    baseX: 25,
    baseY: 18,
    currentX: 25,
    currentY: 18,
    speedKmH: 0,
    distanceKm: 1.9,
    etaSeconds: 360,
    headingDeg: 120,
  },
  {
    id: 'unit-fire-1',
    serviceType: 'fire',
    unitCode: 'DFS-WT-04',
    name: 'Delhi Fire Tender #04',
    vehicleType: 'Heavy Water Tender & Foam Monitor',
    stationName: 'Bhikaji Cama Fire Post',
    officers: 'Lead Fire Officer R. Dahiya',
    contactNumber: '011-23412222',
    radioFrequency: 'DFS VHF Band-2',
    status: 'available',
    baseX: 86,
    baseY: 38,
    currentX: 86,
    currentY: 38,
    speedKmH: 0,
    distanceKm: 1.7,
    etaSeconds: 380,
    headingDeg: 260,
  },
  {
    id: 'unit-ngo-1',
    serviceType: 'ngo',
    unitCode: 'NGO-SAKHI-01',
    name: 'Sakhi Crisis Cell Van',
    vehicleType: 'Women Crisis Support Escort',
    stationName: 'Ministry of WCD Sakhi Centre',
    officers: 'Counselor Priya Sen • Officer Sunita',
    contactNumber: 'Helpline: 181 / +91 98110 54321',
    radioFrequency: 'WCD Direct Network',
    status: 'dispatched',
    baseX: 74,
    baseY: 82,
    currentX: 61,
    currentY: 66,
    speedKmH: 36,
    distanceKm: 1.3,
    etaSeconds: 270,
    headingDeg: 310,
  },
  {
    id: 'unit-shelter-1',
    serviceType: 'shelter',
    unitCode: 'SHELTER-SWD-03',
    name: 'Swadhar Sanctuary Post',
    vehicleType: 'Safe Refuge Transit Van',
    stationName: 'Swadhar Sanctuary (Munirka / South Delhi)',
    officers: 'Superintendent Anjali Rao',
    contactNumber: 'Care Desk: 011-26881144',
    radioFrequency: 'Shelter Dispatch Hub',
    status: 'available',
    baseX: 18,
    baseY: 42,
    currentX: 18,
    currentY: 42,
    speedKmH: 0,
    distanceKm: 1.6,
    etaSeconds: 340,
    headingDeg: 90,
  },
];

const SERVICE_COLORS: Record<DispatchServiceType, { bg: string; text: string; stroke: string; ping: string }> = {
  police: { bg: 'bg-rose-600', text: 'text-rose-400', stroke: '#ef4444', ping: 'bg-rose-500' },
  ambulance: { bg: 'bg-emerald-600', text: 'text-emerald-400', stroke: '#10b981', ping: 'bg-emerald-500' },
  medical: { bg: 'bg-sky-600', text: 'text-sky-400', stroke: '#0284c7', ping: 'bg-sky-500' },
  fire: { bg: 'bg-amber-600', text: 'text-amber-400', stroke: '#f59e0b', ping: 'bg-amber-500' },
  ngo: { bg: 'bg-purple-600', text: 'text-purple-400', stroke: '#a855f7', ping: 'bg-purple-500' },
  shelter: { bg: 'bg-teal-600', text: 'text-teal-400', stroke: '#14b8a6', ping: 'bg-teal-500' },
};

export const LiveFleetMapPage: React.FC<LiveFleetMapPageProps> = ({
  onNavigateToNew,
  selectedCaseLocation,
}) => {
  const [units, setUnits] = useState<MapVehicleUnit[]>(INITIAL_UNITS);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('unit-pcr-1');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [serviceFilter, setServiceFilter] = useState<'all' | DispatchServiceType>('all');
  const [radioCallActive, setRadioCallActive] = useState<boolean>(false);
  const [lastRadioMessage, setLastRadioMessage] = useState<string | null>(null);

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || units[0];

  // GPS Simulation Loop: smoothly advance dispatched vehicles towards caller
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setUnits((prev) =>
        prev.map((unit) => {
          if (unit.status !== 'dispatched') return unit;

          // Target is caller (50, 48)
          const dx = CALLER_LOCATION.x - unit.currentX;
          const dy = CALLER_LOCATION.y - unit.currentY;
          const dist = Math.hypot(dx, dy);

          // If close enough, mark on scene
          if (dist < 2.5) {
            return {
              ...unit,
              status: 'on_scene',
              speedKmH: 0,
              distanceKm: 0.1,
              etaSeconds: 0,
            };
          }

          // Step size: 0.25% of map per tick
          const step = 0.28;
          const newX = unit.currentX + (dx / dist) * step;
          const newY = unit.currentY + (dy / dist) * step;

          // Compute remaining distance & ETA
          const newDistKm = Math.max(0.1, Number((unit.distanceKm - 0.015).toFixed(2)));
          const newEtaSec = Math.max(15, unit.etaSeconds - 1);
          const heading = (Math.atan2(dy, dx) * 180) / Math.PI;

          return {
            ...unit,
            currentX: newX,
            currentY: newY,
            distanceKm: newDistKm,
            etaSeconds: newEtaSec,
            headingDeg: heading,
            speedKmH: Math.floor(40 + Math.random() * 10),
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Handle Radio Broadcast / Call
  const handleTriggerRadioCall = (unit: MapVehicleUnit) => {
    ringtoneService.playDispatchSound();
    setRadioCallActive(true);
    setLastRadioMessage(`Dispatch Control connecting to ${unit.unitCode} on ${unit.radioFrequency}...`);

    setTimeout(() => {
      setLastRadioMessage(`[${unit.unitCode}] Copy Control! En route to Munirka Metro Gate 2. ETA ~${Math.ceil(unit.etaSeconds / 60)}m.`);
    }, 1500);

    setTimeout(() => {
      setRadioCallActive(false);
    }, 6000);
  };

  const handleToggleDispatch = (unitId: string) => {
    ringtoneService.playDispatchSound();
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id === unitId) {
          const nextStatus = u.status === 'dispatched' ? 'available' : 'dispatched';
          return {
            ...u,
            status: nextStatus,
            currentX: nextStatus === 'dispatched' ? u.currentX : u.baseX,
            currentY: nextStatus === 'dispatched' ? u.currentY : u.baseY,
          };
        }
        return u;
      })
    );
  };

  const handleDispatchAll = () => {
    ringtoneService.playDispatchSound();
    setUnits((prev) =>
      prev.map((u) => ({
        ...u,
        status: 'dispatched',
      }))
    );
  };

  const handleResetPositions = () => {
    setUnits(INITIAL_UNITS);
  };

  const filteredUnits = serviceFilter === 'all'
    ? units
    : units.filter((u) => u.serviceType === serviceFilter);

  const formatEta = (seconds: number) => {
    if (seconds <= 0) return 'On Scene';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Header & Telemetry Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Live Fleet & Service Dispatch Map</span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  GPS Active
                </span>
              </h2>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulation Toggle */}
          <button
            type="button"
            onClick={() => setIsSimulating((prev) => !prev)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              isSimulating
                ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title="Toggle live GPS movement simulation"
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Pause GPS Feed' : 'Resume GPS Feed'}</span>
          </button>

          {/* Reset Map */}
          <button
            type="button"
            onClick={handleResetPositions}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
            title="Reset telemetry positions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Dispatch All */}
          <button
            type="button"
            onClick={handleDispatchAll}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch All Fleet</span>
          </button>

          {/* Return to Triage Console */}
          {onNavigateToNew && (
            <button
              type="button"
              onClick={onNavigateToNew}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span>Live Triage Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Radio Broadcast Feedback Alert */}
      {lastRadioMessage && (
        <div className="p-3 rounded-xl bg-slate-900 border border-teal-500/40 text-teal-300 text-xs flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-4 h-4 text-teal-400 shrink-0 animate-ping" />
            <span className="font-mono truncate">{lastRadioMessage}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">VHF Transmit</span>
        </div>
      )}

      {/* Main Grid: Map Visualizer (Left 8 cols) + Selected Unit Telemetry (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* MAP CONTAINER (Col 8) */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col relative select-none">
          {/* Map Top Bar */}
          <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-slate-300 font-semibold">
                SECTOR: SOUTH DELHI (MUNIRKA - VASANT VIHAR)
              </span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-slate-400 text-[11px] hidden sm:inline">
                28.5583° N, 77.1728° E
              </span>
            </div>

            {/* Service Filters */}
            <div className="flex items-center gap-1">
              {(['all', 'police', 'ambulance', 'fire'] as const).map((svc) => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => setServiceFilter(svc)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    serviceFilter === svc
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {svc}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Map Area */}
          <div className="relative w-full h-[460px] sm:h-[540px] bg-slate-950 overflow-hidden">
            {/* Background Map Grid & Roads (SVG) */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Radar Grid Pattern */}
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.3" />
                </pattern>
                {/* Glowing Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Background */}
              <rect width="100" height="100" fill="url(#grid)" />

              {/* Distance Range Radar Rings from Caller (Munirka) */}
              <circle cx="50" cy="48" r="12" fill="none" stroke="#0ea5e9" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.4" />
              <circle cx="50" cy="48" r="24" fill="none" stroke="#0ea5e9" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.3" />
              <circle cx="50" cy="48" r="38" fill="none" stroke="#0ea5e9" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.2" />

              {/* Road Network Lines (Outer Ring Road, Africa Avenue, Nelson Mandela Marg) */}
              <g stroke="#334155" strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
                {/* Outer Ring Road (East-West diagonal) */}
                <line x1="5" y1="40" x2="95" y2="55" />
                {/* Africa Avenue (North-South) */}
                <line x1="78" y1="5" x2="70" y2="95" />
                {/* Nelson Mandela Marg (South-West) */}
                <line x1="40" y1="5" x2="65" y2="95" />
                {/* Vasant Vihar Connection */}
                <line x1="10" y1="20" x2="85" y2="25" />
                {/* Munirka Metro Inner Link */}
                <line x1="25" y1="75" x2="75" y2="75" />
              </g>

              {/* Highway Arterial Highlights */}
              <g stroke="#0f766e" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.5">
                <line x1="5" y1="40" x2="95" y2="55" />
                <line x1="78" y1="5" x2="70" y2="95" />
              </g>

              {/* Animated Route Lines for Dispatched Vehicles to Caller */}
              {units.map((unit) => {
                if (unit.status !== 'dispatched') return null;
                const colors = SERVICE_COLORS[unit.serviceType];
                return (
                  <g key={`route-${unit.id}`}>
                    {/* Base to Current Path */}
                    <line
                      x1={unit.baseX}
                      y1={unit.baseY}
                      x2={unit.currentX}
                      y2={unit.currentY}
                      stroke={colors.stroke}
                      strokeWidth="0.6"
                      opacity="0.3"
                    />
                    {/* Active Forward Route with Animated Dashes */}
                    <line
                      x1={unit.currentX}
                      y1={unit.currentY}
                      x2={CALLER_LOCATION.x}
                      y2={CALLER_LOCATION.y}
                      stroke={colors.stroke}
                      strokeWidth="0.9"
                      strokeDasharray="2,1.5"
                      className="animate-[dash_1s_linear_infinite]"
                      filter="url(#glow)"
                      opacity="0.8"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Geographical Landmark Text Labels */}
            <div className="absolute top-[8%] left-[76%] text-[10px] font-mono text-slate-500 pointer-events-none select-none">
              Africa Ave / Bhikaji Cama
            </div>
            <div className="absolute top-[35%] left-[8%] text-[10px] font-mono text-slate-500 pointer-events-none select-none">
              Outer Ring Road (West)
            </div>
            <div className="absolute top-[82%] left-[45%] text-[10px] font-mono text-slate-500 pointer-events-none select-none">
              JNU North Gate / Vasant Kunj
            </div>
            <div className="absolute top-[15%] left-[28%] text-[10px] font-mono text-slate-500 pointer-events-none select-none">
              Apex Trauma Centre
            </div>

            {/* CALLER LOCATION PIN (Central Distress Beacon) */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30"
              style={{ left: `${CALLER_LOCATION.x}%`, top: `${CALLER_LOCATION.y}%` }}
              title="Caller Distress Location Anchor"
            >
              {/* Radar Pulsing Rings */}
              <div className="absolute -inset-4 rounded-full bg-red-500/25 animate-ping"></div>
              <div className="absolute -inset-8 rounded-full border border-red-500/40 animate-pulse"></div>

              {/* Pin Icon */}
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-950 border-2 border-white">
                <MapPin className="w-5 h-5 fill-white" />
              </div>

              {/* Caller Label Box */}
              <div className="absolute left-1/2 -translate-x-1/2 top-10 whitespace-nowrap bg-slate-900/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-red-500 shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>{selectedCaseLocation || CALLER_LOCATION.name}</span>
              </div>
            </div>

            {/* VEHICLE & STATION MARKERS */}
            {filteredUnits.map((unit) => {
              const isSelected = unit.id === selectedUnitId;
              const isDispatched = unit.status === 'dispatched';
              const isOnScene = unit.status === 'on_scene';
              const colors = SERVICE_COLORS[unit.serviceType];

              return (
                <div
                  key={unit.id}
                  onClick={() => setSelectedUnitId(unit.id)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-700 z-20 group ${
                    isSelected ? 'scale-125 z-40' : 'hover:scale-110'
                  }`}
                  style={{ left: `${unit.currentX}%`, top: `${unit.currentY}%` }}
                >
                  {/* Active En-route Ping Ring */}
                  {isDispatched && (
                    <div
                      className={`absolute -inset-3 rounded-full opacity-70 animate-ping ${colors.ping}`}
                    ></div>
                  )}

                  {/* Marker Body */}
                  <div
                    className={`relative p-2 rounded-xl text-white shadow-xl border-2 flex items-center justify-center ${colors.bg} ${
                      isSelected ? 'border-white ring-4 ring-teal-400/50' : 'border-slate-900'
                    }`}
                  >
                    {unit.serviceType === 'police' && <ShieldAlert className="w-4 h-4" />}
                    {unit.serviceType === 'ambulance' && <Ambulance className="w-4 h-4" />}
                    {unit.serviceType === 'medical' && <Activity className="w-4 h-4" />}
                    {unit.serviceType === 'fire' && <Flame className="w-4 h-4" />}
                    {unit.serviceType === 'ngo' && <HeartHandshake className="w-4 h-4" />}
                    {unit.serviceType === 'shelter' && <Home className="w-4 h-4" />}
                  </div>

                  {/* Vehicle Tag Badge */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 -top-6 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shadow-xs transition-opacity ${
                      isSelected ? 'opacity-100 bg-slate-900 text-white border-white' : 'opacity-80 bg-slate-900/90 text-slate-300 border-slate-700'
                    }`}
                  >
                    {unit.unitCode} {isOnScene ? '(ON SCENE)' : isDispatched ? `(~${formatEta(unit.etaSeconds)})` : ''}
                  </div>
                </div>
              );
            })}

            {/* Base Station Anchors (Fixed Station Pins) */}
            {units.map((unit) => (
              <div
                key={`station-${unit.id}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 opacity-60 pointer-events-none"
                style={{ left: `${unit.baseX}%`, top: `${unit.baseY}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400"></div>
              </div>
            ))}
          </div>

          {/* Map Bottom Status Bar */}
          <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>TELEMETRY ONLINE</span>
              </span>
              <span>•</span>
              <span>12 SATELLITES (3D FIX)</span>
              <span>•</span>
              <span className="text-slate-500">REFRESH: 1000ms</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Click any vehicle marker to inspect</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: SELECTED UNIT TELEMETRY & FLEET ROSTER (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Unit Telemetry Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    {selectedUnit.unitCode}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      selectedUnit.status === 'dispatched'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse'
                        : selectedUnit.status === 'on_scene'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {selectedUnit.status === 'dispatched'
                      ? 'En Route GPS'
                      : selectedUnit.status === 'on_scene'
                      ? 'On Scene'
                      : 'Station Standby'}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white pt-1">
                  {selectedUnit.name}
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                  {selectedUnit.vehicleType}
                </span>
              </div>
            </div>

            {/* Real-time Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Distance to Caller</span>
                <span className="font-mono font-bold text-sm text-teal-700 dark:text-teal-400 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-teal-600" />
                  {selectedUnit.distanceKm} km
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Arrival</span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatEta(selectedUnit.etaSeconds)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Speed / Telemetry</span>
                <span className="font-mono font-semibold text-xs text-slate-800 dark:text-slate-200">
                  {selectedUnit.speedKmH} km/h • Siren ON
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Radio Frequency</span>
                <span className="font-mono font-semibold text-[11px] text-slate-700 dark:text-slate-300 truncate block">
                  {selectedUnit.radioFrequency.split('(')[0]}
                </span>
              </div>
            </div>

            {/* Personnel & Station Info */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Crew / Officer:</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                  {selectedUnit.officers}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Base Post:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[160px]" title={selectedUnit.stationName}>
                  {selectedUnit.stationName.split('(')[0]}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Direct Contact:</span>
                <span className="font-mono text-teal-600 dark:text-teal-400">{selectedUnit.contactNumber}</span>
              </div>
            </div>

            {/* Operator Actions for this Unit */}
            <div className="flex items-center gap-2 pt-1">
              {/* Radio Intercom Call */}
              <button
                type="button"
                onClick={() => handleTriggerRadioCall(selectedUnit)}
                disabled={radioCallActive}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Radio className={`w-3.5 h-3.5 ${radioCallActive ? 'text-red-500 animate-ping' : 'text-teal-600'}`} />
                <span>{radioCallActive ? 'Transmitting...' : 'VHF Radio Call'}</span>
              </button>

              {/* Dispatch / Recall Toggle */}
              <button
                type="button"
                onClick={() => handleToggleDispatch(selectedUnit.id)}
                className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                  selectedUnit.status === 'dispatched'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                {selectedUnit.status === 'dispatched' ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Recall Unit</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Unit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* All Units Live Roster List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2.5 transition-colors">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Emergency Fleet Roster
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                {units.filter((u) => u.status === 'dispatched').length}/{units.length} Dispatched
              </span>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {units.map((unit) => {
                const isSelected = unit.id === selectedUnitId;
                const colors = SERVICE_COLORS[unit.serviceType];
                return (
                  <div
                    key={unit.id}
                    onClick={() => setSelectedUnitId(unit.id)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${colors.ping}`}></div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate text-xs">
                          {unit.unitCode} • {unit.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          {unit.distanceKm} km • {formatEta(unit.etaSeconds)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          unit.status === 'dispatched'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {unit.status === 'dispatched' ? 'En Route' : 'Ready'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
