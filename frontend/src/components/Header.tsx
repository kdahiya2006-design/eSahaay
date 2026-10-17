import React from 'react';
import {
  Cpu,
  UserCheck,
  Sparkles,
  Menu,
  HeartHandshake,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  modeLabel?: string;
  isDemoMode?: boolean;
  operatorId?: string;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  modeLabel = 'Demo Mode: Deterministic Engine',
  isDemoMode = true,
  operatorId = 'OP-Delhi-104',
  isDarkMode = false,
  onToggleDarkMode,
  onOpenMobileMenu,
}) => {
  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 px-4 sm:px-6 py-3.5 shadow-xs transition-colors duration-200">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Menu Toggle + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 -ml-1 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 focus:outline-hidden active:scale-95 cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="md:hidden w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white shrink-0">
                <HeartHandshake className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5 truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Mode, Operator & Dark Mode Toggle (Top Right Corner) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* AI Mode Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border transition-all ${
              isDemoMode
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            }`}
            title={modeLabel}
          >
            {isDemoMode ? (
              <Cpu className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <span className="font-semibold hidden sm:inline">
              {isDemoMode ? 'Demo Rule Engine' : 'Live Gemini AI'}
            </span>
            <span className="font-semibold sm:hidden">
              {isDemoMode ? 'Demo' : 'Live AI'}
            </span>
          </div>

          {/* Operator Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="hidden sm:inline">{operatorId}</span>
            <span className="sm:hidden">{operatorId.length > 8 ? operatorId.slice(-6) : operatorId}</span>
          </div>

          {/* Dark / Light Mode Toggle Button (Top Right Corner) */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 animate-fadeIn" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 animate-fadeIn" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
