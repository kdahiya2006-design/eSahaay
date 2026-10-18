import React, { useState, useEffect, useRef, useMemo } from 'react';
import type {
  IncidentAnalysis,
  DemoCase,
  HumanReviewUpdate
} from '../types';
import { api } from '../services/api';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { HumanReviewModal } from '../components/HumanReviewModal';
import { DemoCaseSelectorModal } from '../components/DemoCaseSelectorModal';
import { CallSimulationBar, CALLER_PRESETS } from '../components/CallSimulationBar';
import { EmergencyDispatchMatrix } from '../components/EmergencyDispatchMatrix';
import { SituationalQuestionsCard } from '../components/SituationalQuestionsCard';
import { dispatchEngine } from '../services/dispatchEngine';
import { translateToEnglishAndHindi, fetchLiveEnglishTranslation } from '../data/languages';
import { SYNTHETIC_DEMO_CASES } from '../data/demoCases';
import {
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Edit3,
  Copy,
  MapPin,
  Users,
  Languages,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Check
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
  onNavigateToMap?: () => void;
}

export const NewIncidentPage: React.FC<NewIncidentPageProps> = ({
  initialCase,
  initialTranscript = '',
  onNavigateToMap,
}) => {
  const [transcript, setTranscript] = useState(
    initialTranscript || (initialCase ? '' : SYNTHETIC_DEMO_CASES[0]?.transcript || '')
  );
  const [languageHint, setLanguageHint] = useState('Auto-detect');
  const [timeHint, setTimeHint] = useState('');
  const [locationHint, setLocationHint] = useState('Munirka Metro Station, New Delhi');
  const [operatorNotes, setOperatorNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<IncidentAnalysis | null>(initialCase || null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoCases, setDemoCases] = useState<DemoCase[]>(SYNTHETIC_DEMO_CASES);
  const [currentReview, setCurrentReview] = useState<HumanReviewUpdate | null>(null);

  // Call Simulation & Emergency Advisory State
  const [isSimulatedCallActive, setIsSimulatedCallActive] = useState(false);
  const [isAdvisoryDismissed, setIsAdvisoryDismissed] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<any>(SYNTHETIC_DEMO_CASES[0]);
  const triggerIncomingCallRef = useRef<((scenario?: any) => void) | null>(null);

  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastAnalyzedRef = useRef<string>('');

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

  // English Translation state & speech synthesis
  const [isPlayingEnglish, setIsPlayingEnglish] = useState(false);
  const [copiedEnglish, setCopiedEnglish] = useState(false);
  const [liveEnglishTranslation, setLiveEnglishTranslation] = useState<string>(() => {
    const initialText = initialTranscript || (initialCase ? '' : SYNTHETIC_DEMO_CASES[0]?.transcript || '');
    return initialText ? translateToEnglishAndHindi(initialText).english : '';
  });
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Continuous real-time translation: handles phone calls, scenario loading, manual typing, and mic dictation
  useEffect(() => {
    const text = transcript.trim();
    if (!text) {
      setLiveEnglishTranslation('');
      return;
    }

    // 1. Instant check for known emergency cases / scenarios (0ms lag)
    const quick = translateToEnglishAndHindi(text, languageHint);
    if (quick.confidence >= 0.94) {
      setLiveEnglishTranslation(quick.english);
      return;
    }

    // 2. Set clean heuristic translation immediately
    setLiveEnglishTranslation(quick.english);

    // 3. Asynchronously fetch live translation from Google Translate
    let isCancelled = false;
    setIsTranslating(true);
    const timer = setTimeout(async () => {
      try {
        const live = await fetchLiveEnglishTranslation(text, languageHint);
        if (!isCancelled && live && live.trim()) {
          setLiveEnglishTranslation(live);
        }
      } catch (err) {
        console.warn('Real-time translation error:', err);
      } finally {
        if (!isCancelled) setIsTranslating(false);
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [transcript, languageHint]);

  const handlePlayEnglish = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis audio is not supported in this browser.');
      return;
    }
    if (isPlayingEnglish) {
      window.speechSynthesis.cancel();
      setIsPlayingEnglish(false);
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak = liveEnglishTranslation.trim();
    if (!textToSpeak) return;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingEnglish(false);
    utterance.onerror = () => setIsPlayingEnglish(false);
    setIsPlayingEnglish(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyEnglish = () => {
    if (!liveEnglishTranslation) return;
    navigator.clipboard.writeText(liveEnglishTranslation);
    setCopiedEnglish(true);
    setTimeout(() => setCopiedEnglish(false), 2000);
  };

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

  // Autonomous top-to-bottom AI analysis execution
  const executeAnalysis = async (
    textToAnalyze: string,
    currentLangHint: string,
    currentTimeHint?: string,
    currentNotes?: string,
    currentLoc?: string
  ) => {
    const cleanText = textToAnalyze.trim();
    if (!cleanText || cleanText.length < 5) return;
    if (lastAnalyzedRef.current === cleanText && analysis) return;

    lastAnalyzedRef.current = cleanText;
    setLoading(true);

    try {
      const res = await api.analyzeTranscript({
        transcript: cleanText,
        language_hint: currentLangHint,
        incident_time_hint: currentTimeHint?.trim() || undefined,
        operator_notes: currentNotes?.trim() || undefined,
      });
      setAnalysis(res);
      if (res.location?.mentioned_location && !res.location.is_vague_or_incomplete) {
        setLocationHint(res.location.mentioned_location);
      }
    } catch (err: any) {
      console.warn('Backend LLM API unavailable, applying deterministic fallback engine:', err);
      const fallbackTrans = translateToEnglishAndHindi(cleanText, currentLangHint);
      const measurement = dispatchEngine.evaluateEmergencyMeasurement(
        cleanText,
        [],
        'Medium',
        false
      );
      const fallbackAnalysis: IncidentAnalysis = {
        case_id: `ESH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        incident_summary: `Victim complaint analyzed in ${fallbackTrans.detectedLanguage}. Threat index: ${measurement.threatScore}/100. Primary response: ${measurement.primaryService.toUpperCase()}.`,
        detected_language: fallbackTrans.detectedLanguage,
        detected_language_script: fallbackTrans.detectedScript,
        translations: {
          english: fallbackTrans.english,
          hindi: fallbackTrans.hindi,
          hinglish: fallbackTrans.hinglish,
          detected_dialect_or_notes: fallbackTrans.dialectNotes,
        },
        incident_categories: measurement.primaryService === 'fire'
          ? ['Fire Hazard / Evacuation Risk']
          : measurement.primaryService === 'police'
          ? ['Active Intrusion / Violence Risk', 'Physical Safety Threat']
          : ['Helpline Triage', 'Distress Support'],
        key_entities: ['Caller', currentLoc || locationHint],
        location: {
          mentioned_location: currentLoc || locationHint,
          confidence: 'High',
          is_vague_or_incomplete: false,
          landmarks: [currentLoc || locationHint],
        },
        potential_safety_concerns: ['Perceived pursuit or distress reported'],
        provisional_urgency: measurement.urgencyLevel,
        urgency_reasons: [
          `Evaluated via situational measurement matrix. Threat score ${measurement.threatScore}/100.`,
          `Primary field dispatch service recommended: ${measurement.primaryService.toUpperCase()}.`
        ],
        immediate_danger_flag: measurement.threatScore >= 80,
        evidence_items: [
          {
            finding: 'Primary reported distress',
            transcript_excerpt: cleanText.slice(0, 120),
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

  // Automatic real-time AI analysis trigger with debouncing (no clicking required)
  useEffect(() => {
    if (!transcript || transcript.trim().length < 8) return;
    const timer = setTimeout(() => {
      executeAnalysis(transcript, languageHint, timeHint, operatorNotes, locationHint);
    }, 600);
    return () => clearTimeout(timer);
  }, [transcript, languageHint, locationHint]);

  // Initial auto-analysis on mount if transcript is available
  useEffect(() => {
    if (transcript && transcript.trim().length >= 8 && !analysis) {
      executeAnalysis(transcript, languageHint, timeHint, operatorNotes, locationHint);
    }
  }, []);

  const handleSelectDemo = (demo: DemoCase) => {
    stopListening();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSelectedScenario(demo);
    const lang = demo.language_hint || 'Auto-detect';
    const time = demo.incident_time_hint || '';
    const notes = demo.operator_notes || '';
    setTranscript(demo.transcript);
    setLanguageHint(lang);
    setTimeHint(time);
    setOperatorNotes(notes);
    setCurrentReview(null);

    const preset = CALLER_PRESETS[demo.id];
    const loc = preset?.location || locationHint;
    if (preset?.location) {
      setLocationHint(preset.location);
    }

    // AI automatically analyzes the loaded scenario top-to-bottom without clicking
    executeAnalysis(demo.transcript, lang, time, notes, loc);
  };

  const handleSimulateCallFromModal = (demo: DemoCase) => {
    handleSelectDemo(demo);
    triggerIncomingCallRef.current?.(demo);
  };

  const handleClear = () => {
    stopListening();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    lastAnalyzedRef.current = '';
    setTranscript('');
    setTimeHint('');
    setOperatorNotes('');
    setAnalysis(null);
    setCurrentReview(null);
    setIsSimulatedCallActive(false);
    setIsAdvisoryDismissed(false);
    setLiveEnglishTranslation('');
  };

  const handleAnalyze = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    lastAnalyzedRef.current = '';
    executeAnalysis(transcript, languageHint, timeHint, operatorNotes, locationHint);
  };

  // Callback when a simulated call is answered
  const handleCallAccepted = (callTranscript: string, langHint: string, callerLoc: string) => {
    setIsSimulatedCallActive(true);
    setIsAdvisoryDismissed(false);
    setTranscript(callTranscript);
    setLanguageHint(langHint);
    setLocationHint(callerLoc);
    setCurrentReview(null);

    // Automatically trigger immediate top-to-bottom AI analysis
    executeAnalysis(
      callTranscript,
      langHint,
      'Just now (Simulated Inbound Call)',
      `Inbound helpline call from ${callerLoc}`,
      callerLoc
    );
  };

  const handleCallEnded = () => {
    setIsSimulatedCallActive(false);
    setIsAdvisoryDismissed(true);
  };

  const handleSaveReview = async (review: HumanReviewUpdate) => {
    const updatedCase = await api.saveReview(review);
    setCurrentReview(review);
    if (updatedCase?.analysis) {
      setAnalysis(updatedCase.analysis);
    }
  };

  return (
    <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3 max-w-7xl mx-auto animate-fadeIn transition-colors duration-200">
      {/* 1. Emergency Protocol Banner */}
      <EmergencyBanner
        immediateDanger={
          !isAdvisoryDismissed &&
          isSimulatedCallActive &&
          (analysis ? analysis.immediate_danger_flag : emergencyMeasurement.threatScore >= 80)
        }
        onDismiss={() => setIsAdvisoryDismissed(true)}
        onEscalate={() => {
          setIsAdvisoryDismissed(true);
          alert('🚨 Emergency Escalation Triggered! Immediate field dispatch sent to local Police / PCR units.');
        }}
      />

      {/* 2. Helpline Call Simulator & Ringtone Center */}
      <CallSimulationBar
        onCallAccepted={handleCallAccepted}
        onCallEnded={handleCallEnded}
        isCallActive={isSimulatedCallActive}
        activeLanguage={languageHint}
        onOpenLoadScenarios={() => setDemoModalOpen(true)}
        selectedScenario={selectedScenario}
        triggerIncomingCallRef={triggerIncomingCallRef}
      />

      {/* Top Metadata Bar: Location + Spoken Language + Involved Person + Categories + Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs px-3 py-2 transition-colors">
        <div className="flex items-center justify-between gap-3 overflow-x-auto text-xs whitespace-nowrap">
          {/* Linear Sections Group */}
          <div className="flex items-center gap-3 sm:gap-3.5 flex-nowrap shrink-0">
            {/* 1. Location Input */}
            <div className="flex items-center gap-1.5 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                Location:
              </span>
              <input
                type="text"
                value={locationHint}
                onChange={(e) => setLocationHint(e.target.value)}
                placeholder="e.g. Munirka Metro Station, New Delhi"
                className="text-xs bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-hidden w-44 sm:w-56 placeholder:text-slate-400"
              />
            </div>

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

            {/* 2. Spoken Language */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Languages className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                Spoken Language:
              </span>
              <span className="font-bold text-slate-900 dark:text-white shrink-0">
                {analysis?.detected_language || languageHint || 'Hinglish'}
              </span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-200/60 dark:border-teal-800/60 shrink-0">
                {analysis?.detected_language_script ? `${analysis.detected_language_script} Script` : 'Latin Script'}
              </span>
            </div>

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

            {/* 3. Involved Person */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Users className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                Involved Person:
              </span>
              <span className="font-bold text-slate-900 dark:text-white shrink-0">
                {analysis?.people_or_relationships || analysis?.key_entities?.[0] || 'Unknown Individual'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                (Explicitly Stated)
              </span>
            </div>

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

            {/* 4. Incident Categories */}
            <div className="flex items-center gap-1.5 shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                Categories:
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {(currentReview?.reviewed_categories || (analysis?.incident_categories && analysis.incident_categories.length > 0
                  ? analysis.incident_categories
                  : ['Active Intrusion / Violence Risk', 'Physical Safety Threat'])
                ).slice(0, 2).map((cat, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Hand Controls: Review, Clear & Live Status */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-2 border-l border-slate-200 dark:border-slate-800">
            {analysis && (
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 text-xs font-semibold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer whitespace-nowrap"
                title="Open Human Operator Review"
              >
                <Edit3 className="w-3 h-3" />
                <span>Review</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 text-xs transition-colors active:scale-95 cursor-pointer shrink-0"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {loading ? (
              <div className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-[11px] font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleAnalyze()}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                title="Click to re-analyze"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Analysis Active</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Side-by-Side: Caller Testimony (Left) & Live AI English Translation (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 items-stretch">
        {/* LEFT COLUMN: Caller Testimony & Live Conversation Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-3.5 sm:p-4 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                  <Edit3 className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                  Caller Testimony & Live Conversation Feed
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer ${
                    isListening
                      ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice dictation'}
                >
                  {isListening ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                      <MicOff className="w-3 h-3 text-red-600" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      <span>Voice Dictate</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              required
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. Aaj college ke bahar bhi tha. Teesra din hai meri scooty ke peeche aa raha hai... Or speak in any Indian language..."
              className="w-full h-24 sm:h-28 p-2.5 sm:p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-teal-500 outline-hidden bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white resize-none font-sans"
            />
          </div>

          {isListening && (
            <div className="mt-2 flex items-center gap-2 p-1.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 rounded-lg text-[11px] animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0"></span>
              <span className="font-semibold shrink-0">Listening in {languageHint}:</span>
              <span className="truncate">Speak clearly into microphone...</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live AI English Translation */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200 dark:border-teal-900/80 shadow-xs p-3.5 sm:p-4 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-teal-100 dark:border-teal-900/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  <Languages className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none flex items-center gap-1.5">
                    <span>Live AI English Translation</span>
                    {isTranslating && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" title="Translating..."></span>
                    )}
                  </h3>
                  <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-400">
                    {analysis?.detected_language || languageHint} → English Triage
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePlayEnglish}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  title="Listen to English speech"
                >
                  {isPlayingEnglish ? (
                    <>
                      <VolumeX className="w-3 h-3 text-rose-500 animate-pulse" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3 text-teal-600" />
                      <span>Listen</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyEnglish}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  title="Copy English translation"
                >
                  {copiedEnglish ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy EN</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="w-full h-24 sm:h-28 p-2.5 sm:p-3 rounded-xl border border-teal-200/80 dark:border-teal-900/80 bg-teal-50/40 dark:bg-teal-950/20 overflow-y-auto">
              {liveEnglishTranslation ? (
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                  "{liveEnglishTranslation}"
                </p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                  Live translation will appear here in real-time as caller speaks or when you type in Hindi, Hinglish, Marathi, Bengali, Tamil, etc...
                </p>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-teal-800 dark:text-teal-400 font-medium pt-1 border-t border-teal-100 dark:border-teal-900/40">
            <span>Operator Real-Time Comprehension</span>
            <span>Accurate • Grounded</span>
          </div>
        </div>
      </div>

      {/* 3. Recommended Emergency Dispatch Matrix (Directly below Conversation Feed & Translation) */}
      <EmergencyDispatchMatrix
        threatScore={emergencyMeasurement.threatScore}
        urgencyLevel={analysis?.provisional_urgency || emergencyMeasurement.urgencyLevel}
        primaryService={emergencyMeasurement.primaryService}
        decisions={emergencyMeasurement.decisions}
        locationHint={analysis?.location?.mentioned_location || locationHint}
        onOpenLiveMap={onNavigateToMap}
      />

      {/* 4. Suggested Operator Follow-Up Questions */}
      <SituationalQuestionsCard
        questions={situationalQuestions}
        onAddCustomQuestion={(q) => {
          setOperatorNotes((prev) => (prev ? `${prev}; Operator asked: "${q}"` : `Operator asked: "${q}"`));
        }}
      />

      {/* Demo Selector Modal */}
      <DemoCaseSelectorModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        demoCases={demoCases}
        onSelectCase={handleSelectDemo}
        onSimulateCall={handleSimulateCallFromModal}
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

