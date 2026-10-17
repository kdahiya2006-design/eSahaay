import React, { useState } from 'react';
import {
  ShieldAlert,
  Ambulance,
  Flame,
  Activity,
  HeartHandshake,
  Home,
  CheckCircle2,
  Radio,
  Send,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import type { DispatchDecision, DispatchServiceType, UrgencyLevel } from '../types';
import { ringtoneService } from '../services/ringtoneService';

export interface EmergencyDispatchMatrixProps {
  threatScore: number;
  urgencyLevel: UrgencyLevel;
  primaryService: DispatchServiceType;
  decisions: DispatchDecision[];
  onDispatchUpdate?: (updatedDecisions: DispatchDecision[]) => void;
}

const SERVICE_ICONS: Record<DispatchServiceType, any> = {
  police: ShieldAlert,
  ambulance: Ambulance,
  medical: Activity,
  fire: Flame,
  ngo: HeartHandshake,
  shelter: Home,
};

const SERVICE_COLORS: Record<DispatchServiceType, { bg: string; text: string; border: string }> = {
  police: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  ambulance: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  medical: {
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
  },
  fire: {
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
  ngo: {
    bg: 'bg-teal-50 dark:bg-teal-950/60',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
  },
  shelter: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
};

export const EmergencyDispatchMatrix: React.FC<EmergencyDispatchMatrixProps> = ({
  threatScore,
  urgencyLevel,
  primaryService,
  decisions: initialDecisions,
  onDispatchUpdate,
}) => {
  const [decisions, setDecisions] = useState<DispatchDecision[]>(initialDecisions);

  // Sync state if initialDecisions change
  React.useEffect(() => {
    setDecisions(initialDecisions);
  }, [initialDecisions]);

  const toggleDispatch = (service: DispatchServiceType) => {
    ringtoneService.playDispatchSound();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const updated = decisions.map((d) => {
      if (d.service === service) {
        const nextDispatched = !d.dispatched;
        return {
          ...d,
          dispatched: nextDispatched,
          dispatchedAt: nextDispatched ? now : undefined,
          assignedUnit: nextDispatched
            ? (d.service === 'police' ? 'PCR-Eagle-04' : d.service === 'ambulance' ? 'CATS-ALS-31' : d.service === 'fire' ? 'DFS-Tender-04' : d.service === 'medical' ? 'Casualty-Unit-1' : d.service === 'shelter' ? 'Swadhar-Refuge-03' : 'Sakhi-OSC-01')
            : undefined,
          etaMinutes: nextDispatched ? (d.service === 'police' ? 3 : d.service === 'ambulance' ? 4 : 6) : undefined,
        };
      }
      return d;
    });

    setDecisions(updated);
    if (onDispatchUpdate) {
      onDispatchUpdate(updated);
    }
  };

  const dispatchAllRecommended = () => {
    ringtoneService.playDispatchSound();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const updated = decisions.map((d) => {
      if (d.status === 'RECOMMENDED') {
        return {
          ...d,
          dispatched: true,
          dispatchedAt: now,
          assignedUnit: d.service === 'police' ? 'PCR-Eagle-04' : d.service === 'ambulance' ? 'CATS-ALS-31' : d.service === 'fire' ? 'DFS-Tender-04' : d.service === 'medical' ? 'Casualty-Unit-1' : d.service === 'shelter' ? 'Swadhar-Refuge-03' : 'Sakhi-OSC-01',
          etaMinutes: d.service === 'police' ? 3 : d.service === 'ambulance' ? 4 : 6,
        };
      }
      return d;
    });

    setDecisions(updated);
    if (onDispatchUpdate) {
      onDispatchUpdate(updated);
    }
  };

  const getThreatColor = (score: number) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const getThreatBarBg = (score: number) => {
    if (score >= 80) return 'bg-red-600';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-5 animate-fadeIn">
      {/* Header: Emergency Threat Measurement Meter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Emergency Measurement & Service Dispatch Engine
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              6-Service Triage
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automatically evaluates threat severity and determines which emergency services (Medical, Ambulance, Police, Fire, NGO, Shelter) must be dispatched.
          </p>
        </div>

        {/* Threat Level Index Box */}
        <div className="flex items-center gap-3 shrink-0 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Threat Index:</span>
              <span className={`font-black font-mono text-sm ${getThreatColor(threatScore)}`}>
                {threatScore}/100
              </span>
            </div>
            <div className="w-36 sm:w-44 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getThreatBarBg(threatScore)}`}
                style={{ width: `${threatScore}%` }}
              ></div>
            </div>
          </div>

          <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
              Urgency
            </span>
            <span
              className={`text-xs font-black uppercase tracking-wider ${
                urgencyLevel === 'High'
                  ? 'text-red-600 dark:text-red-400'
                  : urgencyLevel === 'Medium'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {urgencyLevel}
            </span>
          </div>
        </div>
      </div>

      {/* 6 Services Decision Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {decisions.map((decision) => {
          const Icon = SERVICE_ICONS[decision.service];
          const colors = SERVICE_COLORS[decision.service];
          const isPrimary = decision.service === primaryService && decision.status === 'RECOMMENDED';

          return (
            <div
              key={decision.service}
              className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                decision.dispatched
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-sm'
                  : decision.status === 'RECOMMENDED'
                  ? `${colors.bg} ${colors.border} shadow-xs`
                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 opacity-90'
              }`}
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${colors.bg} ${colors.text} shrink-0 border ${colors.border}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white capitalize">
                        {decision.service}
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                        {decision.serviceName.split('(')[1]?.replace(')', '') || 'Emergency Service'}
                      </span>
                    </div>
                  </div>

                  {/* Decision Status Badge */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {decision.dispatched ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                        <CheckCircle2 className="w-3 h-3" />
                        Dispatched
                      </span>
                    ) : decision.status === 'RECOMMENDED' ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isPrimary
                            ? 'bg-red-600 text-white animate-pulse shadow-xs'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        }`}
                      >
                        {isPrimary ? 'Priority Dispatch' : 'Recommended'}
                      </span>
                    ) : decision.status === 'STANDBY' ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Standby Alert
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                        Not Required
                      </span>
                    )}
                  </div>
                </div>

                {/* Reasoning Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[42px]">
                  {decision.reason}
                </p>

                {/* Dispatched Info Banner (if dispatched) */}
                {decision.dispatched && (
                  <div className="p-2.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Radio className="w-3.5 h-3.5 text-emerald-600 animate-ping" />
                      <span>Unit: {decision.assignedUnit}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold">
                      ETA: ~{decision.etaMinutes || 4} mins
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 mt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  {decision.dispatchedAt ? `Sent at ${decision.dispatchedAt}` : `Priority: ${decision.urgency}`}
                </span>

                <button
                  type="button"
                  onClick={() => toggleDispatch(decision.service)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs ${
                    decision.dispatched
                      ? 'bg-slate-200 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-950 hover:text-red-700 text-slate-700 dark:text-slate-200'
                      : decision.status === 'RECOMMENDED'
                      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-900/20'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {decision.dispatched ? (
                    <>
                      <RotateCcw className="w-3 h-3" />
                      <span>Recall / Cancel</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>{decision.status === 'RECOMMENDED' ? 'Dispatch Unit' : 'Authorize Dispatch'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Operator Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>Operator protocol: Field dispatches log GPS coordinates, timestamp, and radio frequency.</span>
        </span>

        <button
          type="button"
          onClick={dispatchAllRecommended}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-900/20 transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Dispatch All Recommended Services</span>
        </button>
      </div>
    </div>
  );
};
