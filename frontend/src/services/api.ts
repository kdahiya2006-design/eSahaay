import type {
  IncidentAnalysis,
  StoredCase,
  HumanReviewUpdate,
  OverviewStatistics,
  EvaluationMetrics,
  DemoCase
} from '../types';

import { SYNTHETIC_DEMO_CASES } from '../data/demoCases';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = {
  async getHealth(): Promise<{ status: string; service: string; ai_provider: string; has_api_key: boolean }> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
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
    const res = await fetch(`${API_BASE_URL}/overview`);
    if (!res.ok) throw new Error('Failed to load overview data');
    return res.json();
  },

  async listCases(params?: {
    q?: string;
    urgency?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<StoredCase[]> {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.urgency && params.urgency !== 'All') searchParams.append('urgency', params.urgency);
    if (params?.status && params.status !== 'All') searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const res = await fetch(`${API_BASE_URL}/cases?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to load cases');
    return res.json();
  },

  async getCaseById(caseId: string): Promise<StoredCase> {
    const res = await fetch(`${API_BASE_URL}/cases/${caseId}`);
    if (!res.ok) throw new Error(`Case ${caseId} not found`);
    return res.json();
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
