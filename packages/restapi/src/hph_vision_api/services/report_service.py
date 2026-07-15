from __future__ import annotations

from fastapi import status

from hph_vision_api.adapters.object_storage import (
    FakeObjectStorageAdapter,
    ObjectStorageUrl,
)
from hph_vision_api.adapters.persistence import (
    InMemoryRepository,
    ReportRecord,
    utc_now,
)
from hph_vision_api.errors import ApiError
from hph_vision_core import build_screening_report


class ReportService:
    def __init__(
        self,
        repository: InMemoryRepository,
        object_storage: FakeObjectStorageAdapter,
    ) -> None:
        self.repository = repository
        self.object_storage = object_storage

    def create_report(
        self,
        session_id: str,
        report_id: str | None = None,
    ) -> ReportRecord:
        session = self.repository.get_session(session_id)
        if session is None:
            raise ApiError(
                code="not_found",
                message="Session was not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        resolved_report_id = report_id or f"report_{session.id}"
        if self.repository.get_report(resolved_report_id) is not None:
            raise ApiError(
                code="conflict",
                message="Report already exists.",
                status_code=status.HTTP_409_CONFLICT,
            )
        report = build_screening_report(
            session.submission,
            report_id=resolved_report_id,
            created_at=utc_now(),
        )
        return self.repository.create_report(report, session_id=session_id)

    def get_report(self, report_id: str) -> ReportRecord:
        record = self.repository.get_report(report_id)
        if record is None:
            raise ApiError(
                code="not_found",
                message="Report was not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return record

    def create_upload_url(self, report_id: str) -> ObjectStorageUrl:
        self.get_report(report_id)
        return self.object_storage.create_upload_url(report_id)

    def create_download_url(self, report_id: str) -> ObjectStorageUrl:
        self.get_report(report_id)
        return self.object_storage.create_download_url(report_id)
