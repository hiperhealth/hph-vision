from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from hph_vision_api.adapters.auth import Actor
from hph_vision_api.adapters.object_storage import FakeObjectStorageAdapter
from hph_vision_api.adapters.persistence import InMemoryRepository
from hph_vision_api.dependencies import (
    get_current_actor,
    get_object_storage,
    get_repository,
)
from hph_vision_api.schemas.reports import (
    ReportCreateRequest,
    ReportResponse,
    ReportUrlResponse,
)
from hph_vision_api.services.report_service import ReportService

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


def _report_service(
    repository: Annotated[InMemoryRepository, Depends(get_repository)],
    object_storage: Annotated[FakeObjectStorageAdapter, Depends(get_object_storage)],
) -> ReportService:
    return ReportService(repository, object_storage)


@router.post("", response_model=ReportResponse, status_code=201)
def create_report(
    request: ReportCreateRequest,
    service: Annotated[ReportService, Depends(_report_service)],
    _actor: Annotated[Actor, Depends(get_current_actor)],
) -> ReportResponse:
    record = service.create_report(
        session_id=request.session_id,
        report_id=request.report_id,
    )
    return ReportResponse.from_core(record.report, session_id=record.session_id)


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: str,
    service: Annotated[ReportService, Depends(_report_service)],
    _actor: Annotated[Actor, Depends(get_current_actor)],
) -> ReportResponse:
    record = service.get_report(report_id)
    return ReportResponse.from_core(record.report, session_id=record.session_id)


@router.post("/{report_id}/upload-url", response_model=ReportUrlResponse)
def create_report_upload_url(
    report_id: str,
    service: Annotated[ReportService, Depends(_report_service)],
    _actor: Annotated[Actor, Depends(get_current_actor)],
) -> ReportUrlResponse:
    url = service.create_upload_url(report_id)
    return ReportUrlResponse(
        reportId=report_id,
        url=url.url,
        expiresInSeconds=url.expires_in_seconds,
        method=url.method,
    )


@router.get("/{report_id}/download-url", response_model=ReportUrlResponse)
def create_report_download_url(
    report_id: str,
    service: Annotated[ReportService, Depends(_report_service)],
    _actor: Annotated[Actor, Depends(get_current_actor)],
) -> ReportUrlResponse:
    url = service.create_download_url(report_id)
    return ReportUrlResponse(
        reportId=report_id,
        url=url.url,
        expiresInSeconds=url.expires_in_seconds,
        method=url.method,
    )
