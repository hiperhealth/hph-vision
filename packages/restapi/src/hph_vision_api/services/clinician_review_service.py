from __future__ import annotations

from fastapi import status

from hph_vision_api.adapters.notifications import NoopNotificationAdapter
from hph_vision_api.adapters.persistence import (
    ClinicianReviewRecord,
    InMemoryRepository,
)
from hph_vision_api.errors import ApiError, validation_errors_to_details
from hph_vision_api.schemas.common import ErrorDetail
from hph_vision_core.clinician_review import (
    determine_clinician_review_eligibility,
    validate_review_status_transition,
)


class ClinicianReviewService:
    def __init__(
        self,
        repository: InMemoryRepository,
        notifications: NoopNotificationAdapter | None = None,
    ) -> None:
        self.repository = repository
        self.notifications = notifications or NoopNotificationAdapter()

    def submit_session_for_review(self, session_id: str) -> ClinicianReviewRecord:
        session = self.repository.get_session(session_id)
        if session is None:
            raise ApiError(
                code="not_found",
                message="Session was not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        eligibility = determine_clinician_review_eligibility(session.submission)
        if not eligibility.eligible:
            details = validation_errors_to_details(eligibility.validation.errors)
            details.extend(
                ErrorDetail(
                    field="sessionId",
                    message=reason,
                    code="clinician_review_ineligible",
                )
                for reason in eligibility.reasons
            )
            raise ApiError(
                code="validation_error",
                message="Session is not eligible for clinician review.",
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                details=details,
            )
        record = self.repository.create_review_submission(session_id=session_id)
        self.notifications.clinician_review_submitted(record.id)
        return record

    def get_submission(self, submission_id: str) -> ClinicianReviewRecord:
        record = self.repository.get_review_submission(submission_id)
        if record is None:
            raise ApiError(
                code="not_found",
                message="Clinician-review submission was not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return record

    def cancel_submission(self, submission_id: str) -> ClinicianReviewRecord:
        record = self.get_submission(submission_id)
        validation = validate_review_status_transition(record.status, "cancelled")
        if not validation.ok:
            raise ApiError(
                code="conflict",
                message="Clinician-review submission cannot be cancelled.",
                status_code=status.HTTP_409_CONFLICT,
                details=validation_errors_to_details(validation.errors),
            )
        updated = self.repository.update_review_status(submission_id, "cancelled")
        if updated is None:
            raise ApiError(
                code="not_found",
                message="Clinician-review submission was not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return updated
