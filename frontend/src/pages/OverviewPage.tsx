import React, { useEffect, useState } from 'react';
import type { OverviewStatistics, StoredCase } from '../types';
import { api } from '../services/api';
import { UrgencyBadge } from '../components/UrgencyBadge';
import {
  FileText,
  Clock,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  ChevronRight,
  Languages
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface OverviewPageProps {
  onNavigateToNew: () => void;
  onSelectCase: (caseItem: StoredCase) => void;
}

const URGENCY_COLORS: Record<string, string> = {
  High: '#dc2626',
  Medium: '#f59e0b',
  Low: '#10b981',
  'Unable to Determine': '#64748b',
};

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigateToNew,
  onSelectCase,
}) => {
  const [data, setData] = useState<OverviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await api.getOverview();
      setData(stats);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load overview statistics. Backend may be offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const chartData = data
    ? Object.entries(data.urgency_distribution).map(([key, value]) => ({
        name: key,
        value,
        color: URGENCY_COLORS[key] || '#94a3b8',
      }))
    : [];

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 md:space-y-8 max-w-7xl mx-auto animate-fadeIn">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl break-words">
          {error}
        </div>
      )}

      {/* Clean Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Welcome, Operator</h2>
          <p className="text-xs text-slate-500 mt-0.5">Here's your shift summary. Review pending cases or start a new triage.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-xs active:scale-95"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateToNew}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>New Triage</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider truncate">
              Total Cases
            </span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {data?.total_cases ?? 0}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            All analyzed incidents
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider truncate">
              Awaiting Review
            </span>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-800 font-mono">
              {data?.pending_review ?? 0}
            </span>
            <span className="text-xs text-amber-800 font-medium">Pending</span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            Needs operator verification
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider truncate">
              Flagged Issues
            </span>
            <div className="p-2 bg-purple-100 rounded-lg text-purple-700 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-700 font-mono">
              {data?.flagged_missing_or_conflict ?? 0}
            </span>
            <span className="text-xs text-purple-700 font-medium">Flagged</span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            Vague location, gaps, or conflicts
          </p>
        </div>
      </div>

      {/* Urgency Distribution & Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Pie Distribution Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900 tracking-tight truncate">
              Urgency Distribution
            </h3>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium shrink-0">
              Demo Data
            </span>
          </div>

          <div className="h-52 sm:h-60 flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No cases recorded yet</div>
            )}
          </div>
        </div>

        {/* Recent Analyzed Cases List */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900 tracking-tight">
              Recent Incidents
            </h3>
            <span className="text-[11px] sm:text-xs text-slate-500">
              Showing latest {data?.recent_cases.length || 0}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recent_cases && data.recent_cases.length > 0 ? (
              data.recent_cases.map((c) => (
                <div
                  key={c.case_id}
                  onClick={() => onSelectCase(c)}
                  className="py-3 px-2 sm:px-3 flex items-center justify-between gap-3 hover:bg-slate-50/90 active:bg-slate-100 rounded-xl cursor-pointer transition-all group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 truncate">
                        {c.case_id}
                      </span>
                      <UrgencyBadge
                        urgency={c.review?.reviewed_urgency || c.analysis.provisional_urgency}
                        size="sm"
                      />
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full truncate">
                        <Languages className="w-2.5 h-2.5 text-sky-600" />
                        <span>{c.analysis.detected_language}</span>
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-600 px-2 py-0.5 rounded bg-slate-100 hidden xs:inline truncate">
                        {c.review?.review_status || 'Pending Review'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 truncate break-words">
                      "{c.transcript}"
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No cases available. Click "New Triage" to start.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
