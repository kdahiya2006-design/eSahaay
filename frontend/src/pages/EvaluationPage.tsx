import React, { useState, useEffect } from 'react';
import type { EvaluationMetrics } from '../types';
import { api } from '../services/api';
import {
  BarChart3,
  Play,
  AlertOctagon,
  CheckCircle,
  RefreshCw,
  Info
} from 'lucide-react';

export const EvaluationPage: React.FC = () => {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runEval = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.runEvaluation();
      setMetrics(data);
    } catch (err: any) {
      console.error(err);
      setError('Evaluation run failed. Backend may be offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runEval();
  }, []);

  const urgencyLabels = ['High', 'Medium', 'Low', 'Unable to Determine'];

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 max-w-7xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600 shrink-0" />
            <span>Benchmark Evaluation Dashboard</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective quantitative evaluation on ground-truth labeled synthetic edge cases. Metrics are computed live from execution.
          </p>
        </div>

        <button
          onClick={runEval}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{loading ? 'Evaluating...' : 'Run Benchmark Evaluation'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 sm:p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
          {error}
        </div>
      )}

      {metrics && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {/* Urgency Classification Accuracy */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Urgency Triage Accuracy
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-slate-900">
                  {metrics.urgency_accuracy}%
                </span>
                <span className="text-xs text-slate-600">
                  ({metrics.total_test_cases} test cases)
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Ground-truth exact match across High, Med, Low & Indeterminate
              </p>
            </div>

            {/* Incident Category Overlap */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Category Match Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-teal-600">
                  {metrics.category_accuracy}%
                </span>
                <span className="text-xs text-teal-700 font-medium">Semantic Match</span>
              </div>
              <p className="text-xs text-slate-600">
                Stalking, harassment, threats, and medical safety flags
              </p>
            </div>

            {/* Critical Under-Triage Risk */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Under-Triage Error Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-bold font-mono ${
                    metrics.under_triage_count === 0 ? 'text-emerald-800' : 'text-red-600'
                  }`}
                >
                  {metrics.under_triage_rate}%
                </span>
                <span className="text-xs font-medium text-slate-600">
                  ({metrics.under_triage_count} High-risk missed)
                </span>
              </div>
              <p className="text-xs text-slate-600">
                <strong>Critical Safety Metric:</strong> High-risk cases classified as Low/Medium
              </p>
            </div>

            {/* Missing Info Detection Rate */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Location Gap Detection
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-purple-700">
                  {metrics.missing_info_detection_rate}%
                </span>
                <span className="text-xs text-purple-700 font-medium">Safeguard Check</span>
              </div>
              <p className="text-xs text-slate-600">
                Correctly flagging vague landmarks vs confirmed addresses
              </p>
            </div>
          </div>

          {/* Urgency Confusion Matrix Visual Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight">
                  Urgency Classification Confusion Matrix
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Rows represent <strong>Actual Ground-Truth</strong>; Columns represent <strong>Model Predicted Urgency</strong>.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-600 self-start sm:self-auto">
                N = {metrics.total_test_cases}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border border-slate-200 min-w-[440px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-2.5 border border-slate-200 font-semibold text-left">
                      Actual \ Predicted
                    </th>
                    {urgencyLabels.map((lbl) => (
                      <th key={lbl} className="p-2.5 border border-slate-200 font-semibold">
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {urgencyLabels.map((actual) => (
                    <tr key={actual} className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 font-semibold text-left bg-slate-50 text-slate-800">
                        {actual}
                      </td>
                      {urgencyLabels.map((pred) => {
                        const count = metrics.confusion_matrix[actual]?.[pred] ?? 0;
                        const isDiagonal = actual === pred;
                        const isUnderTriageCell = actual === 'High' && (pred === 'Low' || pred === 'Medium');

                        let cellClass = 'bg-white text-slate-600';
                        if (isDiagonal && count > 0) {
                          cellClass = 'bg-emerald-50 text-emerald-800 font-bold';
                        } else if (isUnderTriageCell && count > 0) {
                          cellClass = 'bg-red-50 text-red-700 font-bold';
                        } else if (!isDiagonal && count > 0) {
                          cellClass = 'bg-amber-50 text-amber-800 font-medium';
                        }

                        return (
                          <td
                            key={pred}
                            className={`p-2.5 border border-slate-200 font-mono text-sm ${cellClass}`}
                          >
                            {count}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-100 border border-emerald-400 rounded"></span>
                <span>Correct (Diagonal)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-red-100 border border-red-400 rounded"></span>
                <span>Under-Triage (Danger Zone)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-100 border border-amber-400 rounded"></span>
                <span>Over-Triage</span>
              </div>
            </div>
          </div>

          {/* Error Analysis & Discrepancies Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-600" />
                  <span>Discrepancy Analysis & Qualitative Inspect</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Inspecting cases where predicted urgency or categories differed from ground-truth expectations.
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                {metrics.error_cases.length} cases flagged
              </span>
            </div>

            {metrics.error_cases.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Zero discrepancies detected! All benchmark cases matched ground-truth.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {metrics.error_cases.map((errCase, idx) => (
                  <div key={idx} className="p-4 space-y-2 text-xs hover:bg-slate-50/50">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {errCase.test_id}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {errCase.case_name}
                        </span>
                      </div>
                      {errCase.is_under_triage && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold border border-red-300">
                          CRITICAL UNDER-TRIAGE
                        </span>
                      )}
                    </div>

                    <div className="text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-200/80">
                      "{errCase.transcript_snippet}"
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 pt-1">
                      <div>
                        <span className="text-slate-600 block font-medium">Ground Truth:</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-slate-900">Urgency: {errCase.actual_urgency}</span>
                          <span className="text-[11px] text-slate-600">[{errCase.actual_categories.join(', ')}]</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-600 block font-medium">Model Predicted:</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-slate-900">Urgency: {errCase.predicted_urgency}</span>
                          <span className="text-[11px] text-slate-600">[{errCase.predicted_categories.join(', ')}]</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-slate-600 bg-amber-50/60 p-2 rounded text-[11px] border border-amber-200/60">
                      <strong>Safeguard Note:</strong> {errCase.explanation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evaluation Method Disclosure */}
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Scientific Disclosure on Benchmark Dataset</span>
            </h4>
            <p className="leading-relaxed">
              Metrics are calculated dynamically against the synthetic benchmark set.
              No operational, clinical, or legal accreditation is claimed. In live helpline environments, all cases are subject to mandatory review by certified emergency counselors.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
