import React from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert } from 'lucide-react';

interface EmergencyBannerProps {
  immediateDanger: boolean;
  className?: string;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  immediateDanger,
  className = '',
}) => {
  if (immediateDanger) {
    return (
      <div
        className={`bg-red-50 border-2 border-red-500 rounded-xl p-4 shadow-sm text-red-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-600 text-white rounded-lg shrink-0 mt-0.5">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-red-900 text-sm tracking-wide uppercase flex items-center gap-2">
              <span>Emergency Escalation Protocol Advisory</span>
              <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-semibold">
                Action Required
              </span>
            </h4>
            <p className="text-sm text-red-800 mt-0.5 leading-snug">
              Potential active threat or forced intrusion in progress. Immediately invoke your agency’s emergency dispatch protocol.
              <strong> Do NOT delay action</strong> waiting for form fields or further AI analysis.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <div className="text-xs font-semibold px-3 py-1.5 bg-red-600 text-white rounded-lg flex items-center gap-1.5 shadow-xs">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Escalate Dispatch</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-100 border border-slate-300/80 rounded-lg px-3.5 py-2 text-slate-700 text-xs flex items-center justify-between gap-2 ${className}`}
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
        <span className="break-words">
          <strong>Decision-Support Notice:</strong> eSahaay does not replace emergency dispatchers or trained operators. All AI urgency suggestions require human verification.
        </span>
      </div>
      <span className="text-[11px] text-slate-500 whitespace-nowrap hidden md:inline">
        No automated 3rd-party calls initiated
      </span>
    </div>
  );
};
