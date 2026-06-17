from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from hph_vision_core import ScreeningReport, SessionEvaluation, SessionSubmission
from hph_vision_core.clinician_review import ReviewStatus


def utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True)
class SessionRecord:
    id: str
    submission: SessionSubmission
    evaluation: SessionEvaluation
    status: str
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class ReportRecord:
    id: str
    session_id: str
    report: ScreeningReport
    created_at: datetime


@dataclass(frozen=True)
class ClinicianReviewRecord:
    id: str
    session_id: str
    status: ReviewStatus
    created_at: datetime
    updated_at: datetime
    reasons: tuple[str, ...] = ()


class InMemoryRepository:
    def __init__(self) -> None:
        self.sessions: dict[str, SessionRecord] = {}
        self.reports: dict[str, ReportRecord] = {}
        self.review_submissions: dict[str, ClinicianReviewRecord] = {}

    def create_session(
        self,
        submission: SessionSubmission,
        evaluation: SessionEvaluation,
    ) -> SessionRecord:
        created_at = utc_now()
        record = SessionRecord(
            id=f"sess_{uuid4().hex}",
            submission=submission,
            evaluation=evaluation,
            status="accepted",
            created_at=created_at,
            updated_at=created_at,
        )
        self.sessions[record.id] = record
        return record

    def get_session(self, session_id: str) -> SessionRecord | None:
        return self.sessions.get(session_id)

    def update_session_status(
        self,
        session_id: str,
        status: str,
    ) -> SessionRecord | None:
        record = self.sessions.get(session_id)
        if record is None:
            return None
        updated = SessionRecord(
            id=record.id,
            submission=record.submission,
            evaluation=record.evaluation,
            status=status,
            created_at=record.created_at,
            updated_at=utc_now(),
        )
        self.sessions[session_id] = updated
        return updated

    def create_report(
        self,
        report: ScreeningReport,
        session_id: str,
    ) -> ReportRecord:
        record = ReportRecord(
            id=report.id,
            session_id=session_id,
            report=report,
            created_at=utc_now(),
        )
        self.reports[record.id] = record
        return record

    def get_report(self, report_id: str) -> ReportRecord | None:
        return self.reports.get(report_id)

    def create_review_submission(
        self,
        session_id: str,
        reasons: tuple[str, ...] = (),
    ) -> ClinicianReviewRecord:
        created_at = utc_now()
        record = ClinicianReviewRecord(
            id=f"review_{uuid4().hex}",
            session_id=session_id,
            status="queued",
            created_at=created_at,
            updated_at=created_at,
            reasons=reasons,
        )
        self.review_submissions[record.id] = record
        return record

    def get_review_submission(self, submission_id: str) -> ClinicianReviewRecord | None:
        return self.review_submissions.get(submission_id)

    def update_review_status(
        self,
        submission_id: str,
        status: ReviewStatus,
    ) -> ClinicianReviewRecord | None:
        record = self.review_submissions.get(submission_id)
        if record is None:
            return None
        updated = ClinicianReviewRecord(
            id=record.id,
            session_id=record.session_id,
            status=status,
            created_at=record.created_at,
            updated_at=utc_now(),
            reasons=record.reasons,
        )
        self.review_submissions[submission_id] = updated
        return updated
