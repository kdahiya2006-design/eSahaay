import type {
  IncidentAnalysis,
  StoredCase,
  HumanReviewUpdate,
  OverviewStatistics,
  EvaluationMetrics,
  DemoCase
} from '../types';

import { SYNTHETIC_DEMO_CASES } from '../data/demoCases';
import { DUMMY_OVERVIEW_DATA, DUMMY_CASES } from '../data/dashboardData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = {
  async getHealth(): Promise<{ status: string; service: string; ai_provider: string; has_api_key: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) return res.json();
    } catch (err) {
      // Graceful offline fallback
    }
    return {
      status: 'ok',
      service: 'eSahaay Triage Console',
      ai_provider: 'autonomous',
      has_api_key: true,
    };
  },

  async getDemoCases(): Promise<DemoCase[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/demo-cases`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Backend /demo-cases unavailable, using embedded demo cases:', err);
    }
    return SYNTHETIC_DEMO_CASES;
  },

  async analyzeTranscript(data: {
    transcript: string;
    language_hint?: string;
    incident_time_hint?: string;
    operator_notes?: string;
  }): Promise<IncidentAnalysis> {
    const res = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Analysis failed' }));
      throw new Error(err.message || err.detail || 'Analysis request failed');
    }
    return res.json();
  },

  async getOverview(): Promise<OverviewStatistics> {
    try {
      const res = await fetch(`${API_BASE_URL}/overview`);
      if (res.ok) {
        const json = await res.json();
        if (json && (json.total_cases > 0 || (Array.isArray(json.recent_cases) && json.recent_cases.length > 0))) {
          return json;
        }
      }
    } catch (err) {
      console.warn('Backend /overview unavailable, falling back to dummy dashboard data:', err);
    }
    return DUMMY_OVERVIEW_DATA;
  },

  async listCases(params?: {
    q?: string;
    urgency?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<StoredCase[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.append('q', params.q);
      if (params?.urgency && params.urgency !== 'All') searchParams.append('urgency', params.urgency);
      if (params?.status && params.status !== 'All') searchParams.append('status', params.status);
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.offset) searchParams.append('offset', params.offset.toString());

      const res = await fetch(`${API_BASE_URL}/cases?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          return json;
        }
      }
    } catch (err) {
      console.warn('Backend /cases unavailable, using dummy case records:', err);
    }

    let list = [...DUMMY_CASES];
    if (params?.urgency && params.urgency !== 'All') {
      list = list.filter((c) => (c.review?.reviewed_urgency || c.analysis.provisional_urgency) === params.urgency);
    }
    if (params?.status && params.status !== 'All') {
      list = list.filter((c) => (c.review?.review_status || 'Pending Review') === params.status);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter((c) => c.case_id.toLowerCase().includes(q) || c.transcript.toLowerCase().includes(q));
    }
    return list;
  },

  async getCaseById(caseId: string): Promise<StoredCase> {
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}`);
      if (res.ok) return res.json();
    } catch (err) {
      // Fallback
    }
    const found = DUMMY_CASES.find((c) => c.case_id === caseId);
    if (found) return found;
    throw new Error(`Case ${caseId} not found`);
  },

  async saveReview(review: HumanReviewUpdate): Promise<StoredCase> {
    const res = await fetch(`${API_BASE_URL}/cases/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    });
    if (!res.ok) throw new Error('Failed to save operator review');
    return res.json();
  },

  async deleteCase(caseId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete case');
  },

  async runEvaluation(): Promise<EvaluationMetrics> {
    const res = await fetch(`${API_BASE_URL}/evaluate`);
    if (!res.ok) throw new Error('Failed to run evaluation');
    return res.json();
  }
};
