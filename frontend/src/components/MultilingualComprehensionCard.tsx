import React, { useState } from 'react';
import {
  Languages,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { ALL_22_INDIAN_LANGUAGES, translateToEnglishAndHindi } from '../data/languages';
import type { TranscriptTranslations } from '../types';

export interface MultilingualComprehensionCardProps {
  transcript: string;
  detectedLanguage: string;
  detectedScript?: string | null;
  translations?: TranscriptTranslations | null;
  onLanguageSelect?: (langName: string) => void;
  onApplySample?: (sampleText: string, langName: string) => void;
}

export const MultilingualComprehensionCard: React.FC<MultilingualComprehensionCardProps> = ({
  transcript,
  detectedLanguage,
  detectedScript,
  translations: externalTranslations,
  onLanguageSelect,
  onApplySample,
}) => {
  const [activeTab, setActiveTab] = useState<'dual' | 'english' | 'hindi' | 'original'>('dual');
  const [playingAudio, setPlayingAudio] = useState<'english' | 'hindi' | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Compute fallback/live translations if external is not yet provided or if user changes text
  const computed = React.useMemo(() => {
    return translateToEnglishAndHindi(transcript, detectedLanguage);
  }, [transcript, detectedLanguage]);

  const effectiveTranslations: TranscriptTranslations = externalTranslations || {
    english: computed.english,
    hindi: computed.hindi,
    hinglish: computed.hinglish,
    detected_dialect_or_notes: computed.dialectNotes,
  };

  const handlePlayAudio = (text: string, lang: 'en-IN' | 'hi-IN', type: 'english' | 'hindi') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis audio is not supported in this browser.');
      return;
    }
    if (playingAudio === type) {
      window.speechSynthesis.cancel();
      setPlayingAudio(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.onend = () => setPlayingAudio(null);
    utterance.onerror = () => setPlayingAudio(null);
    setPlayingAudio(type);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4 animate-fadeIn">
      {/* Top Bar: Title & 22-Languages Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <Languages className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              22-Language Helpline Translation & Comprehension Console
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              Dual Output: EN + HI
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automatically translates victim testimony from any of India's 22 spoken languages directly into standardized <strong>English</strong> and <strong>Hindi</strong> for emergency responders.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('dual')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'dual'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Side-by-Side (EN + HI)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('english')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'english'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            English Only
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hindi')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'hindi'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            हिंदी (Devanagari)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('original')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'original'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Original Spoken
          </button>
        </div>
      </div>

      {/* Translations Content Area */}
      {activeTab === 'dual' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: English Translation Box */}
          <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  English Translation (Official Record)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(effectiveTranslations.english, 'en-IN', 'english')}
                    className="p-1 px-2 rounded-lg bg-teal-100 dark:bg-teal-900/60 hover:bg-teal-200 dark:hover:bg-teal-800 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                    title="Listen to English read-aloud"
                  >
                    {playingAudio === 'english' ? <VolumeX className="w-3.5 h-3.5 text-amber-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>Listen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyText(effectiveTranslations.english, 'English')}
                    className="p-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                  >
                    {copiedField === 'English' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'English' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans select-text">
                "{effectiveTranslations.english || 'Translation awaiting complaint input...'}"
              </p>
            </div>
            <span className="text-[10px] text-teal-700 dark:text-teal-400 font-mono">
              Format: Standard Indian English Triage Transcript
            </span>
          </div>

          {/* Right: Hindi Translation Box */}
          <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  हिंदी अनुवाद (फील्ड पीसीआर व कंट्रोल रूम)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(effectiveTranslations.hindi, 'hi-IN', 'hindi')}
                    className="p-1 px-2 rounded-lg bg-sky-100 dark:bg-sky-900/60 hover:bg-sky-200 dark:hover:bg-sky-800 text-sky-800 dark:text-sky-200 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                    title="हिंदी में सुनें"
                  >
                    {playingAudio === 'hindi' ? <VolumeX className="w-3.5 h-3.5 text-amber-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>सुनें</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyText(effectiveTranslations.hindi, 'Hindi')}
                    className="p-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-sky-800 dark:text-sky-200 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                  >
                    {copiedField === 'Hindi' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'Hindi' ? 'कॉपी' : 'कॉपी'}</span>
                  </button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans select-text">
                "{effectiveTranslations.hindi || 'हिंदी अनुवाद उपलब्ध कराया जा रहा है...'}"
              </p>
            </div>
            <span className="text-[10px] text-sky-700 dark:text-sky-400 font-mono">
              लिपि: देवनागरी (Devanagari Script - Field Ready)
            </span>
          </div>
        </div>
      )}

      {activeTab === 'english' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-teal-200/60 dark:border-teal-800/60">
            <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
              Full English Translation (Operator Standard)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePlayAudio(effectiveTranslations.english, 'en-IN', 'english')}
                className="text-teal-700 dark:text-teal-300 font-semibold text-xs flex items-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen Audio</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyText(effectiveTranslations.english, 'English')}
                className="text-teal-700 dark:text-teal-300 font-semibold text-xs flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy English</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed select-text">
            "{effectiveTranslations.english}"
          </p>
        </div>
      )}

      {activeTab === 'hindi' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-sky-200/60 dark:border-sky-800/60">
            <span className="text-xs font-bold text-sky-900 dark:text-sky-200">
              पूर्ण हिंदी अनुवाद (देवनागरी लिपि)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePlayAudio(effectiveTranslations.hindi, 'hi-IN', 'hindi')}
                className="text-sky-700 dark:text-sky-300 font-semibold text-xs flex items-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>ऑडियो सुनें</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyText(effectiveTranslations.hindi, 'Hindi')}
                className="text-sky-700 dark:text-sky-300 font-semibold text-xs flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>हिंदी कॉपी करें</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed select-text">
            "{effectiveTranslations.hindi}"
          </p>
        </div>
      )}

      {activeTab === 'original' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Original Caller Testimony ({detectedLanguage} {detectedScript ? `• ${detectedScript}` : ''})
            </span>
            <button
              type="button"
              onClick={() => handleCopyText(transcript, 'Original')}
              className="text-slate-600 dark:text-slate-300 hover:text-teal-600 font-semibold flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Original</span>
            </button>
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed select-text">
            "{transcript}"
          </p>
        </div>
      )}

      {/* 22 Indian Languages Quick Picker Bar */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>Select from all 22 Indian Scheduled Languages (Sample Distress Transcripts):</span>
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            All 22 Languages Supported
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {ALL_22_INDIAN_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                if (onApplySample) {
                  onApplySample(lang.sampleEmergencyText, lang.name);
                } else if (onLanguageSelect) {
                  onLanguageSelect(lang.name);
                }
              }}
              className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all active:scale-95 ${
                detectedLanguage === lang.name
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-slate-750'
              }`}
              title={`Load sample emergency call in ${lang.name} (${lang.nativeName})`}
            >
              <span>{lang.name}</span>
              <span className="text-[10px] opacity-75 ml-1 font-normal font-sans">({lang.nativeName})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
