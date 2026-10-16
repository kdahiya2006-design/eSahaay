"""
Evaluation service for assessing eSahaay against the synthetic ground truth dataset.
Computes real quantitative metrics:
- Urgency accuracy
- Category accuracy
- Critical Under-Triage Error Rate (High-risk ground truth misclassified as Low/Medium)
- Missing-information detection rate
- Full Confusion Matrix
- Error analysis of mismatched cases
"""

from datetime import datetime
from typing import Dict, Any, List
from app.data.eval_dataset import EVALUATION_DATASET
from app.services.rule_engine import RuleEngine
from app.models.schemas import EvaluationMetrics

class EvaluationService:
    @classmethod
    def run_evaluation(cls) -> EvaluationMetrics:
        urgency_classes = ["High", "Medium", "Low", "Unable to Determine"]
        
        # Initialize confusion matrix: [actual][predicted]
        cm = {act: {pred: 0 for pred in urgency_classes} for act in urgency_classes}

        correct_urgency = 0
        correct_category_overlap = 0
        correct_missing_info = 0
        under_triage_count = 0
        high_urgency_cases = 0

        error_cases: List[Dict[str, Any]] = []

        for item in EVALUATION_DATASET:
            analysis = RuleEngine.analyze_transcript(item["transcript"])
            pred_urgency = analysis.provisional_urgency
            actual_urgency = item["expected_urgency"]

            # Record in confusion matrix
            if actual_urgency in cm and pred_urgency in cm[actual_urgency]:
                cm[actual_urgency][pred_urgency] += 1

            # Urgency check
            is_urgency_correct = (pred_urgency == actual_urgency)
            if is_urgency_correct:
                correct_urgency += 1
            else:
                # Check for critical under-triage
                if actual_urgency == "High" and pred_urgency in ["Low", "Medium"]:
                    under_triage_count += 1

            if actual_urgency == "High":
                high_urgency_cases += 1

            # Category overlap check
            pred_cats_lower = [c.lower() for c in analysis.incident_categories]
            expected_cats_lower = [c.lower() for c in item["expected_categories"]]
            # Check if any expected category matches or shares semantic root
            has_cat_match = any(
                any(exp_word in pred_cat for exp_word in exp_cat.split() if len(exp_word) > 3)
                for exp_cat in expected_cats_lower
                for pred_cat in pred_cats_lower
            )
            if has_cat_match:
                correct_category_overlap += 1

            # Missing info check
            actual_loc_incomplete = item["expected_location_incomplete"]
            pred_loc_incomplete = analysis.location.is_vague_or_incomplete
            if actual_loc_incomplete == pred_loc_incomplete:
                correct_missing_info += 1

            # Record error cases if any discrepancy
            if not is_urgency_correct or not has_cat_match:
                error_cases.append({
                    "test_id": item["id"],
                    "case_name": item["name"],
                    "actual_urgency": actual_urgency,
                    "predicted_urgency": pred_urgency,
                    "actual_categories": item["expected_categories"],
                    "predicted_categories": analysis.incident_categories,
                    "is_under_triage": (actual_urgency == "High" and pred_urgency in ["Low", "Medium"]),
                    "explanation": item["notes"],
                    "transcript_snippet": item["transcript"][:90] + "..."
                })

        total = len(EVALUATION_DATASET)
        urgency_acc = round(correct_urgency / total * 100, 1)
        category_acc = round(correct_category_overlap / total * 100, 1)
        missing_acc = round(correct_missing_info / total * 100, 1)
        under_triage_rate = round((under_triage_count / max(high_urgency_cases, 1)) * 100, 1)

        return EvaluationMetrics(
            total_test_cases=total,
            category_accuracy=category_acc,
            urgency_accuracy=urgency_acc,
            missing_info_detection_rate=missing_acc,
            under_triage_rate=under_triage_rate,
            under_triage_count=under_triage_count,
            confusion_matrix=cm,
            error_cases=error_cases,
            evaluated_at=datetime.utcnow().isoformat()
        )
