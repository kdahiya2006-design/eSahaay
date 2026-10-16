import React from 'react';
import { Cpu, UserCheck, Sparkles, Menu, HeartHandshake } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  modeLabel?: string;
  isDemoMode?: boolean;
  operatorId?: string;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  modeLabel = 'Demo Mode: Deterministic Engine',
  isDemoMode = true,
  operatorId = 'OP-Delhi-104',
  onOpenMobileMenu,
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 py-3.5 shadow-xs transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Menu Toggle + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 focus:outline-hidden active:scale-95"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="md:hidden w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white shrink-0">
                <HeartHandshake className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight truncate">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-500 font-normal mt-0.5 truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Badges */}
        <div className="flex items-center gap-2 shrink-0">
          {/* AI Mode Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border transition-all ${
              isDemoMode
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}
            title={modeLabel}
          >
            {isDemoMode ? (
              <Cpu className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold hidden sm:inline">
              {isDemoMode ? 'Demo Rule Engine' : 'Live Gemini AI'}
            </span>
            <span className="font-semibold sm:hidden">
              {isDemoMode ? 'Demo' : 'Live AI'}
            </span>
          </div>

          {/* Operator Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="hidden sm:inline">{operatorId}</span>
            <span className="sm:hidden">{operatorId.length > 8 ? operatorId.slice(-6) : operatorId}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
