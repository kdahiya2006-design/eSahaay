import React, { useState } from 'react';
import {
  Compass,
  RotateCcw,
  Send,
  ArrowRight,
  Radio,
  Navigation,
  Clock,
  ShieldAlert,
  Ambulance,
  Activity,
  Flame,
  HeartHandshake,
  Home,
  CheckCircle2
} from 'lucide-react';
import type { DispatchServiceType, DispatchDecision } from '../types';
import { ringtoneService } from '../services/ringtoneService';
import { LiveLocationMapCanvas } from '../components/LiveLocationMapCanvas';

interface LiveFleetMapPageProps {
  onNavigateToNew?: () => void;
  selectedCaseLocation?: string;
}

interface FleetRosterUnit {
  service: DispatchServiceType;
  unitCode: string;
  name: string;
  vehicleType: string;
  stationName: string;
  officers: string;
  contactNumber: string;
  radioFrequency: string;
  distanceKm: number;
  etaMinutes: number;
}

const FLEET_ROSTER: FleetRosterUnit[] = [
  {
    service: 'police',
    unitCode: 'PCR-DL-1C-4921',
    name: 'Eagle-04 PCR Patrol',
    vehicleType: 'Innova Emergency Patrol',
    stationName: 'Vasant Vihar Police Station',
    officers: 'SI Rajesh Kumar • Ct. S. Meena',
    contactNumber: '+91 98711 00112',
    radioFrequency: 'VHF Ch. 4 (156.800 MHz)',
    distanceKm: 1.2,
    etaMinutes: 3,
  },
  {
    service: 'ambulance',
    unitCode: 'AMB-108-DL-31',
    name: 'CATS ALS Life Support',
    vehicleType: 'Force Traveller ALS (Paramedic)',
    stationName: 'Safdarjung CATS Hub',
    officers: 'Dr. A. Verma • EMT Manoj Rawat',
    contactNumber: '+91 98114 10831',
    radioFrequency: 'VHF Ch. 7 (158.250 MHz)',
    distanceKm: 3.4,
    etaMinutes: 4,
  },
  {
    service: 'medical',
    unitCode: 'HOSP-TRAUMA-01',
    name: 'Apex Emergency Trauma Ward',
    vehicleType: 'Level-1 Emergency Trauma Ward',
    stationName: 'AIIMS Campus Trauma Centre',
    officers: 'Dr. P. Swaminathan (CMO)',
    contactNumber: '011-26165060',
    radioFrequency: 'Hospital Hotline 102',
    distanceKm: 2.8,
    etaMinutes: 4,
  },
  {
    service: 'fire',
    unitCode: 'DFS-WT-04',
    name: 'Delhi Fire Tender #04',
    vehicleType: 'Heavy Water Tender & Foam Monitor',
    stationName: 'Bhikaji Cama Fire Post',
    officers: 'Lead Officer R. Dahiya',
    contactNumber: '011-23412222',
    radioFrequency: 'DFS VHF Band-2',
    distanceKm: 1.6,
    etaMinutes: 3,
  },
  {
    service: 'ngo',
    unitCode: 'NGO-SAKHI-01',
    name: 'Sakhi Crisis Cell Van',
    vehicleType: 'Women Crisis Support Escort',
    stationName: 'Sakhi One-Stop Crisis Post',
    officers: 'Counselor Priya Sen • Off. Sunita',
    contactNumber: 'Helpline: 181 / +91 98110 54321',
    radioFrequency: 'WCD Direct Network',
    distanceKm: 2.1,
    etaMinutes: 5,
  },
  {
    service: 'shelter',
    unitCode: 'SHELTER-SWD-03',
    name: 'Swadhar Sanctuary Safe Shelter',
    vehicleType: 'Protected Women Shelter Facility',
    stationName: 'Vasant Kunj Sanctuary Center',
    officers: 'Warden Kavita Rao • Care Staff',
    contactNumber: '011-26891100',
    radioFrequency: 'Dedicated Secure Dispatch',
    distanceKm: 3.6,
    etaMinutes: 6,
  },
];

