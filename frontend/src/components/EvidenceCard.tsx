import React from 'react';
import type { EvidenceItem } from '../types';
import { Quote, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface EvidenceCardProps {
  item: EvidenceItem;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  item,
  isSelected = false,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border p-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-teal-500 bg-teal-50/30 ring-2 ring-teal-500/20 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-sm font-semibold text-slate-900 leading-snug break-words">
          {item.finding}
        </h4>
        <span
          className={`shrink-0 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
            item.is_fact
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-purple-50 text-purple-700 border border-purple-200'
          }`}
        >
          {item.is_fact ? (
            <>
              <CheckCircle className="w-3 h-3 text-blue-600" />
              <span>Explicit Fact</span>
            </>
          ) : (
            <>
              <Info className="w-3 h-3 text-purple-600" />
              <span>AI Interpretation</span>
            </>
          )}
        </span>
      </div>

      {/* Verbatim Excerpt */}
      <div className="my-2.5 p-2.5 bg-slate-50 border-l-4 border-teal-500 rounded-r-md text-xs sm:text-sm text-slate-800 italic font-serif flex items-start gap-2">
        <Quote className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5 not-italic" />
        <span className="leading-relaxed break-words">"{item.transcript_excerpt}"</span>
      </div>

      {/* Multilingual Translation for Operator */}
      {(item.english_translation || item.hindi_translation) && (
        <div className="my-1.5 p-2 bg-slate-50/90 rounded-md border border-slate-200 text-xs text-slate-700 space-y-1">
          {item.english_translation && (
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-teal-700 shrink-0 text-[10px] uppercase tracking-wide">EN:</span>
              <span className="text-slate-800 font-sans italic break-words">"{item.english_translation}"</span>
            </div>
          )}
          {item.hindi_translation && (
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-sky-700 shrink-0 text-[10px] uppercase tracking-wide">HI:</span>
              <span className="text-slate-800 font-sans break-words">"{item.hindi_translation}"</span>
            </div>
          )}
        </div>
      )}

      {/* Relevance */}
      <div className="text-xs text-slate-600 mt-2 leading-relaxed break-words">
        <strong className="text-slate-800 font-medium">Relevance:</strong> {item.relevance}
      </div>

      {/* Uncertainty Note */}
      {item.uncertainty_note && (
        <div className="mt-2 text-xs bg-amber-50/70 text-amber-900 rounded-md p-2 border border-amber-200/80 flex items-start gap-1.5 leading-normal">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span className="break-words">
            <strong className="font-medium text-amber-950">Uncertainty:</strong> {item.uncertainty_note}
          </span>
        </div>
      )}
    </div>
  );
};
