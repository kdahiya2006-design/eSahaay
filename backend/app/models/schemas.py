from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class EvidenceItem(BaseModel):
    finding: str = Field(..., description="Description of the finding or concern")
    transcript_excerpt: str = Field(..., description="Exact verbatim quote from the transcript supporting this finding")
    english_translation: Optional[str] = Field(None, description="English translation of the verbatim excerpt")
    hindi_translation: Optional[str] = Field(None, description="Hindi translation of the verbatim excerpt")
    relevance: str = Field(..., description="Explanation of why this excerpt is relevant to the triage")
    is_fact: bool = Field(True, description="True if explicitly stated by caller as fact; False if AI inference/interpretation")
    uncertainty_note: Optional[str] = Field(None, description="Ambiguities, missing context, or alternative readings")
    start_char: Optional[int] = Field(None, description="Start character index in original transcript for visual highlighting")
    end_char: Optional[int] = Field(None, description="End character index in original transcript")

class TranscriptTranslations(BaseModel):
    english: str = Field(..., description="English translation of the full transcript")
    hindi: str = Field(..., description="Hindi (Devanagari) translation of the full transcript")
    hinglish: str = Field(..., description="Hinglish (Roman script) translation of the full transcript")
    detected_dialect_or_notes: Optional[str] = Field(None, description="Notes on regional language, dialect, or script")

class LocationDetail(BaseModel):
    mentioned_location: Optional[str] = Field(None, description="Location explicitly stated in the transcript")
    confidence: str = Field("Unknown", description="High, Medium, Low / Incomplete, or Unknown")
    is_vague_or_incomplete: bool = Field(False, description="Flag indicating if the location lacks landmarks, area, or specificity")
    landmarks: List[str] = Field(default_factory=list, description="Any landmarks or visual cues mentioned")

class NegationItem(BaseModel):
    statement: str = Field(..., description="The caller's statement containing negation")
    negated_concept: str = Field(..., description="What was explicitly denied or clarified did NOT happen")
    explanation: str = Field(..., description="Contextual safeguard explanation preventing false-positive classification")

class ContradictionItem(BaseModel):
    claim_a: str = Field(..., description="First statement")
    claim_b: str = Field(..., description="Conflicting statement")
    explanation: str = Field(..., description="Why these two statements conflict or create timeline/location ambiguity")

class SupportRecommendation(BaseModel):
    category: Literal[
        "Police or Emergency Escalation",
        "Healthcare or Medical Assistance",
        "Shelter or Safe Accommodation",
        "Authorized Women's Support Services",
        "Further Clarification / Operator Follow-up"
    ]
    relevance_reason: str = Field(..., description="Why this support category may be appropriate")
    supporting_evidence: Optional[str] = Field(None, description="Direct excerpt or evidence from transcript")
    uncertainty: Optional[str] = Field(None, description="Uncertainty, caveats, or conditional requirements")

UrgencyLevel = Literal["High", "Medium", "Low", "Unable to Determine"]

class IncidentAnalysis(BaseModel):
    case_id: str
    incident_summary: str
    detected_language: str = Field("Hindi", description="Detected language, e.g. Bengali, Marathi, Telugu, Tamil, Gujarati, Hindi, Hinglish, English, etc.")
    detected_language_script: Optional[str] = Field(None, description="Script name, e.g. Devanagari, Bengali, Tamil, Telugu, Gurmukhi, Latin")
    translations: Optional[TranscriptTranslations] = Field(None, description="Transcript converted to English, Hindi, and Hinglish for operator comprehension")
    incident_categories: List[str] = Field(default_factory=list)
    key_entities: List[str] = Field(default_factory=list, description="Explicitly mentioned people, vehicles, objects, landmarks")
    location: LocationDetail
    incident_time: Optional[str] = Field(None, description="Mentioned time, date, or relative recency if stated")
    people_or_relationships: Optional[str] = Field(None, description="Relationships or identities mentioned")
    potential_safety_concerns: List[str] = Field(default_factory=list)
    
    # Provisional Urgency Assessment
    provisional_urgency: UrgencyLevel
    urgency_reasons: List[str] = Field(default_factory=list)
    immediate_danger_flag: bool = Field(False, description="True if caller appears in active physical danger")
    
    # Evidence-based reporting
    evidence_items: List[EvidenceItem] = Field(default_factory=list)
    
    # Safeguards: Negations, Contradictions, Missing Info
    negations_detected: List[NegationItem] = Field(default_factory=list)
    contradictions_detected: List[ContradictionItem] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    uncertainty_warnings: List[str] = Field(default_factory=list)
    
    # Next steps for human operator
    suggested_follow_up_questions: List[str] = Field(default_factory=list)
    support_recommendations: List[SupportRecommendation] = Field(default_factory=list)
    operator_review_steps: List[str] = Field(default_factory=list)
    
    # Engine metadata
    analysis_mode: Literal["live_ai", "deterministic_demo"] = "deterministic_demo"
    provider_label: str = "Demo Mode: Deterministic Rule-Based Engine (No External AI Key Configured)"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class TranscriptAnalysisRequest(BaseModel):
    transcript: str = Field(..., min_length=5, description="Caller's complaint transcript")
    language_hint: Optional[str] = Field("Auto-detect", description="Auto-detect, Hindi, English, Hinglish")
    incident_time_hint: Optional[str] = Field(None, description="Optional caller/operator timestamp")
    operator_notes: Optional[str] = Field(None, description="Initial operator notes")

class HumanReviewUpdate(BaseModel):
    case_id: str
    reviewed_urgency: UrgencyLevel
    urgency_override_reason: Optional[str] = None
    reviewed_categories: List[str]
    operator_notes: Optional[str] = None
    verification_status: Literal["Verified", "Unverified", "Needs Investigation", "Disputed"] = "Verified"
    review_status: Literal["Pending Review", "Reviewed & Verified", "Escalated to Supervisor", "Closed"] = "Reviewed & Verified"
    reviewer_id: Optional[str] = "Operator-Default"

class StoredCase(BaseModel):
    case_id: str
    transcript: str
    analysis: IncidentAnalysis
    review: Optional[HumanReviewUpdate] = None
    created_at: str
    updated_at: str
    is_demo_case: bool = False

class EvaluationMetrics(BaseModel):
    total_test_cases: int
    category_accuracy: float
    urgency_accuracy: float
    missing_info_detection_rate: float
    under_triage_rate: float
    under_triage_count: int
    confusion_matrix: dict
    error_cases: List[dict]
    evaluated_at: str
