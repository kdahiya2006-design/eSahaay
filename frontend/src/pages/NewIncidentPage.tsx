import React, { useState, useEffect, useRef } from 'react';
import type {
  IncidentAnalysis,
  DemoCase,
  HumanReviewUpdate
} from '../types';
import { api } from '../services/api';
import { TranscriptHighlighter } from '../components/TranscriptHighlighter';
import { EvidenceCard } from '../components/EvidenceCard';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { HumanReviewModal } from '../components/HumanReviewModal';
import { DemoCaseSelectorModal } from '../components/DemoCaseSelectorModal';
import {
  BookOpen,
  Trash2,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Edit3,
  Download,
  Copy,
  Sparkles,
  MapPin,
  Users,
  Languages,
  Globe,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';

const SPEECH_LANG_MAP: Record<string, string> = {
  'Auto-detect': 'hi-IN',
  'Hindi': 'hi-IN',
  'English': 'en-IN',
  'Hinglish': 'hi-IN',
  'Bengali': 'bn-IN',
  'Marathi': 'mr-IN',
  'Telugu': 'te-IN',
  'Tamil': 'ta-IN',
  'Gujarati': 'gu-IN',
  'Urdu': 'ur-IN',
  'Kannada': 'kn-IN',
  'Odia': 'or-IN',
  'Malayalam': 'ml-IN',
  'Punjabi': 'pa-IN',
  'Assamese': 'as-IN',
  'Maithili': 'hi-IN',
  'Bhojpuri': 'hi-IN',
  'Konkani': 'kok-IN',
  'Sindhi': 'sd-IN',
  'Nepali': 'ne-NP',
  'Kashmiri': 'ks-IN',
  'Dogri': 'hi-IN',
  'Santali': 'hi-IN',
  'Manipuri': 'hi-IN',
  'Bodo': 'hi-IN',
  'Sanskrit': 'sa-IN',
};

interface NewIncidentPageProps {
  initialCase?: IncidentAnalysis | null;
  initialTranscript?: string;
}

export const NewIncidentPage: React.FC<NewIncidentPageProps> = ({
  initialCase,
  initialTranscript = '',
}) => {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [languageHint, setLanguageHint] = useState('Auto-detect');
  const [timeHint, setTimeHint] = useState('');
  const [operatorNotes, setOperatorNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<IncidentAnalysis | null>(initialCase || null);
  const [selectedExcerpt, setSelectedExcerpt] = useState<string | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<'original' | 'english' | 'hindi' | 'hinglish' | 'compare'>('original');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoCases, setDemoCases] = useState<DemoCase[]>([]);
  const [currentReview, setCurrentReview] = useState<HumanReviewUpdate | null>(null);

  // Speech Recognition & Synthesis states
  const [isListening, setIsListening] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<'english' | 'hindi' | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'Voice dictation requires a browser with Web Speech API support (Google Chrome, Microsoft Edge, Safari, or Brave).'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = SPEECH_LANG_MAP[languageHint] || 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript + ' ';
          }
        }
        if (finalChunk.trim()) {
          setTranscript((prev) => (prev ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone permissions in your browser settings.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handlePlayAudio = (text: string, lang: string, type: 'english' | 'hindi') => {
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
    utterance.lang = lang; // 'en-IN' or 'hi-IN'
    utterance.onend = () => setPlayingAudio(null);
    utterance.onerror = () => setPlayingAudio(null);
    setPlayingAudio(type);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Load demo cases list on mount
  useEffect(() => {
    api.getDemoCases().then(setDemoCases).catch(console.error);
  }, []);

  const handleSelectDemo = (demo: DemoCase) => {
    stopListening();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingAudio(null);
    setTranscript(demo.transcript);
    setLanguageHint(demo.language_hint || 'Auto-detect');
    setTimeHint(demo.incident_time_hint || '');
    setOperatorNotes(demo.operator_notes || '');
    setAnalysis(null);
    setCurrentReview(null);
  };

  const handleClear = () => {
    stopListening();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingAudio(null);
    setTranscript('');
    setTimeHint('');
    setOperatorNotes('');
    setAnalysis(null);
    setCurrentReview(null);
    setSelectedExcerpt(null);
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!transcript.trim() || transcript.trim().length < 5) return;

    setLoading(true);
    setCurrentReview(null);
    try {
      const res = await api.analyzeTranscript({
        transcript: transcript.trim(),
        language_hint: languageHint,
        incident_time_hint: timeHint.trim() || undefined,
        operator_notes: operatorNotes.trim() || undefined,
      });
      setAnalysis(res);
      // Select first evidence excerpt by default
      if (res.evidence_items.length > 0) {
        setSelectedExcerpt(res.evidence_items[0].transcript_excerpt);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred during transcript analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReview = async (review: HumanReviewUpdate) => {
    const updatedCase = await api.saveReview(review);
    setCurrentReview(review);
    if (updatedCase?.analysis) {
      setAnalysis(updatedCase.analysis);
    }
  };

  const exportJSON = () => {
    if (!analysis) return;
    const blob = new Blob(
      [JSON.stringify({ analysis, review: currentReview, transcript }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eSahaay_Report_${analysis.case_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySummary = () => {
    if (!analysis) return;
    const text = `eSahaay Triage Report [${analysis.case_id}]
Provisional Urgency: ${currentReview?.reviewed_urgency || analysis.provisional_urgency}
Categories: ${(currentReview?.reviewed_categories || analysis.incident_categories).join(', ')}
Summary: ${analysis.incident_summary}
Location: ${analysis.location.mentioned_location || 'Unknown'} (Confidence: ${analysis.location.confidence})
Missing Info: ${analysis.missing_information.join('; ')}
Support Recs: ${analysis.support_recommendations.map(s => s.category).join(', ')}`;
    navigator.clipboard.writeText(text);
    alert('Case summary copied to clipboard!');
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 md:space-y-8 max-w-7xl mx-auto animate-fadeIn">
      {/* Emergency Protocol Banner */}
      <EmergencyBanner
        immediateDanger={analysis ? analysis.immediate_danger_flag : false}
      />

      {/* Transcript Input Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Caller Transcript & Complaint Input</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste or type verbatim transcript in Hindi, English, or Hinglish for automated triage and evidence extraction.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDemoModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-700" />
              <span>Load Demo Case</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs transition-colors active:scale-95"
              title="Clear form"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Caller Transcript <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs ${
                    isListening
                      ? 'bg-red-50 text-red-700 border border-red-300 animate-pulse'
                      : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start live voice dictation in selected Indian language'}
                >
                  {isListening ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                      <MicOff className="w-3.5 h-3.5 text-red-600" />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-teal-600" />
                      <span>Voice Dictate</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-slate-500 font-mono">
                  {transcript.length} characters
                </span>
              </div>
            </div>
            <textarea
              rows={4}
              required
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. Aaj college ke bahar bhi tha. Teesra din hai jab wo meri scooty ke peeche aa raha hai. Usne bola dekh lunga..."
              className="w-full p-3 sm:p-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden bg-slate-50/50 hover:bg-white transition-all font-sans"
            />
            {isListening && (
              <div className="mt-2 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs animate-fadeIn">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0"></span>
                <span className="font-semibold shrink-0">Live Voice Dictation:</span>
                <span className="truncate">
                  Listening in <strong>{languageHint}</strong>... Speak clearly into your microphone.
                </span>
                <button
                  type="button"
                  onClick={stopListening}
                  className="ml-auto text-[11px] font-bold text-red-700 underline hover:text-red-900 shrink-0"
                >
                  Stop
                </button>
              </div>
            )}
          </div>

          {/* Metadata Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                <span>Spoken Language (All India)</span>
              </label>
              <select
                value={languageHint}
                onChange={(e) => setLanguageHint(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden font-sans"
              >
                <optgroup label="Auto-Detection">
                  <option value="Auto-detect">Auto-detect (All 22+ Indian Languages)</option>
                </optgroup>
                <optgroup label="Most Widely Spoken Languages">
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="English">English</option>
                  <option value="Hinglish">Hinglish (Hindi in Latin script)</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  <option value="Urdu">Urdu (اردو)</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                  <option value="Malayalam">Malayalam (മലയാളം)</option>
                  <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="Assamese">Assamese (অসমীয়া)</option>
                  <option value="Maithili">Maithili (मैथिली)</option>
                </optgroup>
                <optgroup label="Other Scheduled & Regional Languages">
                  <option value="Bhojpuri">Bhojpuri (भोजपुरी)</option>
                  <option value="Konkani">Konkani (कोंकणी)</option>
                  <option value="Sindhi">Sindhi (सिंधी / سنڌي)</option>
                  <option value="Nepali">Nepali (नेपाली)</option>
                  <option value="Kashmiri">Kashmiri (कश्मीरी / کٲشُر)</option>
                  <option value="Dogri">Dogri (डोगरी)</option>
                  <option value="Santali">Santali (ᱥᱟᱱᱛᱟᱲᱤ)</option>
                  <option value="Manipuri">Manipuri / Meitei (মৈতৈলোন্)</option>
                  <option value="Bodo">Bodo (बड़ो)</option>
                  <option value="Sanskrit">Sanskrit (संस्कृतम्)</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Incident Time / Date (Optional)
              </label>
              <input
                type="text"
                value={timeHint}
                onChange={(e) => setTimeHint(e.target.value)}
                placeholder="e.g. 15 minutes ago, Today 4 PM"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Operator Notes (Optional)
              </label>
              <input
                type="text"
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                placeholder="Initial caller demeanor or context"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500 hidden sm:inline">
              eSahaay validates facts, negations, and missing locations.
            </span>
            <button
              type="submit"
              disabled={loading || transcript.trim().length < 5}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed sm:ml-auto"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing Incident...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Analyze Incident</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Analysis Output Section */}
      {analysis && (
        <div className="space-y-4 sm:space-y-6">
          {/* Top Triage Summary Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    Case {analysis.case_id}
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[11px] sm:text-xs text-slate-500">Provisional:</span>
                    <UrgencyBadge urgency={analysis.provisional_urgency} size="sm" />
                  </div>
                  {currentReview && (
                    <div className="flex items-center gap-1.5 bg-teal-50 text-teal-900 border border-teal-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Operator: {currentReview.reviewed_urgency}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 pt-1 leading-relaxed">
                  {analysis.incident_summary}
                </p>
              </div>

              {/* Operator Actions */}
              <div className="shrink-0 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{currentReview ? 'Edit Review' : 'Human Operator Review'}</span>
                </button>
                <button
                  type="button"
                  onClick={copySummary}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs transition-colors active:scale-95"
                  title="Copy Report Summary"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={exportJSON}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs transition-colors active:scale-95"
                  title="Export JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Meta Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-3 sm:pt-4 text-xs border-t border-slate-100">
              <div className="space-y-0.5">
                <span className="text-slate-500 flex items-center gap-1 text-[11px] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Location:
                </span>
                <p className="font-semibold text-slate-800 truncate" title={analysis.location.mentioned_location || 'Not Specified'}>
                  {analysis.location.mentioned_location || 'Not Specified'}
                </p>
                <span
                  className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-medium ${
                    analysis.location.is_vague_or_incomplete
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {analysis.location.confidence}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 flex items-center gap-1 text-[11px] font-medium">
                  <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Spoken Language:
                </span>
                <p className="font-semibold text-slate-800 truncate" title={analysis.detected_language}>
                  {analysis.detected_language}
                </p>
                <span className="text-[10px] text-teal-700 font-medium block">
                  {analysis.detected_language_script ? `${analysis.detected_language_script} Script` : 'Tri-Lingual Converted'}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 flex items-center gap-1 text-[11px] font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Involved Person:
                </span>
                <p className="font-semibold text-slate-800 truncate">
                  {analysis.people_or_relationships || 'Unknown Individual'}
                </p>
                <span className="text-[10px] text-slate-500 block">Explicitly Stated</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 flex items-center gap-1 text-[11px] font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Categories:
                </span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {(currentReview?.reviewed_categories || analysis.incident_categories).map((cat) => (
                    <span
                      key={cat}
                      className="px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-slate-100 text-slate-700"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tri-Lingual Language Converter Banner */}
          {analysis.translations && (
            <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 text-white rounded-2xl p-4 sm:p-5 border border-teal-800/60 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/30 shrink-0 mt-0.5">
                  <Languages className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-wide">
                      Multilingual Helpline Comprehension Console
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30 font-semibold uppercase tracking-wider">
                      Spoken: {analysis.detected_language} {analysis.detected_language_script ? `(${analysis.detected_language_script})` : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Spoken complaint automatically converted to <strong>English</strong>, <strong>Hindi</strong>, and <strong>Hinglish</strong> for operator clarity.
                  </p>
                </div>
              </div>

              {/* Quick Copy & Audio Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => handlePlayAudio(analysis.translations?.english || '', 'en-IN', 'english')}
                  className="flex-1 md:flex-initial px-3 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 text-xs font-semibold border border-teal-500/40 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
                  title="Listen to English read-aloud"
                >
                  {playingAudio === 'english' ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-amber-300" />
                      <span>Stop Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen EN</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(analysis.translations?.english || '', 'English')}
                  className="flex-1 md:flex-initial px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-teal-200 text-xs font-semibold border border-teal-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
                  title="Copy English Translation"
                >
                  {copiedField === 'English' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'English' ? 'Copied EN' : 'Copy English'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePlayAudio(analysis.translations?.hindi || '', 'hi-IN', 'hindi')}
                  className="flex-1 md:flex-initial px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 text-xs font-semibold border border-sky-500/40 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
                  title="हिंदी में सुनें"
                >
                  {playingAudio === 'hindi' ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-amber-300" />
                      <span>रोकें</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>सुनें HI</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(analysis.translations?.hindi || '', 'Hindi')}
                  className="flex-1 md:flex-initial px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sky-200 text-xs font-semibold border border-sky-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
                  title="Copy Hindi Translation"
                >
                  {copiedField === 'Hindi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'Hindi' ? 'Copied HI' : 'Copy Hindi'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyText(analysis.translations?.hinglish || '', 'Hinglish')}
                  className="flex-1 md:flex-initial px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-semibold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
                  title="Copy Hinglish Translation"
                >
                  {copiedField === 'Hinglish' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'Hinglish' ? 'Copied Hinglish' : 'Copy Hinglish'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Evidence-Based Reporting Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Original Transcript with Highlights & Language Switcher Tabs */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Language Switcher Tabs */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Globe className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>View Transcript As:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveLangTab('original')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        activeLangTab === 'original'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Original ({analysis.detected_language})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLangTab('english')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        activeLangTab === 'english'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLangTab('hindi')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        activeLangTab === 'hindi'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Hindi (हिंदी)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLangTab('hinglish')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        activeLangTab === 'hinglish'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Hinglish
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLangTab('compare')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        activeLangTab === 'compare'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Side-by-Side
                    </button>
                  </div>
                </div>

                {/* Tab Views */}
                {activeLangTab === 'original' && (
                  <TranscriptHighlighter
                    transcript={transcript}
                    evidenceItems={analysis.evidence_items}
                    negations={analysis.negations_detected}
                    contradictions={analysis.contradictions_detected}
                    selectedExcerpt={selectedExcerpt}
                    onSelectExcerpt={setSelectedExcerpt}
                    detectedLanguage={analysis.detected_language}
                  />
                )}

                {activeLangTab === 'english' && (
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                        Full English Translation (Operator Standard)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(analysis.translations?.english || '', 'en-IN', 'english')}
                          className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 active:scale-95 transition-transform"
                          title="Listen to English read-aloud"
                        >
                          {playingAudio === 'english' ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-amber-600" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(analysis.translations?.english || '', 'English')}
                          className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          {copiedField === 'English' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'English' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed font-sans select-text">
                      "{analysis.translations?.english || 'Translation processing...'}"
                    </div>
                    {analysis.translations?.detected_dialect_or_notes && (
                      <p className="text-[11px] text-slate-500 italic">
                        Dialect note: {analysis.translations.detected_dialect_or_notes}
                      </p>
                    )}
                  </div>
                )}

                {activeLangTab === 'hindi' && (
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                        पूर्ण हिंदी अनुवाद (देवनागरी लिपि)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(analysis.translations?.hindi || '', 'hi-IN', 'hindi')}
                          className="text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 active:scale-95 transition-transform"
                          title="हिंदी में सुनें"
                        >
                          {playingAudio === 'hindi' ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-amber-600" />
                              <span>रोकें</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>सुनें</span>
                            </>
                          )}
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(analysis.translations?.hindi || '', 'Hindi')}
                          className="text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          {copiedField === 'Hindi' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'Hindi' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed font-sans select-text">
                      "{analysis.translations?.hindi || 'हिंदी अनुवाद उपलब्ध कराया जा रहा है...'}"
                    </div>
                  </div>
                )}

                {activeLangTab === 'hinglish' && (
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Hinglish Transliteration (Roman Script)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(analysis.translations?.hinglish || '', 'Hinglish')}
                        className="text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        {copiedField === 'Hinglish' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'Hinglish' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed font-sans select-text">
                      "{analysis.translations?.hinglish || 'Hinglish translation available...'}"
                    </div>
                  </div>
                )}

                {activeLangTab === 'compare' && (
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="font-bold text-slate-700 uppercase tracking-wide block">
                          Original Spoken ({analysis.detected_language})
                        </span>
                        <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-sans break-words select-text">
                          "{transcript}"
                        </p>
                      </div>

                      <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200 space-y-1.5">
                        <span className="font-bold text-teal-800 uppercase tracking-wide block">
                          English Translation
                        </span>
                        <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-sans break-words select-text">
                          "{analysis.translations?.english || 'Translation available...'}"
                        </p>
                      </div>
                    </div>

                    {analysis.translations?.hindi && (
                      <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-200 space-y-1 text-xs">
                        <span className="font-bold text-sky-800 uppercase tracking-wide block">
                          Hindi Translation (हिंदी)
                        </span>
                        <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-sans break-words select-text">
                          "{analysis.translations.hindi}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Urgency Rationale Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Provisional Urgency Assessment Reasons</span>
                </h4>
                <ul className="space-y-1 text-xs text-slate-700">
                  {analysis.urgency_reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Extracted Evidence Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Verbatim Evidence Grounding ({analysis.evidence_items.length} Findings)
                </h4>
                <span className="text-[11px] text-slate-600">
                  Select card to focus transcript excerpt
                </span>
              </div>

              <div className="space-y-3">
                {analysis.evidence_items.map((item, idx) => (
                  <EvidenceCard
                    key={idx}
                    item={item}
                    isSelected={selectedExcerpt === item.transcript_excerpt}
                    onSelect={() => setSelectedExcerpt(item.transcript_excerpt)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Operator Action Steps & Follow-up Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Suggested Follow-up Questions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-teal-600" />
                <span>Suggested Operator Follow-Up Questions</span>
              </h4>
              <p className="text-xs text-slate-500">
                Non-delaying clarifying questions focused strictly on caller safety and missing landmarks:
              </p>
              <div className="space-y-2">
                {analysis.suggested_follow_up_questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-800 flex items-start gap-2.5 font-medium"
                  >
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-mono text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-snug pt-0.5">"{q}"</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Recommendations */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-600" />
                <span>Potential Support Categories (Operator Consideration)</span>
              </h4>
              <p className="text-xs text-slate-500">
                Options based on evidence. Subject to caller consent and verification:
              </p>
              <div className="space-y-2.5">
                {analysis.support_recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
                  >
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span>{rec.category}</span>
                      <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-medium">
                        Suggested
                      </span>
                    </div>
                    <p className="text-slate-600">{rec.relevance_reason}</p>
                    {rec.uncertainty && (
                      <p className="text-[11px] text-amber-800 italic">
                        Caveat: {rec.uncertainty}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Selector Modal */}
      <DemoCaseSelectorModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        demoCases={demoCases}
        onSelectCase={handleSelectDemo}
      />

      {/* Human Review Modal */}
      {analysis && (
        <HumanReviewModal
          analysis={analysis}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSaveReview={handleSaveReview}
          existingReview={currentReview}
        />
      )}
    </div>
  );
};
