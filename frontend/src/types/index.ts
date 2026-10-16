export type UrgencyLevel = 'High' | 'Medium' | 'Low' | 'Unable to Determine';

export interface EvidenceItem {
  finding: string;
  transcript_excerpt: string;
  english_translation?: string | null;
  hindi_translation?: string | null;
  relevance: string;
  is_fact: boolean;
  uncertainty_note?: string | null;
  start_char?: number | null;
  end_char?: number | null;
}

export interface TranscriptTranslations {
  english: string;
  hindi: string;
  hinglish: string;
  detected_dialect_or_notes?: string | null;
}

export interface LocationDetail {
  mentioned_location?: string | null;
  confidence: 'High' | 'Medium' | 'Low / Incomplete' | 'Unknown';
  is_vague_or_incomplete: boolean;
  landmarks: string[];
}

export interface NegationItem {
  statement: string;
  negated_concept: string;
  explanation: string;
}

export interface ContradictionItem {
  claim_a: string;
  claim_b: string;
  explanation: string;
}

export interface SupportRecommendation {
  category:
    | 'Police or Emergency Escalation'
    | 'Healthcare or Medical Assistance'
    | 'Shelter or Safe Accommodation'
    | 'Authorized Women\'s Support Services'
    | 'Further Clarification / Operator Follow-up';
  relevance_reason: string;
  supporting_evidence?: string | null;
  uncertainty?: string | null;
}

export interface IncidentAnalysis {
  case_id: string;
  incident_summary: string;
  detected_language: string;
  detected_language_script?: string | null;
  translations?: TranscriptTranslations | null;
  incident_categories: string[];
  key_entities: string[];
  location: LocationDetail;
  incident_time?: string | null;
  people_or_relationships?: string | null;
  potential_safety_concerns: string[];
  provisional_urgency: UrgencyLevel;
  urgency_reasons: string[];
  immediate_danger_flag: boolean;
  evidence_items: EvidenceItem[];
  negations_detected: NegationItem[];
  contradictions_detected: ContradictionItem[];
  missing_information: string[];
  uncertainty_warnings: string[];
  suggested_follow_up_questions: string[];
  support_recommendations: SupportRecommendation[];
  operator_review_steps: string[];
  analysis_mode: 'live_ai' | 'deterministic_demo';
  provider_label: string;
  created_at: string;
}

export interface HumanReviewUpdate {
  case_id: string;
  reviewed_urgency: UrgencyLevel;
  urgency_override_reason?: string;
  reviewed_categories: string[];
  operator_notes?: string;
  verification_status: 'Verified' | 'Unverified' | 'Needs Investigation' | 'Disputed';
  review_status: 'Pending Review' | 'Reviewed & Verified' | 'Escalated to Supervisor' | 'Closed';
  reviewer_id?: string;
}

export interface StoredCase {
  case_id: string;
  transcript: string;
  analysis: IncidentAnalysis;
  review?: HumanReviewUpdate | null;
  created_at: string;
  updated_at: string;
  is_demo_case: boolean;
}

export interface DemoCase {
  id: string;
  title: string;
  category_hint: string;
  language_hint: string;
  description: string;
  transcript: string;
  incident_time_hint: string;
  operator_notes: string;
}

export interface OverviewStatistics {
  total_cases: number;
  pending_review: number;
  flagged_missing_or_conflict: number;
  urgency_distribution: Record<string, number>;
  recent_cases: StoredCase[];
  is_demo_dataset: boolean;
  disclaimer: string;
}

export interface EvaluationMetrics {
  total_test_cases: number;
  category_accuracy: number;
  urgency_accuracy: number;
  missing_info_detection_rate: number;
  under_triage_rate: number;
  under_triage_count: number;
  confusion_matrix: Record<string, Record<string, number>>;
  error_cases: Array<{
    test_id: string;
    case_name: string;
    actual_urgency: string;
    predicted_urgency: string;
    actual_categories: string[];
    predicted_categories: string[];
    is_under_triage: boolean;
    explanation: string;
    transcript_snippet: string;
  }>;
  evaluated_at: string;
}
