import React, { useState, useMemo } from 'react';
import type { DemoCase } from '../types';
import { SYNTHETIC_DEMO_CASES } from '../data/demoCases';
import {
  X,
  BookOpen,
  ArrowRight,
  Search,
  Sparkles,
  Globe2,
  RotateCcw
} from 'lucide-react';

interface DemoCaseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  demoCases: DemoCase[];
  onSelectCase: (demo: DemoCase) => void;
}

export const DemoCaseSelectorModal: React.FC<DemoCaseSelectorModalProps> = ({
  isOpen,
  onClose,
  demoCases,
  onSelectCase,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>('All');

  // Fallback to embedded synthetic demo cases if prop is empty or null
  const sourceCases = useMemo(() => {
    if (Array.isArray(demoCases) && demoCases.length > 0) {
      return demoCases;
    }
    return SYNTHETIC_DEMO_CASES;
  }, [demoCases]);

  // Extract unique languages for filter chips
  const languages = useMemo(() => {
    const set = new Set<string>();
    sourceCases.forEach((c) => {
      if (c.language_hint) set.add(c.language_hint);
    });
    return ['All', ...Array.from(set)];
  }, [sourceCases]);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return sourceCases.filter((c) => {
      const matchesLang =
        selectedLang === 'All' ||
        c.language_hint?.toLowerCase() === selectedLang.toLowerCase();

      if (!matchesLang) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.transcript.toLowerCase().includes(q) ||
        c.category_hint.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.language_hint && c.language_hint.toLowerCase().includes(q))
      );
    });
  }, [sourceCases, selectedLang, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-sky-600 rounded-xl text-white shadow-sm shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight truncate">
                  Select Synthetic Demo Scenario
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {sourceCases.length} Scenarios
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800 active:scale-95 shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Language Filters Bar */}
        <div className="p-4 sm:px-6 bg-slate-50/90 border-b border-slate-200 space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, safeguard (threat, negation, location), or language..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Language filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
              <Globe2 className="w-3 h-3 text-slate-400" />
              Language:
            </span>
            {languages.map((lang) => {
              const active = selectedLang === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLang(lang)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 active:scale-95 ${
                    active
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* List of Demo Scenarios */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/40">
          {filteredCases.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No scenarios found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No demo scenarios match "{searchQuery}" in {selectedLang === 'All' ? 'any language' : selectedLang}.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLang('All');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filters
                </button>
              </div>
            </div>
          ) : (
            filteredCases.map((demo) => (
              <div
                key={demo.id}
                onClick={() => {
                  onSelectCase(demo);
                  onClose();
                }}
                className="group cursor-pointer bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-md hover:shadow-teal-500/5 transition-all flex items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {demo.id}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-teal-50 text-teal-800 border border-teal-200">
                      {demo.category_hint}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-sky-50 text-sky-700 border border-sky-200">
                      {demo.language_hint}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {demo.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {demo.description}
                  </p>

                  {/* Transcript quote */}
                  <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 italic font-serif leading-relaxed line-clamp-2">
                    "{demo.transcript}"
                  </div>
                </div>

                {/* Right Arrow Action */}
                <div className="shrink-0 self-center">
                  <span className="p-2.5 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-teal-600 group-hover:text-white transition-all flex items-center justify-center shadow-xs">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Notice */}
        <div className="px-5 sm:px-6 py-3 bg-white border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">
              Transcripts test negations, contradictions, and multi-lingual triage safeguards.
            </span>
            <span className="sm:hidden">Synthetic non-identifiable data.</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
