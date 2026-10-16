"""
FastAPI route handlers for eSahaay endpoints.
Includes health, transcript analysis, case management, demo cases, and evaluation.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.models.schemas import (
    TranscriptAnalysisRequest, IncidentAnalysis, HumanReviewUpdate,
    StoredCase, EvaluationMetrics
)
from app.services.ai_provider import AIProviderService
from app.services.case_store import case_store
from app.services.evaluation_service import EvaluationService
from app.data.demo_cases import SYNTHETIC_DEMO_CASES
from app.config import settings

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "ai_provider": settings.AI_PROVIDER,
        "has_api_key": bool(settings.AI_API_KEY)
    }

@router.get("/demo-cases")
def get_demo_cases():
    """Returns list of pre-configured synthetic demo cases for quick UI loading."""
    return SYNTHETIC_DEMO_CASES

@router.post("/analyze", response_model=IncidentAnalysis)
async def analyze_transcript(req: TranscriptAnalysisRequest):
    """
    Submits a caller transcript for multi-lingual triage analysis.
    Extracts evidence, detects negations and contradictions, evaluates urgency,
    and automatically stores the provisional case in the local SQLite database.
    """
    clean_text = req.transcript.strip()
    if len(clean_text) < 5:
        raise HTTPException(status_code=400, detail="Transcript is too short to analyze.")

    analysis = await AIProviderService.analyze(
        transcript=clean_text,
        language_hint=req.language_hint,
        incident_time_hint=req.incident_time_hint,
        operator_notes=req.operator_notes
    )

    # Persist in SQLite
    case_store.save_analysis(transcript=clean_text, analysis=analysis, is_demo=False)
    return analysis

@router.get("/overview")
def get_overview():
    """Returns summary statistics for the Overview dashboard."""
    return case_store.get_overview_statistics()

@router.get("/cases", response_model=List[StoredCase])
def list_cases(
    q: Optional[str] = Query(None, description="Search query across ID or transcript"),
    urgency: Optional[str] = Query(None, description="Filter by urgency: High, Medium, Low, Unable to Determine"),
    status: Optional[str] = Query(None, description="Filter by review status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Retrieves paginated and filtered case history."""
    return case_store.list_cases(query=q, urgency=urgency, review_status=status, limit=limit, offset=offset)

@router.get("/cases/{case_id}", response_model=StoredCase)
def get_case(case_id: str):
    """Retrieves a single case by its unique ID."""
    case = case_store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")
    return case

@router.post("/cases/review", response_model=StoredCase)
def update_case_review(review: HumanReviewUpdate):
    """Updates a case with human operator's reviewed urgency, categories, and notes."""
    updated = case_store.update_review(review)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Case {review.case_id} not found.")
    return updated

@router.delete("/cases/{case_id}")
def delete_case(case_id: str):
    """Deletes a case from SQLite storage (useful for demo cleanup and test reset)."""
    success = case_store.delete_case(case_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")
    return {"status": "deleted", "case_id": case_id}

@router.get("/evaluate", response_model=EvaluationMetrics)
def run_evaluation():
    """Runs automated evaluation on the synthetic labeled dataset and returns metrics."""
    return EvaluationService.run_evaluation()
