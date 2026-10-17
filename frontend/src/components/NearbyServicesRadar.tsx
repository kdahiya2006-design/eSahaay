import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  ShieldAlert,
  Ambulance,
  Flame,
  Activity,
  HeartHandshake,
  Home,
  Radio,
  Send,
  RotateCcw,
  Clock
} from 'lucide-react';
import type { NearbyEmergencyUnit, DispatchServiceType } from '../types';
import { dispatchEngine } from '../services/dispatchEngine';
import { ringtoneService } from '../services/ringtoneService';

export interface NearbyServicesRadarProps {
  locationHint?: string;
  onUnitDispatched?: (unit: NearbyEmergencyUnit) => void;
}

const SERVICE_TYPE_ICONS: Record<DispatchServiceType, any> = {
  police: ShieldAlert,
  ambulance: Ambulance,
  medical: Activity,
  fire: Flame,
  ngo: HeartHandshake,
  shelter: Home,
};

export const NearbyServicesRadar: React.FC<NearbyServicesRadarProps> = ({
  locationHint = 'Munirka Metro Station, New Delhi',
  onUnitDispatched,
}) => {
  const [currentLocation, setCurrentLocation] = useState(locationHint || 'Munirka Metro Station, New Delhi');
  const [editingLocation, setEditingLocation] = useState(false);
  const [customLocInput, setCustomLocInput] = useState(locationHint || 'Munirka Metro Station, New Delhi');

  const [activeFilter, setActiveFilter] = useState<'all' | DispatchServiceType>('all');
  const [units, setUnits] = useState<NearbyEmergencyUnit[]>(() =>
    dispatchEngine.getNearbyEmergencyUnits(locationHint)
  );

  // Sync if locationHint prop updates
  React.useEffect(() => {
    if (locationHint && locationHint !== currentLocation) {
      setCurrentLocation(locationHint);
      setCustomLocInput(locationHint);
      setUnits(dispatchEngine.getNearbyEmergencyUnits(locationHint));
    }
  }, [locationHint]);

  const handleApplyCustomLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLocInput.trim()) return;
    setCurrentLocation(customLocInput.trim());
    setUnits(dispatchEngine.getNearbyEmergencyUnits(customLocInput.trim()));
    setEditingLocation(false);
  };

  const handleToggleDispatchUnit = (unitId: string) => {
    ringtoneService.playDispatchSound();
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id === unitId) {
          const isNowDispatched = u.status !== 'dispatched';
          const updated = {
            ...u,
            status: (isNowDispatched ? 'dispatched' : 'available') as any,
          };
          if (isNowDispatched && onUnitDispatched) {
            onUnitDispatched(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const filteredUnits = activeFilter === 'all'
    ? units
    : units.filter((u) => u.serviceType === activeFilter);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4 animate-fadeIn">
      {/* Header: Location & Radar Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <Navigation className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Nearby Services Dispatch Radar
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live GPS Radar
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time nearby PCR vans, ambulances, fire tenders, and shelters pinpointed around the victim's location.
          </p>
        </div>

        {/* Current Victim Location Tag & Edit Button */}
        <div className="flex items-center gap-2">
          {editingLocation ? (
            <form onSubmit={handleApplyCustomLocation} className="flex items-center gap-2">
              <input
                type="text"
                value={customLocInput}
                onChange={(e) => setCustomLocInput(e.target.value)}
                placeholder="Enter victim's landmark/area"
                className="text-xs px-3 py-1.5 rounded-xl border border-teal-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-medium w-52 sm:w-64"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
              >
                Set
              </button>
              <button
                type="button"
                onClick={() => setEditingLocation(false)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-bounce" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[200px] sm:max-w-xs truncate">
                {currentLocation}
              </span>
              <button
                type="button"
                onClick={() => setEditingLocation(true)}
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-bold shrink-0 ml-1"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline">
          Filter:
        </span>
        {[
          { key: 'all', label: 'All Units' },
          { key: 'police', label: 'PCR Vans' },
          { key: 'ambulance', label: 'Ambulances' },
          { key: 'fire', label: 'Fire Trucks' },
          { key: 'medical', label: 'Trauma Hospitals' },
          { key: 'shelter', label: 'Shelters' },
          { key: 'ngo', label: 'NGO / Crisis' },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key as any)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === f.key
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredUnits.map((unit) => {
          const Icon = SERVICE_TYPE_ICONS[unit.serviceType] || ShieldAlert;
          const isDispatched = unit.status === 'dispatched';

          return (
            <div
              key={unit.id}
              className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                isDispatched
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-sm'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-white dark:hover:bg-slate-800/70'
              }`}
            >
              <div className="space-y-2.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isDispatched
                          ? 'bg-emerald-600 text-white animate-siren'
                          : 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {unit.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {unit.unitCode}
                      </span>
                    </div>
                  </div>

                  {/* Distance & ETA Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300 font-mono block">
                      {unit.distanceKm} km away
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1 font-medium">
                      <Clock className="w-3 h-3 text-amber-500" />
                      ETA ~{unit.etaMinutes}m
                    </span>
                  </div>
                </div>

                {/* Details */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                  {unit.specialization}
                </p>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-col gap-0.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="truncate">Station: <strong>{unit.stationName}</strong></span>
                  <span className="truncate font-mono">Contact: {unit.contactNumber}</span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 mt-2 flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  {isDispatched ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-ping" />
                      En Route
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  )}
                  {isDispatched ? 'Transmitting GPS' : 'Available'}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleDispatchUnit(unit.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs ${
                    isDispatched
                      ? 'bg-slate-200 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-950 hover:text-red-700 text-slate-700 dark:text-slate-200'
                      : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-900/20'
                  }`}
                >
                  {isDispatched ? (
                    <>
                      <RotateCcw className="w-3 h-3" />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Dispatch Unit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
