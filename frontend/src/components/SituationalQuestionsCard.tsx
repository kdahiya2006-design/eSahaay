import React, { useState } from 'react';
import {
  HelpCircle,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Plus,
  ShieldAlert,
  MapPin,
  Activity,
  User
} from 'lucide-react';
import type { SituationalQuestion } from '../types';

export interface SituationalQuestionsCardProps {
  questions: SituationalQuestion[];
  onAddCustomQuestion?: (questionText: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  safety: ShieldAlert,
  location: MapPin,
  medical: Activity,
  perpetrator: User,
  general: HelpCircle,
};

export const SituationalQuestionsCard: React.FC<SituationalQuestionsCardProps> = ({
  questions: initialQuestions,
  onAddCustomQuestion,
}) => {
  const [questions, setQuestions] = useState<SituationalQuestion[]>(initialQuestions);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState('');

  // Sync state if prop changes
  React.useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const toggleAsked = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isAsked: !q.isAsked } : q))
    );
  };

  const handleSpeak = (q: SituationalQuestion, lang: 'en-IN' | 'hi-IN') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device.');
      return;
    }

    if (playingId === q.id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = lang === 'hi-IN' ? q.questionHi : q.questionEn;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang;
    utterance.rate = 0.95;

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(q.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const newQ: SituationalQuestion = {
      id: `custom-${Date.now()}`,
      category: 'general',
      questionEn: customInput.trim(),
      questionHi: customInput.trim(),
      isAsked: false,
      priority: 'high',
    };

    setQuestions((prev) => [newQ, ...prev]);
    if (onAddCustomQuestion) {
      onAddCustomQuestion(customInput.trim());
    }
    setCustomInput('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Suggested Operator Questions for Victim
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Situation-Aware
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Non-delaying, safety-focused clarifying questions adapted to the victim's situation (English & Hindi).
          </p>
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {questions.filter((q) => q.isAsked).length}/{questions.length} Asked
        </span>
      </div>

      {/* Questions List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {questions.map((q) => {
          const Icon = CATEGORY_ICONS[q.category] || HelpCircle;
          const isPlayingThis = playingId === q.id;
          const isCopiedThis = copiedId === q.id;

          return (
            <div
              key={q.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                q.isAsked
                  ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                  : q.priority === 'critical'
                  ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs'
              }`}
            >
              {/* Left: Checkbox & Question Content */}
              <div className="flex items-start gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={q.isAsked}
                  onChange={() => toggleAsked(q.id)}
                  className="mt-1 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-600 shrink-0 cursor-pointer"
                  title="Mark as Asked"
                />

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Icon className="w-3 h-3" />
                      {q.category}
                    </span>
                    {q.priority === 'critical' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                        Immediate Priority
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug ${
                      q.isAsked ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}
                  >
                    "{q.questionEn}"
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                    हिंदी: "{q.questionHi}"
                  </p>
                </div>
              </div>

              {/* Right: TTS Speech & Copy Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                {/* Speak English */}
                <button
                  type="button"
                  onClick={() => handleSpeak(q, 'en-IN')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1 active:scale-95 transition-all"
                  title="Speak question aloud in English"
                >
                  {isPlayingThis ? <VolumeX className="w-3.5 h-3.5 text-amber-500" /> : <Volume2 className="w-3.5 h-3.5 text-teal-600" />}
                  <span className="text-[10px] font-bold">EN</span>
                </button>

                {/* Speak Hindi */}
                <button
                  type="button"
                  onClick={() => handleSpeak(q, 'hi-IN')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1 active:scale-95 transition-all"
                  title="हिंदी में बोलें"
                >
                  <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-[10px] font-bold">HI</span>
                </button>

                {/* Copy */}
                <button
                  type="button"
                  onClick={() => handleCopy(`${q.questionEn} / ${q.questionHi}`, q.id)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs active:scale-95 transition-all"
                  title="Copy question text"
                >
                  {isCopiedThis ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Question Field */}
      <form onSubmit={handleAddQuestion} className="pt-2 flex items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Ask or note custom operator question..."
          className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="submit"
          disabled={!customInput.trim()}
          className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
};
