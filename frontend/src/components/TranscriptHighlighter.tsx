import React, { useMemo } from 'react';
import type { EvidenceItem, NegationItem, ContradictionItem } from '../types';
import { Eye, FileText } from 'lucide-react';

interface TranscriptHighlighterProps {
  transcript: string;
  evidenceItems: EvidenceItem[];
  negations: NegationItem[];
  contradictions: ContradictionItem[];
  selectedExcerpt?: string | null;
  onSelectExcerpt?: (excerpt: string) => void;
  detectedLanguage?: string;
}

interface SpanMatch {
  start: number;
  end: number;
  type: 'evidence' | 'negation' | 'contradiction';
  label: string;
  excerpt: string;
}

export const TranscriptHighlighter: React.FC<TranscriptHighlighterProps> = ({
  transcript,
  evidenceItems,
  negations,
  contradictions,
  selectedExcerpt,
  onSelectExcerpt,
  detectedLanguage = 'Hinglish',
}) => {
  // Compute match offsets within the transcript
  const matches = useMemo(() => {
    const list: SpanMatch[] = [];
    const textLower = transcript.toLowerCase();

    // 1. Evidence items
    evidenceItems.forEach((ev) => {
      if (!ev.transcript_excerpt) return;
      const sub = ev.transcript_excerpt.toLowerCase();
      let startIdx = ev.start_char ?? textLower.indexOf(sub);
      if (startIdx !== -1 && startIdx + sub.length <= transcript.length) {
        list.push({
          start: startIdx,
          end: startIdx + sub.length,
          type: 'evidence',
          label: ev.finding,
          excerpt: ev.transcript_excerpt,
        });
      }
    });

    // 2. Negations
    negations.forEach((neg) => {
      if (!neg.statement) return;
      const sub = neg.statement.toLowerCase();
      const startIdx = textLower.indexOf(sub);
      if (startIdx !== -1) {
        list.push({
          start: startIdx,
          end: startIdx + sub.length,
          type: 'negation',
          label: `Negated: ${neg.negated_concept}`,
          excerpt: neg.statement,
        });
      }
    });

    // Sort by start index and filter overlapping spans
    list.sort((a, b) => a.start - b.start);
    const nonOverlapping: SpanMatch[] = [];
    let lastEnd = -1;

    for (const m of list) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    return nonOverlapping;
  }, [transcript, evidenceItems, negations, contradictions]);

  // Render tokens
  const renderedContent = useMemo(() => {
    if (!matches.length) {
      return <span>{transcript}</span>;
    }

    const segments: React.ReactNode[] = [];
    let cur = 0;

    matches.forEach((m, idx) => {
      // Preceding normal text
      if (m.start > cur) {
        segments.push(
          <span key={`text-${cur}`}>{transcript.slice(cur, m.start)}</span>
        );
      }

      // Highlighted match
      const matchedText = transcript.slice(m.start, m.end);
      const isSelected = selectedExcerpt && selectedExcerpt.toLowerCase().includes(matchedText.toLowerCase().trim());

      let badgeBg = 'bg-teal-100 text-teal-900 border-teal-300';
      if (m.type === 'negation') {
        badgeBg = 'bg-emerald-100 text-emerald-900 border-emerald-300';
      } else if (m.type === 'contradiction') {
        badgeBg = 'bg-amber-100 text-amber-900 border-amber-300';
      }

      segments.push(
        <mark
          key={`match-${idx}-${m.start}`}
          onClick={() => onSelectExcerpt && onSelectExcerpt(m.excerpt)}
          title={`Click to focus finding: ${m.label}`}
          className={`px-1.5 py-0.5 rounded border cursor-pointer transition-all duration-150 inline font-medium ${badgeBg} ${
            isSelected
              ? 'ring-2 ring-teal-500 ring-offset-1 font-semibold shadow-sm'
              : 'hover:opacity-90'
          }`}
        >
          {matchedText}
        </mark>
      );

      cur = m.end;
    });

    // Trailing normal text
    if (cur < transcript.length) {
      segments.push(
        <span key={`text-end-${cur}`}>{transcript.slice(cur)}</span>
      );
    }

    return segments;
  }, [transcript, matches, selectedExcerpt, onSelectExcerpt]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden break-words">
      {/* Viewer Header */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-700" />
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Original Transcript & Evidence Grounding
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-medium">
            Language: {detectedLanguage}
          </span>
          <span className="text-[11px] text-slate-600 font-mono">
            {transcript.length} chars
          </span>
        </div>
      </div>

      {/* Transcript Text Body */}
      <div className="p-4 sm:p-5 text-sm sm:text-base text-slate-800 leading-relaxed font-sans select-text">
        <div className="p-3.5 bg-slate-50/60 rounded-lg border border-slate-100 text-slate-800 whitespace-pre-wrap break-words overflow-hidden">
          {renderedContent}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center gap-4">
        <span className="font-medium text-slate-700 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          Interactive Excerpts:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-teal-200 border border-teal-400"></span>
          <span>Reported Finding</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-200 border border-emerald-400"></span>
          <span>Negation Guard (Action Denied)</span>
        </div>
        <span className="text-[11px] text-slate-600 ml-auto hidden sm:inline">
          Click any highlighted phrase to inspect evidence details
        </span>
      </div>
    </div>
  );
};
