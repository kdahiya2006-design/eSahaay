import React, { useState, useEffect } from 'react';
import type { StoredCase } from '../types';
import { api } from '../services/api';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { TranscriptHighlighter } from '../components/TranscriptHighlighter';
import {
  Search,
  Trash2,
  Eye,
  FileText,
  RefreshCw,
  X,
  Edit3,
  Languages,
  Copy,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { HumanReviewModal } from '../components/HumanReviewModal';

interface CaseHistoryPageProps {
  onSelectCaseForReanalysis?: (caseItem: StoredCase) => void;
}

export const CaseHistoryPage: React.FC<CaseHistoryPageProps> = ({
  onSelectCaseForReanalysis,
}) => {
  const [cases, setCases] = useState<StoredCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected case for detailed side view / modal
  const [activeCase, setActiveCase] = useState<StoredCase | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<'english' | 'hindi' | 'hinglish'>('english');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePlayAudio = (text: string, lang: string, key: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis audio is not supported in this browser.');
      return;
    }
    if (playingAudio === key) {
      window.speechSynthesis.cancel();
      setPlayingAudio(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onend = () => setPlayingAudio(null);
    utterance.onerror = () => setPlayingAudio(null);
    setPlayingAudio(key);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await api.listCases({
        q: searchQuery || undefined,
        urgency: urgencyFilter,
        status: statusFilter,
      });
      setCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [urgencyFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  const handleDelete = async (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete demo case ${caseId}?`)) {
      return;
    }
    try {
      await api.deleteCase(caseId);
      setCases(cases.filter((c) => c.case_id !== caseId));
      if (activeCase?.case_id === caseId) {
        setActiveCase(null);
      }
    } catch (err) {
      alert('Failed to delete case');
    }
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600 shrink-0" />
            <span>Incident Case History</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, and inspect reviewed incident reports persisted in local storage.
          </p>
        </div>

        <button
          onClick={fetchCases}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 self-start sm:self-auto shadow-xs active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Case ID, keywords, or transcript quotes..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 outline-hidden bg-slate-50/50 hover:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs flex-1 sm:flex-initial">
              <span className="text-slate-500 font-medium text-[11px]">Urgency:</span>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="w-full sm:w-auto px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-hidden"
              >
                <option value="All">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Unable to Determine">Indeterminate</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs flex-1 sm:flex-initial">
              <span className="text-slate-500 font-medium text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-hidden"
              >
                <option value="All">All</option>
                <option value="Pending Review">Pending</option>
                <option value="Reviewed & Verified">Verified</option>
                <option value="Escalated to Supervisor">Escalated</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700 active:scale-95 transition-all shadow-xs"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Case Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Complaint Transcript</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-600">
                    Loading case history...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-600">
                    No cases match the filter criteria.
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const effectiveUrgency =
                    c.review?.reviewed_urgency || c.analysis.provisional_urgency;
                  return (
                    <tr
                      key={c.case_id}
                      onClick={() => setActiveCase(c)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {c.case_id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 whitespace-nowrap">
                          <Languages className="w-2.5 h-2.5 text-sky-600" />
                          <span>{c.analysis.detected_language}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        "{c.transcript}"
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {(c.review?.reviewed_categories || c.analysis.incident_categories)[0] ||
                            'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <UrgencyBadge urgency={effectiveUrgency} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            c.review?.review_status === 'Reviewed & Verified'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : c.review?.review_status === 'Escalated to Supervisor'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {c.review?.review_status || 'Pending Review'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(c.updated_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectCaseForReanalysis) {
                                onSelectCaseForReanalysis(c);
                              } else {
                                setActiveCase(c);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-slate-100"
                            title="Inspect Case"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(c.case_id, e)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete Case"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Detail Modal / Drawer */}
      {activeCase && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <span className="font-mono text-xs sm:text-sm font-bold bg-teal-500/20 text-teal-300 px-2 sm:px-2.5 py-1 rounded-md border border-teal-500/30 shrink-0">
                  {activeCase.case_id}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30 shrink-0">
                  <Languages className="w-3 h-3 text-sky-300" />
                  <span>{activeCase.analysis.detected_language}</span>
                  {activeCase.analysis.detected_language_script && (
                    <span className="text-[10px] text-sky-300/80">({activeCase.analysis.detected_language_script})</span>
                  )}
                </span>
                <div className="min-w-0 hidden sm:block">
                  <h3 className="font-bold text-sm sm:text-base leading-none truncate">
                    Incident Case File
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1 truncate">
                    {new Date(activeCase.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Update Review</span>
                  <span className="xs:hidden">Review</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                    setActiveCase(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-md active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-xs text-slate-700">
              {/* Urgency & Review Summary Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <span className="text-slate-500 block mb-1 text-[11px]">Provisional:</span>
                  <UrgencyBadge urgency={activeCase.analysis.provisional_urgency} size="sm" />
                </div>
                <div>
                  <span className="text-slate-600 block mb-1">Reviewed Urgency:</span>
                  {activeCase.review ? (
                    <UrgencyBadge urgency={activeCase.review.reviewed_urgency} size="sm" />
                  ) : (
                    <span className="text-slate-600 italic">Not Reviewed</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-600 block mb-1">Review Status:</span>
                  <span className="font-semibold text-slate-800">
                    {activeCase.review?.review_status || 'Pending Review'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block mb-1">Reviewer:</span>
                  <span className="font-semibold text-slate-800">
                    {activeCase.review?.reviewer_id || 'System'}
                  </span>
                </div>
              </div>

              {/* Operator Notes if present */}
              {activeCase.review?.operator_notes && (
                <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-950 space-y-1">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-teal-800">
                    Human Operator Review Notes
                  </span>
                  <p className="leading-relaxed">{activeCase.review.operator_notes}</p>
                </div>
              )}

              {/* Multilingual Conversions for Regional Language Transcripts */}
              {activeCase.analysis.translations && (
                <div className="bg-slate-900 text-white rounded-xl border border-slate-700/80 p-3.5 sm:p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-teal-400" />
                      <span className="font-semibold text-slate-100 text-xs tracking-wide">
                        Multilingual Operator Conversions
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-medium">
                        Spoken: {activeCase.analysis.detected_language}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setActiveLangTab('english')}
                        className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                          activeLangTab === 'english'
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLangTab('hindi')}
                        className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                          activeLangTab === 'hindi'
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Hindi (हिंदी)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLangTab('hinglish')}
                        className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                          activeLangTab === 'hinglish'
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Hinglish
                      </button>
                    </div>
                  </div>

                  {activeLangTab === 'english' && (
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs text-slate-200 leading-relaxed font-sans select-text">
                        "{activeCase.analysis.translations.english || 'English translation processing...'}"
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-slate-400 italic">Standardized for helpline operator protocols</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(activeCase.analysis.translations?.english || '', 'en-IN', 'hist-modal-en')}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-medium flex items-center gap-1 active:scale-95 transition-all"
                            title="Listen to English read-aloud"
                          >
                            {playingAudio === 'hist-modal-en' ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Listen</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeCase.analysis.translations?.english || '', 'EN')}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-medium flex items-center gap-1 active:scale-95 transition-all"
                          >
                            {copiedField === 'EN' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'EN' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeLangTab === 'hindi' && (
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs text-slate-200 leading-relaxed font-sans select-text">
                        "{activeCase.analysis.translations.hindi || 'हिंदी अनुवाद उपलब्ध कराया जा रहा है...'}"
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-slate-400 italic">देवनागरी लिपि में पूर्ण अनुवाद</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(activeCase.analysis.translations?.hindi || '', 'hi-IN', 'hist-modal-hi')}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-medium flex items-center gap-1 active:scale-95 transition-all"
                            title="हिंदी में सुनें"
                          >
                            {playingAudio === 'hist-modal-hi' ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                                <span>रोकें</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>सुनें</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeCase.analysis.translations?.hindi || '', 'HI')}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-medium flex items-center gap-1 active:scale-95 transition-all"
                          >
                            {copiedField === 'HI' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'HI' ? 'कॉपी हो गया' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeLangTab === 'hinglish' && (
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs text-slate-200 leading-relaxed font-sans select-text">
                        "{activeCase.analysis.translations.hinglish || 'Hinglish translation available...'}"
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-slate-400 italic">Romanized phonetic conversion</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeCase.analysis.translations?.hinglish || '', 'Hinglish')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium flex items-center gap-1 active:scale-95 transition-all"
                        >
                          {copiedField === 'Hinglish' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'Hinglish' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transcript & Evidence */}
              <TranscriptHighlighter
                transcript={activeCase.transcript}
                evidenceItems={activeCase.analysis.evidence_items}
                negations={activeCase.analysis.negations_detected}
                contradictions={activeCase.analysis.contradictions_detected}
                detectedLanguage={activeCase.analysis.detected_language}
              />

              {/* Extracted Evidence List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
                  Supporting Evidence Excerpts
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeCase.analysis.evidence_items.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5"
                    >
                      <div className="font-semibold text-slate-800">{ev.finding}</div>
                      <div className="text-slate-600 italic bg-slate-50 p-2 rounded border-l-2 border-teal-500">
                        "{ev.transcript_excerpt}"
                      </div>
                      {(ev.english_translation || ev.hindi_translation) && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-[11px] space-y-0.5">
                          {ev.english_translation && (
                            <div>
                              <strong className="text-teal-700">EN:</strong> <span className="text-slate-800 italic">"{ev.english_translation}"</span>
                            </div>
                          )}
                          {ev.hindi_translation && (
                            <div>
                              <strong className="text-sky-700">HI:</strong> <span className="text-slate-800">"{ev.hindi_translation}"</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-600">{ev.relevance}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal for Active Case */}
      {activeCase && (
        <HumanReviewModal
          analysis={activeCase.analysis}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSaveReview={async (rev) => {
            const updated = await api.saveReview(rev);
            setActiveCase(updated);
            fetchCases();
          }}
          existingReview={activeCase.review}
        />
      )}
    </div>
  );
};
