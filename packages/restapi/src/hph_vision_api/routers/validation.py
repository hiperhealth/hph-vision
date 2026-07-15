from __future__ import annotations

from fastapi import APIRouter, Depends

from hph_vision_api.adapters.auth import Actor
from hph_vision_api.dependencies import get_current_actor
from hph_vision_api.schemas.sessions import (
    SessionSubmissionRequest,
    validation_to_schema,
    warning_core_to_schema,
)
from hph_vision_api.schemas.validation import SessionValidationResponse
from hph_vision_core import evaluate_session_submission

router = APIRouter(prefix="/api/v1/validation", tags=["validation"])


@router.post("/sessions/check", response_model=SessionValidationResponse)
def check_session_submission(
    request: SessionSubmissionRequest,
    _actor: Actor = Depends(get_current_actor),
) -> SessionValidationResponse:
    evaluation = evaluate_session_submission(request.to_core())
    return SessionValidationResponse(
        validation=validation_to_schema(evaluation),
        recommendation=evaluation.recommendation,
        canStore=evaluation.can_store,
        canSubmitForClinicianReview=evaluation.can_submit_for_clinician_review,
        warnings=[warning_core_to_schema(item) for item in evaluation.warnings],
    )
