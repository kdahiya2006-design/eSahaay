"""
Unit and integration tests for eSahaay backend.
Tests:
1. Health check endpoint
2. Demo cases retrieval
3. Negation safeguard: 'dhamki nahi di' does NOT trigger confirmed threat
4. Contradiction safeguard: 'ghar par safe' vs 'trapped in public'
5. Incomplete location flagging: 'red building near metro' flagged as vague
6. Immediate active danger escalation: 'darwaza peet raha hai' flagged High urgency
7. Case review workflow: operator review update & persistence
8. Evaluation service execution and metrics calculation
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.rule_engine import RuleEngine
from app.services.case_store import case_store
from app.services.evaluation_service import EvaluationService

client = TestClient(app)

def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "eSahaay" in data["service"]

def test_demo_cases_list():
    response = client.get("/api/v1/demo-cases")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) >= 3
    assert any("Hinglish" in c["language_hint"] for c in cases)

def test_negation_safeguard():
    transcript = "Ek ladka bus stop pe roz khada hota hai. Lekin usne mujhe koi dhamki nahi di aur na hi physical chhua hai."
    analysis = RuleEngine.analyze_transcript(transcript)
    
    # Must detect negation
    assert len(analysis.negations_detected) >= 1
    assert any(n.negated_concept == "Threat of violence" for n in analysis.negations_detected)
    # Urgency must not be High
    assert analysis.provisional_urgency != "High"

def test_contradiction_safeguard():
    transcript = "Main abhi apne ghar par safe hoon. Par wo aadmi metro station ke platform number 2 pe abhi mera intezar kar raha hai aur main wahi seedhiyon pe phasi hui hoon."
    analysis = RuleEngine.analyze_transcript(transcript)
    
    assert len(analysis.contradictions_detected) >= 1
    assert analysis.provisional_urgency == "Unable to Determine"

def test_incomplete_location():
    transcript = "Hello, main ek red building ke paas khadi hoon metro ke paas. Koi aadmi follow kar raha hai."
    analysis = RuleEngine.analyze_transcript(transcript)
    
    assert analysis.location.is_vague_or_incomplete is True
    assert "red building" in analysis.location.mentioned_location.lower()
    assert any("precise" in m.lower() or "landmark" in m.lower() or "address" in m.lower() for m in analysis.missing_information)

def test_immediate_danger_urgency():
    transcript = "Emergency! Mere flat ke bahar koi darwaza zor zor se peet raha hai aur todne ki koshish kar raha hai. Bachao please!"
    analysis = RuleEngine.analyze_transcript(transcript)
    
    assert analysis.provisional_urgency == "High"
    assert analysis.immediate_danger_flag is True
    assert any("emergency" in r.category.lower() or "police" in r.category.lower() for r in analysis.support_recommendations)

def test_analyze_endpoint_and_storage():
    payload = {
        "transcript": "Aaj college ke bahar bhi tha. Teesra din hai meri scooty ke peeche aa raha hai. Usne bola dekh lunga.",
        "language_hint": "Hinglish",
        "incident_time_hint": "3 days ongoing",
        "operator_notes": "Caller anxious"
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "case_id" in data
    assert data["provisional_urgency"] in ["Medium", "High"]
    assert len(data["evidence_items"]) > 0

    # Verify retrieval from cases list
    list_resp = client.get(f"/api/v1/cases/{data['case_id']}")
    assert list_resp.status_code == 200
    stored = list_resp.json()
    assert stored["case_id"] == data["case_id"]

def test_human_review_workflow():
    # Analyze a case
    payload = {"transcript": "Koi pichle 20 minute se mere peeche chal raha hai sadak par."}
    create_resp = client.post("/api/v1/analyze", json=payload)
    case_id = create_resp.json()["case_id"]

    # Operator overrides urgency to High based on caller interview
    review_payload = {
        "case_id": case_id,
        "reviewed_urgency": "High",
        "urgency_override_reason": "Caller verified follower has closed distance to under 5 meters in dark alleyway.",
        "reviewed_categories": ["Active Stalking", "Vulnerable Location"],
        "operator_notes": "Contacted nearest police beat patrol.",
        "verification_status": "Verified",
        "review_status": "Escalated to Supervisor",
        "reviewer_id": "Operator-102"
    }
    rev_resp = client.post("/api/v1/cases/review", json=review_payload)
    assert rev_resp.status_code == 200
    rev_data = rev_resp.json()
    assert rev_data["review"]["reviewed_urgency"] == "High"
    assert rev_data["review"]["review_status"] == "Escalated to Supervisor"

def test_evaluation_service_metrics():
    metrics = EvaluationService.run_evaluation()
    assert metrics.total_test_cases >= 8
    assert metrics.urgency_accuracy > 60.0
    assert "High" in metrics.confusion_matrix
    assert isinstance(metrics.error_cases, list)
