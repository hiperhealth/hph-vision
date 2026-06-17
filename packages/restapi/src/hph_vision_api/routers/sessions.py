from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from hph_vision_api.adapters.auth import Actor
from hph_vision_api.adapters.persistence import InMemoryRepository, SessionRecord
from hph_vision_api.dependencies import get_current_actor, get_repository
from hph_vision_api.schemas.sessions import (
    SessionAcceptedResponse,
    SessionPatchRequest,
    SessionRecordResponse,
    SessionSubmissionRequest,
    validation_to_schema,
    warning_core_to_schema,
)
from hph_vision_api.services.session_service import SessionService

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


def _session_service(
    repository: Annotated[InMemoryRepository, Depends(get_repository)],
) -> SessionService:
    return SessionService(repository)


def session_record_to_response(record: SessionRecord) -> SessionRecordResponse:
    return SessionRecordResponse(
        id=record.id,
        clientSessionId=record.submission.client_session_id,
        status=record.status,
        createdAt=record.created_at,
        recommendation=record.evaluation.recommendation,
        canSubmitForClinicianReview=record.evaluation.can_submit_for_clinician_review,
        validation=validation_to_schema(record.evaluation),
        warnings=[warning_core_to_schema(item) for item in record.evaluation.warnings],
        appVersion=record.submission.app_version,
        libraryVersion=record.submission.library_version,
    )


@router.post("", response_model=SessionAcceptedResponse, status_code=201)
def submit_session(
    request: SessionSubmissionRequest,
    service: Annotated[SessionService, Depends(_session_service)],
    _actor: Annotated[Actor, Depends(get_current_actor)],
) -> SessionRecordResponse:
    record = service.submit_session(request)
    return session_record_to_response(record)


@router.get("/{session_id}", response_model=SessionRecordResponse)
def get_session(
    session_id: str,
    service: Annotated[SessionService, Depends(_session_service)],
    _actor: Annotated[Actor, Depends(get_current_actor)],
) -> SessionRecordResponse:
    return session_record_to_response(service.get_session(session_id))


@router.patch("/{session_id}", response_model=SessionRecordResponse)
def patch_session(
    session_id: str,
    request: SessionPatchRequest,
    service: Annotated[SessionService, Depends(_session_service)],
    _actor: Annotated[Actor, Depends(get_current_actor)],
) -> SessionRecordResponse:
    record = service.get_session(session_id)
    if request.status:
        record = service.update_session_status(session_id, request.status)
    return session_record_to_response(record)
