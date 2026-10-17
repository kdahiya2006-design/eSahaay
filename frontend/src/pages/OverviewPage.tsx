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

import { DUMMY_OVERVIEW_DATA } from '../data/dashboardData';

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
  const [data, setData] = useState<OverviewStatistics>(DUMMY_OVERVIEW_DATA);
  const [loading, setLoading] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const stats = await api.getOverview();
      if (stats && (stats.total_cases > 0 || (stats.recent_cases && stats.recent_cases.length > 0))) {
        setData(stats);
      } else {
        setData(DUMMY_OVERVIEW_DATA);
      }
    } catch (err: any) {
      console.warn('Using dummy overview fallback:', err);
      setData(DUMMY_OVERVIEW_DATA);
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
    <div className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 md:space-y-8 max-w-7xl mx-auto animate-fadeIn transition-colors">
      {/* Clean Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome, Operator
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateToNew}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Live Triage Console</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 sm:space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider truncate">
              Total Recorded Cases
            </span>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
              {data?.total_cases ?? 0}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            All analyzed incidents in audit log
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 sm:space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider truncate">
              Awaiting Operator Review
            </span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/80 rounded-xl text-amber-700 dark:text-amber-300 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-800 dark:text-amber-400 font-mono">
              {data?.pending_review ?? 0}
            </span>
            <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">Pending Review</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Needs human operator verification
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 sm:space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider truncate">
              Flagged Data Gaps
            </span>
            <div className="p-2 bg-purple-100 dark:bg-purple-950/80 rounded-xl text-purple-700 dark:text-purple-300 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-700 dark:text-purple-400 font-mono">
              {data?.flagged_missing_or_conflict ?? 0}
            </span>
            <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">Flagged</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Vague location, gaps, or contradictions
          </p>
        </div>
      </div>

      {/* Urgency Distribution & Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Pie Distribution Chart */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight truncate">
              Urgency Level Distribution
            </h3>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium shrink-0">
              Active Cases
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
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
              Recent Helpline Triage Incidents
            </h3>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Showing latest {data?.recent_cases.length || 0}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data?.recent_cases && data.recent_cases.length > 0 ? (
              data.recent_cases.map((c) => (
                <div
                  key={c.case_id}
                  onClick={() => onSelectCase(c)}
                  className="py-3 px-2 sm:px-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 rounded-xl cursor-pointer transition-all group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {c.case_id}
                      </span>
                      <UrgencyBadge
                        urgency={c.review?.reviewed_urgency || c.analysis.provisional_urgency}
                        size="sm"
                      />
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-full truncate">
                        <Languages className="w-2.5 h-2.5 text-sky-600" />
                        <span>{c.analysis.detected_language}</span>
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hidden xs:inline truncate">
                        {c.review?.review_status || 'Pending Review'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 truncate break-words">
                      "{c.transcript}"
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No cases available. Click "Live Triage Console" to start.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
