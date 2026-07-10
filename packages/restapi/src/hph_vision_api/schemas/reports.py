from __future__ import annotations

from datetime import datetime

from pydantic import Field

from hph_vision_api.schemas.common import ApiModel, DomainWarningSchema
from hph_vision_api.schemas.sessions import (
    DeviceProfileSchema,
    ProtocolVersionsSchema,
    ReliabilityResultSchema,
    warning_core_to_schema,
)
from hph_vision_core import ScreeningReport


class ReportCreateRequest(ApiModel):
    session_id: str = Field(alias="sessionId")
    client_session_id: str | None = Field(default=None, alias="clientSessionId")
    report_id: str | None = Field(default=None, alias="reportId")


class ReportResponse(ApiModel):
    id: str
    session_id: str = Field(alias="sessionId")
    client_session_id: str | None = Field(default=None, alias="clientSessionId")
    created_at: datetime = Field(alias="createdAt")
    recommendation: str
    disclaimer: str
    reliability: ReliabilityResultSchema
    warnings: list[DomainWarningSchema] = Field(default_factory=list)
    device_profile: DeviceProfileSchema | None = Field(
        default=None,
        alias="deviceProfile",
    )
    protocol_versions: ProtocolVersionsSchema | None = Field(
        default=None,
        alias="protocolVersions",
    )
    app_version: str | None = Field(default=None, alias="appVersion")
    library_version: str | None = Field(default=None, alias="libraryVersion")

    @classmethod
    def from_core(
        cls,
        report: ScreeningReport,
        *,
        session_id: str | None = None,
    ) -> ReportResponse:
        return cls(
            id=report.id,
            sessionId=session_id or report.session_id,
            clientSessionId=report.session_id,
            createdAt=report.created_at,
            recommendation=report.recommendation,
            disclaimer=report.disclaimer,
            reliability=ReliabilityResultSchema(
                score=report.reliability.score,
                level=report.reliability.level,
                warnings=[
                    warning_core_to_schema(item) for item in report.reliability.warnings
                ],
            ),
            warnings=[warning_core_to_schema(item) for item in report.warnings],
            deviceProfile=(
                DeviceProfileSchema.from_core(report.device_profile)
                if report.device_profile
                else None
            ),
            protocolVersions=(
                ProtocolVersionsSchema(
                    acuity=report.protocol_versions.acuity,
                    refraction=report.protocol_versions.refraction,
                    template=report.protocol_versions.template,
                    report=report.protocol_versions.report,
                )
                if report.protocol_versions
                else None
            ),
            appVersion=report.app_version,
            libraryVersion=report.library_version,
        )


class ReportUrlResponse(ApiModel):
    report_id: str = Field(alias="reportId")
    url: str
    expires_in_seconds: int = Field(alias="expiresInSeconds")
    method: str
