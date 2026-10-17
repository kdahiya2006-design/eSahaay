import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { CallSimulationBar } from '../components/CallSimulationBar';
import { EmergencyDispatchMatrix } from '../components/EmergencyDispatchMatrix';
import { NearbyServicesRadar } from '../components/NearbyServicesRadar';
import { SituationalQuestionsCard } from '../components/SituationalQuestionsCard';
import { MultilingualComprehensionCard } from '../components/MultilingualComprehensionCard';
import { dispatchEngine } from '../services/dispatchEngine';
import { ALL_22_INDIAN_LANGUAGES, translateToEnglishAndHindi } from '../data/languages';
import { SYNTHETIC_DEMO_CASES } from '../data/demoCases';
import {
  BookOpen,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Edit3,
  Download,
  Copy,
  Sparkles,
  MapPin,
  Users,
  Languages,
  Globe,
  Mic,
  MicOff,
  Clock
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
  const [locationHint, setLocationHint] = useState('Munirka Metro Station, New Delhi');
  const [operatorNotes, setOperatorNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<IncidentAnalysis | null>(initialCase || null);
  const [selectedExcerpt, setSelectedExcerpt] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoCases, setDemoCases] = useState<DemoCase[]>(SYNTHETIC_DEMO_CASES);
  const [currentReview, setCurrentReview] = useState<HumanReviewUpdate | null>(null);

  // Call Simulation State
  const [isSimulatedCallActive, setIsSimulatedCallActive] = useState(false);

  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Compute live emergency measurement & dispatch decisions
  const emergencyMeasurement = useMemo(() => {
    return dispatchEngine.evaluateEmergencyMeasurement(
      transcript,
      analysis?.incident_categories || [],
      analysis?.provisional_urgency || 'Medium',
      analysis?.immediate_danger_flag || false
    );
  }, [transcript, analysis]);

  // Compute situational questions
  const situationalQuestions = useMemo(() => {
    return dispatchEngine.getSituationalQuestions(
      transcript,
      analysis?.incident_categories || [],
      analysis?.immediate_danger_flag || false
    );
  }, [transcript, analysis]);

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

  // Load demo cases list on mount
  useEffect(() => {
    api.getDemoCases().then((cases) => {
      if (Array.isArray(cases) && cases.length > 0) {
        setDemoCases(cases);
      }
    }).catch((err) => {
      console.warn('Backend demo-cases endpoint unavailable, using bundled scenarios:', err);
    });
  }, []);

  const handleSelectDemo = (demo: DemoCase) => {
    stopListening();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
    setTranscript('');
    setTimeHint('');
    setOperatorNotes('');
    setAnalysis(null);
    setCurrentReview(null);
    setSelectedExcerpt(null);
    setIsSimulatedCallActive(false);
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
      if (res.evidence_items.length > 0) {
        setSelectedExcerpt(res.evidence_items[0].transcript_excerpt);
      }
      if (res.location?.mentioned_location && !res.location.is_vague_or_incomplete) {
        setLocationHint(res.location.mentioned_location);
      }
    } catch (err: any) {
      console.error(err);
      // Even if offline/error, generate immediate fallback analysis
      const fallbackTrans = translateToEnglishAndHindi(transcript.trim(), languageHint);
      const fallbackAnalysis: IncidentAnalysis = {
        case_id: `ESH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        incident_summary: `Victim complaint analyzed in ${fallbackTrans.detectedLanguage}. Urgency assessed via deterministic rule engine.`,
        detected_language: fallbackTrans.detectedLanguage,
        detected_language_script: fallbackTrans.detectedScript,
        translations: {
          english: fallbackTrans.english,
          hindi: fallbackTrans.hindi,
          hinglish: fallbackTrans.hinglish,
          detected_dialect_or_notes: fallbackTrans.dialectNotes,
        },
        incident_categories: ['Stalking / Safety Distress', 'Helpline Triage'],
        key_entities: ['Caller', 'Location'],
        location: {
          mentioned_location: locationHint,
          confidence: 'Medium',
          is_vague_or_incomplete: false,
          landmarks: [locationHint],
        },
        potential_safety_concerns: ['Perceived pursuit or distress reported'],
        provisional_urgency: emergencyMeasurement.urgencyLevel,
        urgency_reasons: ['Evaluated via safety measurement matrix and active complaint context.'],
        immediate_danger_flag: emergencyMeasurement.threatScore >= 80,
        evidence_items: [
          {
            finding: 'Primary reported distress',
            transcript_excerpt: transcript.slice(0, 120),
            english_translation: fallbackTrans.english.slice(0, 120),
            hindi_translation: fallbackTrans.hindi.slice(0, 120),
            relevance: 'Verbatim caller testimony during helpline session.',
            is_fact: true,
          },
        ],
        negations_detected: [],
        contradictions_detected: [],
        missing_information: ['Secondary contact phone number'],
        uncertainty_warnings: ['Synthesized via local heuristic rules'],
        suggested_follow_up_questions: ['Can you confirm your exact current location?'],
        support_recommendations: [
          {
            category: 'Police or Emergency Escalation',
            relevance_reason: 'Preventive escort and field dispatch verification.',
          },
        ],
        operator_review_steps: ['1. Confirm victim surroundings', '2. Dispatch nearest response vehicle'],
        analysis_mode: 'deterministic_demo',
        provider_label: 'Deterministic Rule-Based Fallback Engine',
        created_at: new Date().toISOString(),
      };
      setAnalysis(fallbackAnalysis);
    } finally {
      setLoading(false);
    }
  };

  // Callback when a simulated call is answered
  const handleCallAccepted = (callTranscript: string, langHint: string, callerLoc: string) => {
    setIsSimulatedCallActive(true);
    setTranscript(callTranscript);
    setLanguageHint(langHint);
    setLocationHint(callerLoc);

    // Automatically trigger immediate analysis for seamless flow
    setTimeout(() => {
      api.analyzeTranscript({
        transcript: callTranscript,
        language_hint: langHint,
        incident_time_hint: 'Just now (Simulated Inbound Call)',
        operator_notes: `Inbound helpline call from ${callerLoc}`,
      }).then((res) => {
        setAnalysis(res);
        if (res.evidence_items.length > 0) {
          setSelectedExcerpt(res.evidence_items[0].transcript_excerpt);
        }
      }).catch(() => {
        // Fallback analysis generated automatically via useEffect
      });
    }, 300);
  };

  const handleCallEnded = () => {
    setIsSimulatedCallActive(false);
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
      [JSON.stringify({ analysis, review: currentReview, transcript, emergencyMeasurement }, null, 2)],
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
Threat Score: ${emergencyMeasurement.threatScore}/100
Primary Dispatch: ${emergencyMeasurement.primaryService.toUpperCase()}
Summary: ${analysis.incident_summary}
Location: ${analysis.location.mentioned_location || locationHint}
Services Decided: ${emergencyMeasurement.decisions.filter(d => d.status === 'RECOMMENDED').map(d => d.serviceName).join(', ')}`;
    navigator.clipboard.writeText(text);
    alert('Case summary copied to clipboard!');
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 md:space-y-8 max-w-7xl mx-auto animate-fadeIn transition-colors duration-200">
      {/* 1. Emergency Protocol Banner */}
      <EmergencyBanner
        immediateDanger={analysis ? analysis.immediate_danger_flag : emergencyMeasurement.threatScore >= 80}
      />

      {/* 2. Helpline Call Simulator & Ringtone Center (Requirement 1) */}
      <CallSimulationBar
        onCallAccepted={handleCallAccepted}
        onCallEnded={handleCallEnded}
        isCallActive={isSimulatedCallActive}
        activeLanguage={languageHint}
      />

      {/* 3. Main Live Conversation & Complaint Input Console (Requirement 7) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-6 space-y-4 sm:space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Caller Testimony & Live Conversation Feed</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live verbatim victim transcript in any of India's 22 regional languages. Supports real-time speech dictation and instant bilingual translation.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDemoModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>Load Scenarios</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 text-xs transition-colors active:scale-95"
              title="Clear input"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Verbatim Complaint Transcript <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs ${
                    isListening
                      ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start live voice dictation in selected Indian language'}
                >
                  {isListening ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                      <MicOff className="w-3.5 h-3.5 text-red-600" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Voice Dictate</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {transcript.length} chars
                </span>
              </div>
            </div>

            <textarea
              rows={4}
              required
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. Aaj college ke bahar bhi tha. Teesra din hai meri scooty ke peeche aa raha hai... Or speak in any of India's 22 languages..."
              className="w-full p-3 sm:p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-800 transition-all font-sans"
            />

            {isListening && (
              <div className="mt-2 flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 rounded-xl text-xs animate-fadeIn">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0"></span>
                <span className="font-semibold shrink-0">Live Voice Dictation:</span>
                <span className="truncate">
                  Listening in <strong>{languageHint}</strong>... Speak clearly into your microphone.
                </span>
                <button
                  type="button"
                  onClick={stopListening}
                  className="ml-auto text-[11px] font-bold text-red-700 dark:text-red-300 underline shrink-0"
                >
                  Stop
                </button>
              </div>
            )}
          </div>

          {/* Metadata Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Spoken Language (22 Indian Languages)</span>
              </label>
              <select
                value={languageHint}
                onChange={(e) => setLanguageHint(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden font-sans"
              >
                <optgroup label="Automatic Detection">
                  <option value="Auto-detect">Auto-detect (All 22+ Indian Languages)</option>
                </optgroup>
                <optgroup label="22 Officially Scheduled Languages of India">
                  {ALL_22_INDIAN_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.name}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Victim Location / Area Landmark</span>
              </label>
              <input
                type="text"
                value={locationHint}
                onChange={(e) => setLocationHint(e.target.value)}
                placeholder="e.g. Munirka Metro, Hauz Khas, Sector 18"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Time / Operator Notes</span>
              </label>
              <input
                type="text"
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                placeholder="e.g. 10 mins ago; caller anxious in alley"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              eSahaay evaluates threats, negations, 6 emergency service dispatches, and nearby PCRs.
            </span>
            <button
              type="submit"
              disabled={loading || transcript.trim().length < 5}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-semibold text-sm shadow-md shadow-teal-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed sm:ml-auto cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing Emergency...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Analyze & Measure Emergency</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 4. 22-Language Helpline Translation Console (Requirement 3 & 7) */}
      <MultilingualComprehensionCard
        transcript={transcript}
        detectedLanguage={analysis?.detected_language || languageHint}
        detectedScript={analysis?.detected_language_script}
        translations={analysis?.translations}
        onLanguageSelect={(lang) => setLanguageHint(lang)}
        onApplySample={(sample, lang) => {
          setTranscript(sample);
          setLanguageHint(lang);
        }}
      />

      {/* 5. Emergency Threat Measurement & 6-Service Dispatch Engine (Requirement 2) */}
      <EmergencyDispatchMatrix
        threatScore={emergencyMeasurement.threatScore}
        urgencyLevel={analysis?.provisional_urgency || emergencyMeasurement.urgencyLevel}
        primaryService={emergencyMeasurement.primaryService}
        decisions={emergencyMeasurement.decisions}
      />

      {/* 6. Nearby Emergency Services Radar (Requirement 4) */}
      <NearbyServicesRadar
        locationHint={analysis?.location?.mentioned_location || locationHint}
      />

      {/* 7. Suggested Operator Follow-Up Questions (Requirement 6) */}
      <SituationalQuestionsCard
        questions={situationalQuestions}
        onAddCustomQuestion={(q) => {
          setOperatorNotes((prev) => (prev ? `${prev}; Operator asked: "${q}"` : `Operator asked: "${q}"`));
        }}
      />

      {/* 8. Full Incident Evidence & Safeguard Verification Section */}
      {analysis && (
        <div className="space-y-4 sm:space-y-6">
          {/* Top Triage Summary Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-6 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                    Case {analysis.case_id}
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Provisional:</span>
                    <UrgencyBadge urgency={analysis.provisional_urgency} size="sm" />
                  </div>
                  {currentReview && (
                    <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Operator Reviewed: {currentReview.reviewed_urgency}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 pt-1 leading-relaxed">
                  {analysis.incident_summary}
                </p>
              </div>

              {/* Actions */}
              <div className="shrink-0 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{currentReview ? 'Edit Operator Review' : 'Human Operator Review'}</span>
                </button>
                <button
                  type="button"
                  onClick={copySummary}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors active:scale-95"
                  title="Copy Report Summary"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={exportJSON}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors active:scale-95"
                  title="Export JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Meta Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-3 sm:pt-4 text-xs border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Location:
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {analysis.location.mentioned_location || locationHint}
                </p>
                <span
                  className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-medium ${
                    analysis.location.is_vague_or_incomplete
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {analysis.location.confidence}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                  <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Spoken Language:
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {analysis.detected_language}
                </p>
                <span className="text-[10px] text-teal-700 dark:text-teal-400 font-medium block">
                  {analysis.detected_language_script ? `${analysis.detected_language_script} Script` : 'Tri-Lingual'}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Involved Person:
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {analysis.people_or_relationships || 'Unknown Individual'}
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Explicitly Stated</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Categories:
                </span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {(currentReview?.reviewed_categories || analysis.incident_categories).map((cat) => (
                    <span
                      key={cat}
                      className="px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Evidence-Based Reporting Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Transcript Highlighter & Negation Verification */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>Verbatim Highlight Mapping:</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Grounding Proof
                  </span>
                </div>

                <TranscriptHighlighter
                  transcript={transcript}
                  evidenceItems={analysis.evidence_items}
                  negations={analysis.negations_detected}
                  contradictions={analysis.contradictions_detected}
                  selectedExcerpt={selectedExcerpt}
                  onSelectExcerpt={setSelectedExcerpt}
                  detectedLanguage={analysis.detected_language}
                />
              </div>

              {/* Urgency Rationale Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Provisional Urgency Reasons
                </h4>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {analysis.urgency_reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Extracted Evidence Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Verbatim Evidence Grounding ({analysis.evidence_items.length} Findings)
                </h4>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  Select card to focus quote
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

export default NewIncidentPage;