export const LiveFleetMapPage: React.FC<LiveFleetMapPageProps> = ({
  onNavigateToNew,
  selectedCaseLocation = 'Munirka Metro Station (Gate 2), New Delhi',
}) => {
  const [decisions, setDecisions] = useState<DispatchDecision[]>([
    {
      service: 'police',
      serviceName: 'Delhi Police (112)',
      status: 'RECOMMENDED',
      urgency: 'IMMEDIATE',
      reason: 'Immediate patrol interceptor response',
      dispatched: true,
    },
    {
      service: 'ambulance',
      serviceName: 'CATS ALS Ambulance (102)',
      status: 'RECOMMENDED',
      urgency: 'IMMEDIATE',
      reason: 'Paramedic life support on scene',
      dispatched: true,
    },
    {
      service: 'medical',
      serviceName: 'Apex Trauma Centre Support',
      status: 'RECOMMENDED',
      urgency: 'HIGH',
      reason: 'Casualty ward readiness',
      dispatched: false,
    },
    {
      service: 'fire',
      serviceName: 'Delhi Fire Services (101)',
      status: 'STANDBY',
      urgency: 'ROUTINE',
      reason: 'Standby foam monitor support',
      dispatched: false,
    },
    {
      service: 'ngo',
      serviceName: 'Sakhi Crisis Cell (181)',
      status: 'RECOMMENDED',
      urgency: 'HIGH',
      reason: 'Specialized crisis escort & counselor',
      dispatched: true,
    },
    {
      service: 'shelter',
      serviceName: 'Swadhar Sanctuary Shelter',
      status: 'STANDBY',
      urgency: 'ROUTINE',
      reason: 'Safe shelter bed availability',
      dispatched: false,
    },
  ]);

  const [selectedUnitService, setSelectedUnitService] = useState<DispatchServiceType>('police');
  const [lastRadioMessage, setLastRadioMessage] = useState<string | null>(null);

  const handleToggleDispatch = (service: DispatchServiceType) => {
    ringtoneService.playDispatchSound();
    setDecisions((prev) =>
      prev.map((d) => {
        if (d.service === service) {
          const next = !d.dispatched;
          if (next) {
            setLastRadioMessage(`DISPATCH ORDER TRANSMITTED: Unit ${service.toUpperCase()} Rolling En Route`);
            setTimeout(() => setLastRadioMessage(null), 4000);
          }
          return { ...d, dispatched: next };
        }
        return d;
      })
    );
  };

  const handleDispatchAll = () => {
    ringtoneService.playDispatchSound();
    setDecisions((prev) => prev.map((d) => ({ ...d, dispatched: true })));
    setLastRadioMessage('TACTICAL FLEET BROADCAST: ALL EMERGENCY UNITS CONVERGING TO CALLER SCENE');
    setTimeout(() => setLastRadioMessage(null), 4500);
  };

  const handleResetPositions = () => {
    setDecisions((prev) => prev.map((d) => ({ ...d, dispatched: false })));
    setLastRadioMessage('FLEET RECALLED TO STATION BASES');
    setTimeout(() => setLastRadioMessage(null), 3500);
  };

  const handleVhfChime = (unit: FleetRosterUnit) => {
    ringtoneService.playDispatchSound();
    setLastRadioMessage(`VHF Transmit: Live Radio broadcast to ${unit.unitCode} (${unit.radioFrequency})`);
    setTimeout(() => setLastRadioMessage(null), 4000);
  };

  const selectedUnit =
    FLEET_ROSTER.find((u) => u.service === selectedUnitService) || FLEET_ROSTER[0];
  const isSelectedDispatched =
    decisions.find((d) => d.service === selectedUnitService)?.dispatched || false;
  const dispatchedCount = decisions.filter((d) => d.dispatched).length;

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
          {/* Reset Map */}
          <button
            type="button"
            onClick={handleResetPositions}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all active:scale-95 cursor-pointer text-xs font-semibold flex items-center gap-1.5"
            title="Recall fleet to stations"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recall All</span>
          </button>

          {/* Dispatch All */}
          <button
            type="button"
            onClick={handleDispatchAll}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch All Fleet ({dispatchedCount}/6)</span>
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

      {/* Main Grid: Google Maps / OSM Map (Col 8) + Selected Unit Telemetry & Roster (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* MAP CONTAINER (Col 8) - Integrated Leaflet OpenStreetMap / Google Maps Format */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <LiveLocationMapCanvas
            locationName={selectedCaseLocation}
            decisions={decisions}
            onToggleDispatch={handleToggleDispatch}
            height={520}
          />
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
                      isSelectedDispatched
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {isSelectedDispatched ? 'En Route GPS' : 'Station Standby'}
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
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Distance to Caller
                </span>
                <span className="font-mono font-bold text-sm text-teal-700 dark:text-teal-400 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-teal-600" />
                  {selectedUnit.distanceKm} km
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Estimated Arrival
                </span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />~{selectedUnit.etaMinutes} min
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
                <span
                  className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[160px]"
                  title={selectedUnit.stationName}
                >
                  {selectedUnit.stationName.split('(')[0]}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>VHF Channel:</span>
                <span className="font-mono text-teal-600 dark:text-teal-400">
                  {selectedUnit.radioFrequency.split('(')[0]}
                </span>
              </div>
            </div>

            {/* Operator Actions for this Unit */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleVhfChime(selectedUnit)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <Radio className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>VHF Intercom</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleDispatch(selectedUnit.service)}
                className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
                  isSelectedDispatched
                    ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-900/40'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSelectedDispatched ? 'Recall Unit' : 'Dispatch Unit'}</span>
              </button>
            </div>
          </div>

          {/* Full Fleet Units Roster List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2.5 transition-colors">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>Fleet Deployment Roster</span>
              <span className="text-[11px] font-mono font-normal text-slate-400">
                {dispatchedCount}/6 Active
              </span>
            </h4>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {FLEET_ROSTER.map((unit) => {
                const isSelected = unit.service === selectedUnitService;
                const dispatched = decisions.find((d) => d.service === unit.service)?.dispatched;

                return (
                  <div
                    key={unit.service}
                    onClick={() => setSelectedUnitService(unit.service)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 ring-1 ring-teal-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                        {unit.service === 'police' && <ShieldAlert className="w-3.5 h-3.5 text-sky-600" />}
                        {unit.service === 'ambulance' && <Ambulance className="w-3.5 h-3.5 text-red-600" />}
                        {unit.service === 'medical' && <Activity className="w-3.5 h-3.5 text-rose-600" />}
                        {unit.service === 'fire' && <Flame className="w-3.5 h-3.5 text-orange-600" />}
                        {unit.service === 'ngo' && <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />}
                        {unit.service === 'shelter' && <Home className="w-3.5 h-3.5 text-slate-600" />}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {unit.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {unit.unitCode} • {unit.distanceKm} km
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {dispatched ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 animate-pulse">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Live
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Standby
                        </span>
                      )}
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
