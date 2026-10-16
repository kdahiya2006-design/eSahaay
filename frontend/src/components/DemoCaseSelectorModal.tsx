import React from 'react';
import type { DemoCase } from '../types';
import { X, BookOpen, ArrowRight } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-teal-500 rounded-lg text-white shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base leading-none truncate">
                Select Synthetic Demo Scenario
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1 truncate">
                Pre-configured test scenarios showcasing eSahaay safeguards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-md active:scale-95 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Demo Scenarios */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 sm:space-y-3.5 flex-1 divide-y divide-slate-100">
          {demoCases.map((demo) => (
            <div
              key={demo.id}
              onClick={() => {
                onSelectCase(demo);
                onClose();
              }}
              className="pt-3.5 first:pt-0 group cursor-pointer"
            >
              <div className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/20 transition-all flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {demo.id}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-50 text-teal-700 border border-teal-200">
                      {demo.category_hint}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      Language: {demo.language_hint}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {demo.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {demo.description}
                  </p>
                  <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic font-serif">
                    "{demo.transcript.slice(0, 110)}..."
                  </div>
                </div>

                <div className="shrink-0 self-center">
                  <span className="p-2 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-teal-600 group-hover:text-white transition-all flex items-center justify-center">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Notice */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>All transcripts are synthetic and non-identifiable.</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
