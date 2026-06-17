from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from hph_vision_api.adapters.auth import Actor
from hph_vision_api.adapters.persistence import (
    ClinicianReviewRecord,
    InMemoryRepository,
)
from hph_vision_api.dependencies import get_current_actor, get_repository
from hph_vision_api.schemas.clinician_review import (
    ClinicianReviewCreateRequest,
    ClinicianReviewStatusResponse,
    ClinicianReviewSubmissionResponse,
)
from hph_vision_api.services.clinician_review_service import ClinicianReviewService

router = APIRouter(
    prefix="/api/v1/clinician-review/submissions",
    tags=["clinician-review"],
)


def _review_service(
    repository: Annotated[InMemoryRepository, Depends(get_repository)],
) -> ClinicianReviewService:
    return ClinicianReviewService(repository)


def review_record_to_response(
    record: ClinicianReviewRecord,
) -> ClinicianReviewSubmissionResponse:
    return ClinicianReviewSubmissionResponse(
        id=record.id,
        sessionId=record.session_id,
        status=record.status,
        createdAt=record.created_at,
        updatedAt=record.updated_at,
        reasons=list(record.reasons),
    )


@router.post("", response_model=ClinicianReviewSubmissionResponse, status_code=201)
def submit_for_review(
    request: ClinicianReviewCreateRequest,
    service: Annotated[ClinicianReviewService, Depends(_review_service)],
    _actor: Annotated[Actor, Depends(get_current_actor)],
) -> ClinicianReviewSubmissionResponse:
    return review_record_to_response(
        service.submit_session_for_review(request.session_id)
    )


@router.get("/{submission_id}", response_model=ClinicianReviewSubmissionResponse)
def get_review_submission(
    submission_id: str,
    service: Annotated[ClinicianReviewService, Depends(_review_service)],
    _actor: Annotated[Actor, Depends(get_current_actor)],
) -> ClinicianReviewSubmissionResponse:
    return review_record_to_response(service.get_submission(submission_id))


@router.get("/{submission_id}/status", response_model=ClinicianReviewStatusResponse)
def get_review_status(
    submission_id: str,
    service: Annotated[ClinicianReviewService, Depends(_review_service)],
    _actor: Annotated[Actor, Depends(get_current_actor)],
) -> ClinicianReviewStatusResponse:
    record = service.get_submission(submission_id)
    return ClinicianReviewStatusResponse(
        id=record.id,
        status=record.status,
        updatedAt=record.updated_at,
    )


@router.post(
    "/{submission_id}/cancel",
    response_model=ClinicianReviewSubmissionResponse,
)
def cancel_review_submission(
    submission_id: str,
    service: Annotated[ClinicianReviewService, Depends(_review_service)],
    _actor: Annotated[Actor, Depends(get_current_actor)],
) -> ClinicianReviewSubmissionResponse:
    return review_record_to_response(service.cancel_submission(submission_id))
