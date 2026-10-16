"""
SQLite storage service for eSahaay cases and operator reviews.
Provides CRUD, search, filtering, and aggregated statistics for the Overview dashboard.
Pre-seeds realistic demo cases on initialization.
"""

import sqlite3
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.config import settings
from app.models.schemas import IncidentAnalysis, HumanReviewUpdate, StoredCase
from app.data.demo_cases import SYNTHETIC_DEMO_CASES
from app.services.rule_engine import RuleEngine

logger = logging.getLogger("esahaay.case_store")

class CaseStore:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.DATABASE_PATH
        self._init_db()
        self._seed_initial_demo_cases_if_empty()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS cases (
                case_id TEXT PRIMARY KEY,
                transcript TEXT NOT NULL,
                analysis_json TEXT NOT NULL,
                review_json TEXT,
                provisional_urgency TEXT NOT NULL,
                reviewed_urgency TEXT,
                review_status TEXT NOT NULL,
                has_missing_or_contradiction INTEGER NOT NULL DEFAULT 0,
                is_demo_case INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """)
            conn.commit()

    def _seed_initial_demo_cases_if_empty(self):
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM cases;")
            count = cur.fetchone()[0]
            if count == 0:
                logger.info("Database is empty. Seeding initial synthetic demo cases.")
                for demo in SYNTHETIC_DEMO_CASES:
                    analysis = RuleEngine.analyze_transcript(
                        transcript=demo["transcript"],
                        language_hint=demo.get("language_hint"),
                        incident_time_hint=demo.get("incident_time_hint"),
                        operator_notes=demo.get("operator_notes")
                    )
                    analysis.case_id = demo["id"]
                    
                    has_flags = 1 if (analysis.missing_information or analysis.contradictions_detected) else 0
                    now = datetime.utcnow().isoformat()
                    
                    # Pre-populate review on one demo case to show reviewed state
                    review_json = None
                    reviewed_urg = None
                    status = "Pending Review"
                    if demo["id"] == "DEMO-001":
                        status = "Reviewed & Verified"
                        reviewed_urg = "Medium"
                        review = HumanReviewUpdate(
                            case_id=demo["id"],
                            reviewed_urgency="Medium",
                            reviewed_categories=analysis.incident_categories,
                            operator_notes="Verified with caller. Stalker followed from campus gate. Caller advised on safe route.",
                            verification_status="Verified",
                            review_status="Reviewed & Verified",
                            reviewer_id="Operator-84"
                        )
                        review_json = review.model_dump_json()

                    cur.execute("""
                    INSERT INTO cases (
                        case_id, transcript, analysis_json, review_json,
                        provisional_urgency, reviewed_urgency, review_status,
                        has_missing_or_contradiction, is_demo_case, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?);
                    """, (
                        analysis.case_id,
                        demo["transcript"],
                        analysis.model_dump_json(),
                        review_json,
                        analysis.provisional_urgency,
                        reviewed_urg,
                        status,
                        has_flags,
                        now,
                        now
                    ))
                conn.commit()

    def save_analysis(self, transcript: str, analysis: IncidentAnalysis, is_demo: bool = False) -> StoredCase:
        now = datetime.utcnow().isoformat()
        has_flags = 1 if (analysis.missing_information or analysis.contradictions_detected) else 0
        
        with self._get_connection() as conn:
            conn.execute("""
            INSERT OR REPLACE INTO cases (
                case_id, transcript, analysis_json, review_json,
                provisional_urgency, reviewed_urgency, review_status,
                has_missing_or_contradiction, is_demo_case, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                analysis.case_id,
                transcript,
                analysis.model_dump_json(),
                None,
                analysis.provisional_urgency,
                None,
                "Pending Review",
                has_flags,
                1 if is_demo else 0,
                now,
                now
            ))
            conn.commit()
            
        return StoredCase(
            case_id=analysis.case_id,
            transcript=transcript,
            analysis=analysis,
            review=None,
            created_at=now,
            updated_at=now,
            is_demo_case=is_demo
        )

    def update_review(self, review: HumanReviewUpdate) -> Optional[StoredCase]:
        case = self.get_case(review.case_id)
        if not case:
            return None
            
        now = datetime.utcnow().isoformat()
        with self._get_connection() as conn:
            conn.execute("""
            UPDATE cases
            SET review_json = ?, reviewed_urgency = ?, review_status = ?, updated_at = ?
            WHERE case_id = ?;
            """, (
                review.model_dump_json(),
                review.reviewed_urgency,
                review.review_status,
                now,
                review.case_id
            ))
            conn.commit()

        case.review = review
        case.updated_at = now
        return case

    def get_case(self, case_id: str) -> Optional[StoredCase]:
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM cases WHERE case_id = ?;", (case_id,))
            row = cur.fetchone()
            if not row:
                return None
            return self._row_to_case(row)

    def delete_case(self, case_id: str) -> bool:
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM cases WHERE case_id = ?;", (case_id,))
            conn.commit()
            return cur.rowcount > 0

    def list_cases(
        self,
        query: Optional[str] = None,
        urgency: Optional[str] = None,
        review_status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[StoredCase]:
        sql = "SELECT * FROM cases WHERE 1=1"
        params: List[Any] = []

        if query:
            sql += " AND (case_id LIKE ? OR transcript LIKE ? OR analysis_json LIKE ?)"
            term = f"%{query}%"
            params.extend([term, term, term])

        if urgency and urgency != "All":
            sql += " AND (reviewed_urgency = ? OR (reviewed_urgency IS NULL AND provisional_urgency = ?))"
            params.extend([urgency, urgency])

        if review_status and review_status != "All":
            sql += " AND review_status = ?"
            params.append(review_status)

        sql += " ORDER BY updated_at DESC LIMIT ? OFFSET ?;"
        params.extend([limit, offset])

        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute(sql, params)
            rows = cur.fetchall()
            return [self._row_to_case(r) for r in rows]

    def get_overview_statistics(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM cases;")
            total_cases = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM cases WHERE review_status = 'Pending Review';")
            pending_review = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM cases WHERE has_missing_or_contradiction = 1;")
            flagged_missing_or_conflict = cur.fetchone()[0]

            cur.execute("""
            SELECT 
                COALESCE(reviewed_urgency, provisional_urgency) as eff_urgency,
                COUNT(*) as count
            FROM cases
            GROUP BY eff_urgency;
            """)
            urgency_rows = cur.fetchall()
            urgency_dist = {"High": 0, "Medium": 0, "Low": 0, "Unable to Determine": 0}
            for row in urgency_rows:
                k = row["eff_urgency"]
                if k in urgency_dist:
                    urgency_dist[k] = row["count"]
                else:
                    urgency_dist["Unable to Determine"] += row["count"]

            # Recent 5 cases
            cur.execute("SELECT * FROM cases ORDER BY updated_at DESC LIMIT 5;")
            recent_rows = cur.fetchall()
            recent_cases = [self._row_to_case(r) for r in recent_rows]

            return {
                "total_cases": total_cases,
                "pending_review": pending_review,
                "flagged_missing_or_conflict": flagged_missing_or_conflict,
                "urgency_distribution": urgency_dist,
                "recent_cases": [c.model_dump() for c in recent_cases],
                "is_demo_dataset": True,
                "disclaimer": "Sample statistics derived from local demo dataset. All urgency assessments require human operator verification."
            }

    def _row_to_case(self, row: sqlite3.Row) -> StoredCase:
        analysis_dict = json.loads(row["analysis_json"])
        analysis = IncidentAnalysis(**analysis_dict)
        
        review = None
        if row["review_json"]:
            review_dict = json.loads(row["review_json"])
            review = HumanReviewUpdate(**review_dict)

        return StoredCase(
            case_id=row["case_id"],
            transcript=row["transcript"],
            analysis=analysis,
            review=review,
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            is_demo_case=bool(row["is_demo_case"])
        )

# Global singleton store
case_store = CaseStore()
