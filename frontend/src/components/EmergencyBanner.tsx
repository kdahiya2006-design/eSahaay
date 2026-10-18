import React from 'react';
import { AlertOctagon, PhoneCall, X } from 'lucide-react';

interface EmergencyBannerProps {
  immediateDanger: boolean;
  onDismiss?: () => void;
  onEscalate?: () => void;
  className?: string;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  immediateDanger,
  onDismiss,
  onEscalate,
  className = '',
}) => {
  if (!immediateDanger) {
    return null;
  }

  return (
    <div
      className={`bg-red-50 dark:bg-red-950/70 border-2 border-red-500 dark:border-red-600 rounded-xl p-3 sm:p-4 shadow-sm text-red-950 dark:text-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative transition-all ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3 pr-6 sm:pr-0">
        <div className="p-2 bg-red-600 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
          <AlertOctagon className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="font-bold text-red-900 dark:text-red-200 text-xs sm:text-sm tracking-wide uppercase flex flex-wrap items-center gap-2">
            <span>Emergency Escalation Protocol Advisory</span>
            <span className="text-[10px] sm:text-xs bg-red-200 dark:bg-red-900/80 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full font-semibold">
              Action Required
            </span>
          </h4>
          <p className="text-xs sm:text-sm text-red-800 dark:text-red-200/90 mt-0.5 leading-snug">
            Potential active threat or forced intrusion in progress. Immediately invoke your agency’s emergency dispatch protocol.
            <strong> Do NOT delay action</strong> waiting for form fields or further AI analysis.
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
        {onEscalate && (
          <button
            type="button"
            onClick={onEscalate}
            className="text-xs font-semibold px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Escalate Dispatch</span>
          </button>
        )}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-red-700 dark:text-red-300 hover:bg-red-200/60 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
            title="Dismiss advisory"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

